import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'cr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Import des traductions
import frTranslations from '@/locales/fr.json';
import crTranslations from '@/locales/cr.json';
import enTranslations from '@/locales/en.json';

const translations = {
  fr: frTranslations,
  cr: crTranslations,
  en: enTranslations,
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('starbeverage-language') as Language;
    if (savedLanguage && ['fr', 'cr', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  // Fonction pour obtenir une traduction
  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Si la clé n'existe pas, essayer le français comme fallback
          if (language !== 'fr') {
            let fallbackValue: any = translations.fr;
            for (const fallbackKey of keys) {
              if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
                fallbackValue = fallbackValue[fallbackKey];
              } else {
                fallbackValue = undefined;
                break;
              }
            }
            if (fallbackValue && typeof fallbackValue === 'string') {
              return fallbackValue;
            }
          }
          // Si pas de fallback, retourner la clé
          return key;
        }
      }
      
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error('Erreur de traduction:', error);
      return key;
    }
  };

  // Fonction pour changer de langue
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('starbeverage-language', newLanguage);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook pour obtenir les traductions directement
export function useTranslations() {
  const { language, t } = useLanguage();
  return {
    language,
    t,
    translations: translations[language],
  };
}

// Hook pour obtenir les noms des langues
export function useLanguageNames() {
  return {
    fr: 'Français',
    cr: 'Créole',
    en: 'English',
  };
}

export default LanguageContext;