/**
 * Quick Action Card Component
 * Individual card for quick dashboard actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { QuickActionCardProps } from '../types/dashboard.types';

const colorConfig = {
  purple: {
    border: 'border-purple-500',
    hoverBg: {
      light: 'hover:bg-purple-50',
      dark: 'hover:bg-purple-900/20'
    },
    icon: 'text-purple-500'
  },
  blue: {
    border: 'border-blue-500',
    hoverBg: {
      light: 'hover:bg-blue-50',
      dark: 'hover:bg-blue-900/20'
    },
    icon: 'text-blue-500'
  },
  green: {
    border: 'border-green-500',
    hoverBg: {
      light: 'hover:bg-green-50',
      dark: 'hover:bg-green-900/20'
    },
    icon: 'text-green-500'
  }
};

export function QuickActionCard({ action, isDarkMode }: QuickActionCardProps) {
  const config = colorConfig[action.color];
  const Icon = action.icon;

  return (
    <Link href={action.href}>
      <div className={`p-4 rounded-lg border-2 border-dashed transition-all duration-300 hover:border-solid hover:scale-105 cursor-pointer ${
        isDarkMode 
          ? `border-gray-600 hover:${config.border} ${config.hoverBg.dark}` 
          : `border-gray-300 hover:${config.border} ${config.hoverBg.light}`
      }`}>
        <Icon className={`h-8 w-8 ${config.icon} mb-2`} />
        <h3 className={`font-semibold mb-1 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {action.title}
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {action.description}
        </p>
      </div>
    </Link>
  );
}
