/**
 * Dashboard Header Component
 * Clean header with sidebar toggle, title, and user actions
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { Menu, ChevronLeft, User, Moon, Sun, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationCenter from '@/components/NotificationCenter';
import { UserMenu } from './UserMenu';
import { DashboardHeaderProps } from '../types/dashboard.types';

export function DashboardHeader({
  onToggleSidebar,
  sidebarCollapsed,
  isDarkMode,
  onToggleTheme,
  user,
  userMenuOpen,
  onToggleUserMenu,
  onCloseUserMenu,
  onSignOut
}: DashboardHeaderProps & {
  userMenuOpen: boolean;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  onSignOut: () => Promise<void>;
}) {
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        onCloseUserMenu();
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen, onCloseUserMenu]);

  return (
    <header className={`shadow-sm border-b sticky top-0 z-40 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className={`transition-colors duration-300 ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {sidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
            <h1 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              StartupMatch
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleTheme}
              className={`transition-colors duration-300 ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleUserMenu}
                className={`transition-colors duration-300 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="h-5 w-5" />
              </Button>
              
              <UserMenu
                user={user}
                isOpen={userMenuOpen}
                onClose={onCloseUserMenu}
                onSignOut={onSignOut}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
