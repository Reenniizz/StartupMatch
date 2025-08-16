/**
 * Stats Card Component
 * Individual animated card for displaying statistics
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCardProps } from '../types/dashboard.types';

const colorConfig = {
  blue: {
    gradient: {
      light: 'bg-gradient-to-r from-blue-600 to-blue-500',
      dark: 'bg-gradient-to-r from-blue-900 to-blue-800',
      border: 'border-blue-400 dark:border-blue-700'
    },
    text: 'text-blue-100',
    bg: 'bg-white/10'
  },
  purple: {
    gradient: {
      light: 'bg-gradient-to-r from-purple-600 to-purple-500',
      dark: 'bg-gradient-to-r from-purple-900 to-purple-800',
      border: 'border-purple-400 dark:border-purple-700'
    },
    text: 'text-purple-100',
    bg: 'bg-white/10'
  },
  green: {
    gradient: {
      light: 'bg-gradient-to-r from-green-600 to-green-500',
      dark: 'bg-gradient-to-r from-green-900 to-green-800',
      border: 'border-green-400 dark:border-green-700'
    },
    text: 'text-green-100',
    bg: 'bg-white/10'
  },
  orange: {
    gradient: {
      light: 'bg-gradient-to-r from-orange-600 to-orange-500',
      dark: 'bg-gradient-to-r from-orange-900 to-orange-800',
      border: 'border-orange-400 dark:border-orange-700'
    },
    text: 'text-orange-100',
    bg: 'bg-white/10'
  }
};

export function StatsCard({ data, isDarkMode, index }: StatsCardProps) {
  const config = colorConfig[data.color];
  const Icon = data.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.1, duration: 0.5 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
        isDarkMode ? config.gradient.dark : config.gradient.light
      } ${config.gradient.border}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`${config.text} text-sm font-medium mb-1`}>
                {data.title}
              </p>
              <div className="text-white text-3xl font-bold mb-2">
                {data.loading ? (
                  <div className="w-16 h-8 bg-white/20 rounded animate-pulse"></div>
                ) : (
                  data.value
                )}
              </div>
              <div className={`${config.text} text-xs flex items-center`}>
                {data.loading ? (
                  <div className="w-20 h-4 bg-white/20 rounded animate-pulse"></div>
                ) : (
                  <span>{data.subtitle}</span>
                )}
              </div>
            </div>
            <div className={`p-3 ${config.bg} rounded-full flex-shrink-0`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Icon className="h-20 w-20 text-white" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
