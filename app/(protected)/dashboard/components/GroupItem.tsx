/**
 * Group Item Component
 * Individual group display with gradient background and status
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GroupItemProps } from '../types/dashboard.types';

const statusConfig = {
  'Miembro': {
    light: 'bg-green-100 text-green-700',
    dark: 'bg-green-800 text-green-300'
  },
  'Activo': {
    light: 'bg-emerald-100 text-emerald-700',
    dark: 'bg-emerald-800 text-emerald-300'
  },
  'Invitado': {
    light: 'bg-blue-100 text-blue-700',
    dark: 'bg-blue-800 text-blue-300'
  }
} as const;

export function GroupItem({ group, isDarkMode, index }: GroupItemProps) {
  const statusStyles = statusConfig[group.status];

  return (
    <Link href="/grupos">
      <motion.div 
        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
          isDarkMode 
            ? `bg-${group.gradient.split('-')[1]}-900/20 hover:bg-${group.gradient.split('-')[1]}-900/30` 
            : `bg-${group.gradient.split('-')[1]}-50 hover:bg-${group.gradient.split('-')[1]}-100`
        }`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Group Avatar */}
        <div className={`w-10 h-10 bg-gradient-to-br ${group.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-sm">{group.initials}</span>
        </div>
        
        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {group.name}
          </p>
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {group.memberCount} miembros
            {group.recentMessages > 0 && ` • ${group.recentMessages} nuevos mensajes`}
          </p>
        </div>
        
        {/* Status Badge */}
        <div className={`px-2 py-1 rounded-full text-xs flex-shrink-0 transition-colors duration-300 ${
          isDarkMode ? statusStyles.dark : statusStyles.light
        }`}>
          {group.status}
        </div>
      </motion.div>
    </Link>
  );
}
