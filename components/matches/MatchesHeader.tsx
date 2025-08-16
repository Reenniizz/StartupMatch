/**
 * MatchesHeader Component - Clean & Focused
 * Displays header with stats and actions for matches page
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Clock, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMatchesData } from '@/store/matches';

export const MatchesHeader: React.FC = () => {
  const { totalConnections, totalPending, totalSent } = useMatchesData();

  const stats = [
    {
      icon: Users,
      label: 'Conexiones',
      value: totalConnections,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: totalPending,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Send,
      label: 'Enviadas',
      value: totalSent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-2"
      >
        <Heart className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Mis Matches
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus conexiones y solicitudes
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {stats.map((stat, index) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                  </div>
                </div>
                
                {stat.value > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stat.value > 99 ? '99+' : stat.value}
                  </Badge>
                )}
              </motion.div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
};
