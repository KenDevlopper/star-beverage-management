import { useLanguage } from '@/context/LanguageContext';

export interface TranslationOptions {
  [key: string]: string | number;
}

/**
 * Hook professionnel pour les traductions
 * Utilise le système de langue existant mais avec une interface plus propre
 */
export function useTranslation() {
  const { language, t } = useLanguage();

  /**
   * Traduit une clé avec des paramètres optionnels
   * @param key - Clé de traduction (ex: "orders.title")
   * @param options - Paramètres pour remplacer les placeholders
   * @returns Texte traduit
   */
  const translate = (key: string, options?: TranslationOptions): string => {
    let translation = t(key);
    
    // Remplacer les placeholders si des options sont fournies
    if (options) {
      Object.entries(options).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    
    return translation;
  };

  /**
   * Traduit une clé avec un fallback
   * @param key - Clé de traduction
   * @param fallback - Texte de fallback si la clé n'existe pas
   * @param options - Paramètres optionnels
   * @returns Texte traduit ou fallback
   */
  const translateWithFallback = (
    key: string, 
    fallback: string, 
    options?: TranslationOptions
  ): string => {
    const translation = t(key);
    
    // Si la traduction retourne la clé (pas trouvée), utiliser le fallback
    if (translation === key) {
      return fallback;
    }
    
    return translate(key, options);
  };

  /**
   * Traduit une clé de manière conditionnelle
   * @param condition - Condition pour afficher la traduction
   * @param key - Clé de traduction
   * @param fallback - Texte de fallback si condition false
   * @param options - Paramètres optionnels
   * @returns Texte traduit ou fallback
   */
  const translateConditional = (
    condition: boolean,
    key: string,
    fallback: string = '',
    options?: TranslationOptions
  ): string => {
    if (condition) {
      return translate(key, options);
    }
    return fallback;
  };

  /**
   * Traduit une liste de clés
   * @param keys - Array de clés de traduction
   * @param options - Paramètres optionnels
   * @returns Array de textes traduits
   */
  const translateArray = (keys: string[], options?: TranslationOptions): string[] => {
    return keys.map(key => translate(key, options));
  };

  /**
   * Traduit un objet avec des clés de traduction
   * @param obj - Objet avec des clés de traduction
   * @param options - Paramètres optionnels
   * @returns Objet avec les valeurs traduites
   */
  const translateObject = <T extends Record<string, any>>(
    obj: T, 
    options?: TranslationOptions
  ): T => {
    const translated: any = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        translated[key] = translate(value, options);
      } else {
        translated[key] = value;
      }
    });
    
    return translated;
  };

  /**
   * Vérifie si une clé de traduction existe
   * @param key - Clé de traduction
   * @returns true si la clé existe
   */
  const hasTranslation = (key: string): boolean => {
    return t(key) !== key;
  };

  /**
   * Obtient la langue actuelle
   * @returns Code de langue actuel
   */
  const getCurrentLanguage = (): string => {
    return language;
  };

  /**
   * Obtient le nom de la langue actuelle
   * @returns Nom de la langue actuelle
   */
  const getCurrentLanguageName = (): string => {
    const languageNames = {
      fr: 'Français',
      cr: 'Créole',
      en: 'English'
    };
    return languageNames[language as keyof typeof languageNames] || language;
  };

  return {
    // Fonctions principales
    t: translate,
    translate,
    translateWithFallback,
    translateConditional,
    translateArray,
    translateObject,
    
    // Utilitaires
    hasTranslation,
    getCurrentLanguage,
    getCurrentLanguageName,
    
    // État
    language,
    isFrench: language === 'fr',
    isCreole: language === 'cr',
    isEnglish: language === 'en'
  };
}

export default useTranslation;
