/**
 * Stats Cards Container Component
 * Grid layout for all dashboard statistics cards
 */

'use client';

import React from 'react';
import { Handshake, Heart, MessageSquare, BarChart3 } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StatsCardsProps, StatsCardData } from '../types/dashboard.types';

export function StatsCards({ stats, loading, error, isDarkMode }: StatsCardsProps) {
  // Transform stats data into card format
  const statsCards: StatsCardData[] = [
    {
      title: 'Conexiones Activas',
      value: stats?.connections.total || 0,
      subtitle: stats?.connections.weeklyChangeText || 'Sin cambios esta semana',
      icon: Handshake,
      color: 'blue',
      gradient: 'from-blue-600 to-blue-500',
      loading: loading
    },
    {
      title: 'Matches Perfectos',
      value: stats?.matches.total || 0,
      subtitle: stats?.matches.dailyNewText || 'Sin nuevos hoy',
      icon: Heart,
      color: 'purple',
      gradient: 'from-purple-600 to-purple-500',
      loading: loading
    },
    {
      title: 'Conversaciones',
      value: stats?.conversations.total || 0,
      subtitle: stats?.conversations.unreadText || 'Todo leído',
      icon: MessageSquare,
      color: 'green',
      gradient: 'from-green-600 to-green-500',
      loading: loading
    },
    {
      title: 'Tasa de Éxito',
      value: `${stats?.successRate.percentage || 0}%`,
      subtitle: stats?.successRate.changeText || '0% vs mes anterior',
      icon: BarChart3,
      color: 'orange',
      gradient: 'from-orange-600 to-orange-500',
      loading: loading
    }
  ];

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`col-span-full p-4 rounded-lg border ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="text-sm">Error al cargar estadísticas: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((cardData, index) => (
        <StatsCard
          key={cardData.title}
          data={cardData}
          isDarkMode={isDarkMode}
          index={index}
        />
      ))}
    </div>
  );
}
