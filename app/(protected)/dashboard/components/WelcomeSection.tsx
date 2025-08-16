/**
 * Welcome Section Component
 * Personalized welcome message with profile completion
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WelcomeSectionProps } from '../types/dashboard.types';

const defaultBadges = [
  { text: '🎯 Dashboard Moderno', color: 'blue' },
  { text: '⚡ Super Rápido', color: 'purple' },
  { text: '🌙 Tema Oscuro', color: 'green' },
  { text: '📱 Responsive', color: 'orange' }
];

export function WelcomeSection({ 
  user, 
  isDarkMode, 
  profileCompleteness = 75 
}: WelcomeSectionProps) {
  const userName = user?.user_metadata?.firstName || 
                   user?.user_metadata?.username || 
                   user?.email?.split('@')[0] || 
                   'Emprendedor';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="lg:col-span-2"
    >
      <Card className={`transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className={`text-xl flex items-center transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Star className="mr-2 h-6 w-6 text-yellow-500" />
            ¡Hola {userName}! 🚀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Welcome Message */}
            <p className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Bienvenido a tu dashboard de StartupMatch. Aquí puedes gestionar tus conexiones, 
              explorar nuevas oportunidades y hacer crecer tu red de contactos empresariales.
            </p>
            
            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2">
              {defaultBadges.map((badge, index) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                >
                  <Badge 
                    variant="outline" 
                    className={`transition-colors duration-300 ${
                      badge.color === 'blue' 
                        ? (isDarkMode ? 'bg-blue-900/20 text-blue-300 border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200')
                      : badge.color === 'purple'
                        ? (isDarkMode ? 'bg-purple-900/20 text-purple-300 border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200')
                      : badge.color === 'green'
                        ? (isDarkMode ? 'bg-green-900/20 text-green-300 border-green-600' : 'bg-green-50 text-green-700 border-green-200')
                      : (isDarkMode ? 'bg-orange-900/20 text-orange-300 border-orange-600' : 'bg-orange-50 text-orange-700 border-orange-200')
                    }`}
                  >
                    {badge.text}
                  </Badge>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <motion.div
              className="pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Completitud del perfil
                </span>
                <span className="text-sm text-blue-600 font-semibold">
                  {profileCompleteness}%
                </span>
              </div>
              
              <div className={`w-full bg-gray-200 rounded-full h-2.5 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompleteness}%` }}
                  transition={{ duration: 1, delay: 1.4, ease: 'easeOut' }}
                />
              </div>
              
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {profileCompleteness < 100 
                  ? 'Completa tu perfil para mejores matches'
                  : '¡Perfil completado! Excelente trabajo.'
                }
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
