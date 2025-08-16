/**
 * Main Dashboard State Hook
 * Centralized state management for dashboard components
 */

import { useState, useCallback } from 'react';
import { DashboardState, ThemeMode, UseDashboardStateReturn } from '../types/dashboard.types';
import { useTheme } from './useTheme';
import { useSidebar } from './useSidebar';

const initialState: DashboardState = {
  sidebar: {
    collapsed: false,
    activeSection: 'dashboard',
  },
  theme: {
    mode: 'light',
    isDarkMode: false,
  },
  userMenu: {
    isOpen: false,
  },
  loading: {
    stats: true,
    groups: true,
    activity: false,
  },
  error: {},
};

export function useDashboardState(): UseDashboardStateReturn {
  // Use specialized hooks for complex state
  const theme = useTheme();
  const sidebar = useSidebar();
  
  // Local state for simpler UI state
  const [userMenuOpen, setUserMenuOpenState] = useState(false);
  const [loading, setLoadingState] = useState(initialState.loading);
  const [error, setErrorState] = useState(initialState.error);

  // Compose final state
  const state: DashboardState = {
    sidebar: {
      collapsed: sidebar.collapsed,
      activeSection: sidebar.activeSection,
    },
    theme: {
      mode: theme.mode,
      isDarkMode: theme.isDarkMode,
    },
    userMenu: {
      isOpen: userMenuOpen,
    },
    loading,
    error,
  };

  // Actions
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    sidebar.setCollapsed(collapsed);
  }, [sidebar]);

  const setActiveSection = useCallback((section: string) => {
    sidebar.setActiveSection(section);
  }, [sidebar]);

  const toggleTheme = useCallback(() => {
    theme.toggle();
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    theme.setMode(mode);
  }, [theme]);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpenState(prev => !prev);
  }, []);

  const setUserMenuOpen = useCallback((open: boolean) => {
    setUserMenuOpenState(open);
  }, []);

  const setLoading = useCallback((key: keyof DashboardState['loading'], isLoading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const setError = useCallback((key: keyof DashboardState['error'], errorMessage?: string) => {
    setErrorState(prev => ({
      ...prev,
      [key]: errorMessage,
    }));
  }, []);

  return {
    state,
    actions: {
      setSidebarCollapsed,
      setActiveSection,
      toggleTheme,
      setThemeMode,
      toggleUserMenu,
      setUserMenuOpen,
      setLoading,
      setError,
    },
  };
}
