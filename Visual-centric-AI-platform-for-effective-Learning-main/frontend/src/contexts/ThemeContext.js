import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  FOREST: 'forest',
  SUNSET: 'sunset',
  PURPLE: 'purple'
};

export const THEME_CONFIGS = {
  [THEMES.LIGHT]: {
    name: 'Light',
    description: 'Clean and bright',
    icon: '☀️',
    colors: {
      bg: 'bg-light-bg',
      sidebar: 'bg-light-sidebar',
      card: 'bg-light-card',
      border: 'border-light-border',
      text: {
        primary: 'text-light-text-primary',
        secondary: 'text-light-text-secondary',
        accent: 'text-light-text-accent'
      },
      accent: {
        primary: 'bg-light-accent-primary',
        secondary: 'bg-light-accent-secondary',
        success: 'bg-light-accent-success',
        error: 'bg-light-accent-error',
        warning: 'bg-light-accent-warning'
      }
    }
  },
  [THEMES.DARK]: {
    name: 'Dark',
    description: 'Modern and sleek',
    icon: '🌙',
    colors: {
      bg: 'bg-dark-bg',
      sidebar: 'bg-dark-sidebar',
      card: 'bg-dark-card',
      border: 'border-dark-border',
      text: {
        primary: 'text-dark-text-primary',
        secondary: 'text-dark-text-secondary',
        accent: 'text-dark-text-accent'
      },
      accent: {
        primary: 'bg-dark-accent-primary',
        secondary: 'bg-dark-accent-secondary',
        success: 'bg-dark-accent-success',
        error: 'bg-dark-accent-error',
        warning: 'bg-dark-accent-warning'
      }
    }
  },
  [THEMES.FOREST]: {
    name: 'Forest',
    description: 'Natural and soothing',
    icon: '🌲',
    colors: {
      bg: 'bg-forest-bg',
      sidebar: 'bg-forest-sidebar',
      card: 'bg-forest-card',
      border: 'border-forest-border',
      text: {
        primary: 'text-forest-text-primary',
        secondary: 'text-forest-text-secondary',
        accent: 'text-forest-text-accent'
      },
      accent: {
        primary: 'bg-forest-accent-primary',
        secondary: 'bg-forest-accent-secondary',
        success: 'bg-forest-accent-success',
        error: 'bg-forest-accent-error',
        warning: 'bg-forest-accent-warning'
      }
    }
  },
  [THEMES.SUNSET]: {
    name: 'Sunset',
    description: 'Warm and energetic',
    icon: '🌅',
    colors: {
      bg: 'bg-sunset-bg',
      sidebar: 'bg-sunset-sidebar',
      card: 'bg-sunset-card',
      border: 'border-sunset-border',
      text: {
        primary: 'text-sunset-text-primary',
        secondary: 'text-sunset-text-secondary',
        accent: 'text-sunset-text-accent'
      },
      accent: {
        primary: 'bg-sunset-accent-primary',
        secondary: 'bg-sunset-accent-secondary',
        success: 'bg-sunset-accent-success',
        error: 'bg-sunset-accent-error',
        warning: 'bg-sunset-accent-warning'
      }
    }
  },
  [THEMES.PURPLE]: {
    name: 'Purple',
    description: 'Mystical and creative',
    icon: '🔮',
    colors: {
      bg: 'bg-green-bg',
      sidebar: 'bg-purple-sidebar',
      card: 'bg-purple-card',
      border: 'border-purple-border',
      text: {
        primary: 'text-purple-text-primary',
        secondary: 'text-purple-text-secondary',
        accent: 'text-purple-text-accent'
      },
      accent: {
        primary: 'bg-purple-accent-primary',
        secondary: 'bg-purple-accent-secondary',
        success: 'bg-purple-accent-success',
        error: 'bg-purple-accent-error',
        warning: 'bg-purple-accent-warning'
      }
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && Object.values(THEMES).includes(saved) ? saved : THEMES.DARK;
  });

  useEffect(() => {
    // Apply theme to body class
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${currentTheme}`);
    
    // Save to localStorage
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setCurrentTheme(newTheme);
    }
  };

  const getThemeConfig = () => THEME_CONFIGS[currentTheme];

  const value = {
    currentTheme,
    changeTheme,
    getThemeConfig,
    themes: THEME_CONFIGS,
    availableThemes: Object.values(THEMES)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeContext };
