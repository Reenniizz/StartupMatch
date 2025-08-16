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

  // Mock data for now - replace with real API calls
  const mockStats = {
    connections: {
      total: 247,
      weeklyChange: 12,
      weeklyChangeText: '+12% vs semana anterior'
    },
    matches: {
      total: 18,
      dailyNew: 5,
      dailyNewText: '+5 nuevos hoy'
    },
    conversations: {
      total: 1284,
      unread: 8,
      unreadText: '8 sin leer'
    },
    successRate: {
      percentage: 89,
      change: 3,
      changeText: '+3% vs mes anterior'
    },
  };

  const mockActivities = [
    { 
      id: '1', 
      type: 'match' as const, 
      title: 'Nuevo match perfecto', 
      description: 'María G. busca co-founder técnico', 
      timestamp: 'hace 2 min',
      timeAgo: 'hace 2 min',
      icon: 'heart',
      color: 'blue' as const,
      badge: 'Nuevo'
    },
    { 
      id: '2', 
      type: 'message' as const, 
      title: 'Mensaje recibido', 
      description: '"¡Hola! Me interesa tu proyecto..."', 
      timestamp: 'hace 15 min',
      timeAgo: 'hace 15 min',
      icon: 'message',
      color: 'green' as const
    },
  ];

  const mockSidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "Home", href: "/dashboard" },
    { id: "matches", label: "Matches", icon: "Heart", href: "/matches" },
    { id: "grupos", label: "Grupos", icon: "Users", href: "/grupos", badge: "5" },
    { id: "explore", label: "Explorar", icon: "Search", href: "/explore" },
    { id: "messages", label: "Mensajes", icon: "MessageSquare", href: "/messages", badge: "3" },
    { id: "projects", label: "Mis Proyectos", icon: "Rocket", href: "/projects" },
  ];

  const mockQuickActions = [
    { 
      id: 'matches', 
      title: 'Explorar Matches', 
      description: 'Encuentra personas compatibles con tus objetivos',
      icon: 'Heart',
      color: 'purple' as const,
      href: '/matches'
    },
    { 
      id: 'projects', 
      title: 'Crear Proyecto', 
      description: 'Comparte tu idea y encuentra co-fundadores',
      icon: 'Rocket',
      color: 'blue' as const,
      href: '/projects'
    },
    { 
      id: 'profile', 
      title: 'Completar Perfil', 
      description: 'Optimiza tu perfil para mejores matches',
      icon: 'User',
      color: 'green' as const,
      href: '/profile'
    },
  ];

  const mockGroups = [
    { 
      id: '1', 
      name: 'Fintech España', 
      memberCount: 1247,
      status: 'Activo' as const,
      initials: 'FE',
      gradient: 'from-blue-500 to-purple-500',
      recentMessages: 124
    },
    { 
      id: '2', 
      name: 'IA & Machine Learning', 
      memberCount: 892,
      status: 'Miembro' as const,
      initials: 'IA',
      gradient: 'from-green-500 to-teal-500',
      recentMessages: 89
    },
  ];

  return {
    // Data
    stats: mockStats,
    activities: mockActivities,
    groups: mockGroups,
    sidebarItems: mockSidebarItems,
    quickActions: mockQuickActions,
    
    // Loading states
    statsLoading: state.loading.stats,
    activitiesLoading: state.loading.activity,
    groupsLoading: state.loading.groups,
    
    // User menu state
    userMenuOpen: state.userMenu.isOpen,
    setUserMenuOpen,
    
    // Active section
    activeSection: state.sidebar.activeSection,
    
    // Sign out handler
    handleSignOut: async () => {
      try {
        // Add your sign out logic here
        console.log('Signing out...');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    
    // Original state and actions for backward compatibility
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
