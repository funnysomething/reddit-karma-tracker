'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  systemPreference: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [systemPreference, setSystemPreference] = useState<Theme>('light');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(defaultTheme);
  const [theme, setTheme] = useState<Theme>('light');

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = () => {
      setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemPreference();
    mediaQuery.addEventListener('change', updateSystemPreference);

    return () => mediaQuery.removeEventListener('change', updateSystemPreference);
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme-preference');
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemePreferenceState(stored as ThemePreference);
      }
    } catch (error) {
      console.warn('Failed to load theme preference from localStorage:', error);
    }
  }, []);

  // Calculate actual theme based on preference and system
  useEffect(() => {
    const actualTheme = themePreference === 'system' ? systemPreference : themePreference;
    setTheme(actualTheme);
  }, [themePreference, systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      localStorage.setItem('theme-preference', preference);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }
  };

  const toggleTheme = () => {
    if (themePreference === 'system') {
      // If currently system, toggle to opposite of system preference
      setThemePreference(systemPreference === 'light' ? 'dark' : 'light');
    } else {
      // If currently light/dark, toggle to opposite
      setThemePreference(theme === 'light' ? 'dark' : 'light');
    }
  };

  const value: ThemeContextType = {
    theme,
    themePreference,
    toggleTheme,
    setThemePreference,
    systemPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}