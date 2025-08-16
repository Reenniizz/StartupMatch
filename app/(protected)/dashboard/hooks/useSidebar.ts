/**
 * Sidebar Management Hook
 * Handles sidebar collapse state and active section tracking
 */

import { useState, useCallback } from 'react';
import { UseSidebarReturn } from '../types/dashboard.types';

export function useSidebar(): UseSidebarReturn {
  const [collapsed, setCollapsedState] = useState(false);
  const [activeSection, setActiveSectionState] = useState('dashboard');

  const toggle = useCallback(() => {
    setCollapsedState(prev => !prev);
  }, []);

  const setCollapsed = useCallback((newCollapsed: boolean) => {
    setCollapsedState(newCollapsed);
  }, []);

  const setActiveSection = useCallback((section: string) => {
    setActiveSectionState(section);
  }, []);

  return {
    collapsed,
    isCollapsed: collapsed, // alias
    activeSection,
    toggle,
    toggleSidebar: toggle, // alias
    setCollapsed,
    setActiveSection,
  };
}
