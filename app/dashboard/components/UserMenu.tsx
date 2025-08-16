/**
 * User Menu Component
 * Clean, focused dropdown menu for user actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';
import { UserMenuProps } from '../types/dashboard.types';

export function UserMenu({ 
  user, 
  isOpen, 
  onClose, 
  onSignOut, 
  isDarkMode 
}: UserMenuProps) {
  if (!isOpen) return null;

  const handleProfileClick = () => {
    onClose();
  };

  const handleSettingsClick = () => {
    onClose();
  };

  const handleSignOutClick = async () => {
    onClose();
    try {
      await onSignOut();
      // Redirect is handled by the auth hook
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div 
      className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-200'
      }`}
      style={{ position: 'absolute', top: '100%', right: 0 }}
    >
      <div className="p-2">
        {/* User Info */}
        <div className={`px-3 py-2 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-100'
        }`}>
          <p className={`text-xs font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Conectado como
          </p>
          <p className={`text-sm font-semibold mt-1 truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {user?.email || user?.user_metadata?.username || 'Usuario'}
          </p>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <Link 
            href="/profile"
            onClick={handleProfileClick}
            className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <User className="h-4 w-4 mr-3" />
            Mi Perfil
          </Link>
          
          <Link 
            href="/settings"
            onClick={handleSettingsClick}
            className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-4 w-4 mr-3" />
            Configuración
          </Link>
        </div>

        {/* Divider */}
        <hr className={`my-1 transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-200'
        }`} />

        {/* Sign Out */}
        <div className="py-1">
          <button
            onClick={handleSignOutClick}
            className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              isDarkMode 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
