/**
 * Popular Groups Section Component
 * Container for displaying popular groups with loading and empty states
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupItem } from './GroupItem';
import { PopularGroupsProps } from '../types/dashboard.types';

export function PopularGroups({ groups, loading, isDarkMode }: PopularGroupsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className={`transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center justify-between transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Grupos Populares
            </div>
            <Link 
              href="/grupos" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Ver todos
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((n) => (
                  <motion.div 
                    key={n}
                    className={`flex items-center space-x-3 p-3 rounded-lg animate-pulse ${
                      isDarkMode ? 'bg-gray-700' : 'bg-slate-50'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: n * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-lg ${
                      isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                    }`}></div>
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 rounded w-3/4 ${
                        isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                      }`}></div>
                      <div className={`h-3 rounded w-1/2 ${
                        isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                      }`}></div>
                    </div>
                    <div className={`h-6 rounded w-16 ${
                      isDarkMode ? 'bg-gray-600' : 'bg-slate-200'
                    }`}></div>
                  </motion.div>
                ))}
              </>
            ) : groups.length > 0 ? (
              // Groups list
              <>
                {groups.map((group, index) => (
                  <GroupItem
                    key={group.id}
                    group={group}
                    isDarkMode={isDarkMode}
                    index={index}
                  />
                ))}
              </>
            ) : (
              // Empty state
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Users className={`h-12 w-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-sm mb-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No hay grupos disponibles aún
                </p>
                <Link 
                  href="/grupos" 
                  className="inline-block text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Explorar grupos
                </Link>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
