/**
 * Theme Management Hook
 * Handles light/dark theme state and persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { ThemeMode, UseThemeReturn } from '../types/dashboard.types';

const THEME_STORAGE_KEY = 'startupMatch-theme';

export function useTheme(): UseThemeReturn {
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setModeState(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setModeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    
    // Apply theme to document root for global CSS
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setModeState(prevMode => prevMode === 'light' ? 'dark' : 'light');
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  return {
    mode,
    isDarkMode: mode === 'dark',
    toggle,
    setMode,
  };
}
