/**
 * Modern Dashboard Header Component
 * Sleek, professional header with glass morphism and modern interactions
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { Menu, ChevronLeft, User, Moon, Sun, Bell, Search, MessageSquare, Zap } from 'lucide-react';
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
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900/80 border-slate-700/50' 
        : 'bg-white/80 border-gray-200/50'
    } backdrop-blur-xl border-b shadow-lg shadow-black/5`}>
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/50'
              } shadow-sm`}
            >
              {sidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
            
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  StartupMatch
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Professional Edition
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search co-founders, projects..."
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDarkMode 
                    ? 'bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-400 focus:bg-slate-800' 
                    : 'bg-gray-50/50 border-gray-200/50 text-gray-900 placeholder-gray-500 focus:bg-white'
                } backdrop-blur-sm shadow-sm`}
              />
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {/* Messages Quick Access */}
              <button className={`relative p-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/50'
              } shadow-sm group`}>
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  2
                </span>
                <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'
                } whitespace-nowrap`}>
                  Messages
                </div>
              </button>

              {/* Notifications */}
              <div className="relative">
                <NotificationCenter />
              </div>
              
              {/* Theme Toggle */}
              <button 
                onClick={onToggleTheme}
                className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/50'
                } shadow-sm group`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'
                } whitespace-nowrap`}>
                  {isDarkMode ? 'Light mode' : 'Dark mode'}
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            
            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={onToggleUserMenu}
                className={`flex items-center space-x-3 p-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 border border-slate-700/50' 
                    : 'hover:bg-gray-100 border border-gray-200/50'
                } shadow-sm group`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:block text-left">
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Founder
                  </div>
                </div>
                <svg className={`w-4 h-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''} ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
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
