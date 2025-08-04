import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    secondary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    accent: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Your specified color palette
const colorPalette = {
  primary: {
    50: '#f0f9ff',   // Lightest blue tint
    100: '#e0f2fe',  // Very light blue
    200: '#bae6fd',  // Light blue
    300: '#7dd3fc',  // Medium light blue
    400: '#38bdf8',  // Medium blue
    500: '#00B4D8',  // Your specified color
    600: '#0077B6',  // Your specified color
    700: '#0369a1',  // Darker blue
    800: '#075985',  // Even darker blue
    900: '#03045E',  // Your specified darkest color
  },
  secondary: {
    50: '#f0fdff',   // Lightest cyan tint
    100: '#ccfbf1',  // Very light cyan
    200: '#99f6e4',  // Light cyan
    300: '#5eead4',  // Medium light cyan
    400: '#2dd4bf',  // Medium cyan
    500: '#90E0EF',  // Your specified color
    600: '#0891b2',  // Darker cyan
    700: '#0e7490',  // Even darker cyan
    800: '#155e75',  // Very dark cyan
    900: '#164e63',  // Darkest cyan
  },
  accent: {
    50: '#f0fdfa',   // Lightest teal tint
    100: '#ccfbf1',  // Very light teal
    200: '#99f6e4',  // Light teal
    300: '#5eead4',  // Medium light teal
    400: '#2dd4bf',  // Medium teal
    500: '#CAF0F8',  // Your specified color
    600: '#0d9488',  // Darker teal
    700: '#0f766e',  // Even darker teal
    800: '#115e59',  // Very dark teal
    900: '#134e4a',  // Darkest teal
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference, default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Apply CSS custom properties for colors
    Object.entries(colorPalette).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        root.style.setProperty(`--color-${colorName}-${shade}`, value);
      });
    });
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    colors: colorPalette,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 