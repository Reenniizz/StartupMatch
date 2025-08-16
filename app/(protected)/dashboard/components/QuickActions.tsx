/**
 * Quick Actions Section Component
 * Grid of quick action cards for common dashboard tasks
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Rocket, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickActionCard } from './QuickActionCard';
import { QuickActionsProps, QuickAction } from '../types/dashboard.types';

const defaultActions: QuickAction[] = [
  {
    id: 'matches',
    title: 'Explorar Matches',
    description: 'Encuentra personas compatibles con tus objetivos',
    icon: Heart,
    href: '/matches',
    color: 'purple'
  },
  {
    id: 'projects',
    title: 'Crear Proyecto',
    description: 'Comparte tu idea y encuentra co-fundadores',
    icon: Rocket,
    href: '/projects/create',
    color: 'blue'
  },
  {
    id: 'profile',
    title: 'Completar Perfil',
    description: 'Optimiza tu perfil para mejores matches',
    icon: User,
    href: '/profile',
    color: 'green'
  }
];

export function QuickActions({ isDarkMode, actions = defaultActions }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mb-8"
    >
      <Card className={`transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Rocket className="mr-2 h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              >
                <QuickActionCard
                  action={action}
                  isDarkMode={isDarkMode}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
