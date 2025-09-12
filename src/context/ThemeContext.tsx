import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // Le thème réellement appliqué
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Fonction pour obtenir le thème système
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Fonction pour appliquer le thème
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const resolvedTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    // Supprimer les classes de thème existantes
    root.classList.remove('light', 'dark');
    
    // Ajouter la nouvelle classe de thème
    root.classList.add(resolvedTheme);
    
    // Mettre à jour l'attribut data-theme
    root.setAttribute('data-theme', resolvedTheme);
    
    setActualTheme(resolvedTheme);
  };

  // Fonction pour définir le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Initialiser le thème au chargement
  useEffect(() => {
    // Récupérer le thème sauvegardé ou utiliser 'system' par défaut
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Réappliquer le thème quand le thème change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
