/**
 * Recent Activity Section Component
 * Container for displaying recent user activities with loading and empty states
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityItem } from './ActivityItem';
import { RecentActivityProps } from '../types/dashboard.types';

export function RecentActivity({ activities, loading, isDarkMode }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <Card className={`transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center justify-between transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <div className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Actividad Reciente
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3, 4].map((n) => (
                  <motion.div 
                    key={n}
                    className={`flex items-center space-x-3 p-3 rounded-lg animate-pulse ${
                      isDarkMode ? 'bg-gray-700' : 'bg-slate-50'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: n * 0.1 }}
                  >
                    <div className={`w-8 h-8 rounded-lg ${
                      isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                    }`}></div>
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 rounded w-full ${
                        isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                      }`}></div>
                      <div className={`h-2 rounded w-2/3 ${
                        isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                      }`}></div>
                    </div>
                    <div className={`h-2 rounded w-12 ${
                      isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                    }`}></div>
                  </motion.div>
                ))}
              </>
            ) : activities.length > 0 ? (
              // Activities list
              <>
                {activities.slice(0, 5).map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isDarkMode={isDarkMode}
                    index={index}
                  />
                ))}
                {activities.length > 5 && (
                  <motion.div 
                    className="pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full transition-colors duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-slate-100'
                      }`}
                    >
                      Ver más actividades ({activities.length - 5} restantes)
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              // Empty state
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Activity className={`h-12 w-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-sm mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No hay actividad reciente
                </p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Comienza a interactuar para ver tu actividad aquí
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
