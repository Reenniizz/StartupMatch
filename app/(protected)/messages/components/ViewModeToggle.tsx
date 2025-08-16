'use client';

import React from 'react';
import { ViewMode } from '../types/messages.types';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Toggle para cambiar entre diferentes vistas de conversaciones
 * Incluye contadores de conversaciones por tipo
 */
export function ViewModeToggle({ 
  currentMode, 
  onModeChange, 
  className 
}: ViewModeToggleProps) {
  
  const modes: Array<{
    value: ViewMode;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      value: 'all',
      label: 'Todas',
      description: 'Ver todas las conversaciones',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      value: 'individual',
      label: 'Individuales',
      description: 'Solo conversaciones directas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      value: 'groups',
      label: 'Grupos',
      description: 'Solo conversaciones grupales',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={cn("mt-3", className)}>
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            className={cn(
              // Base styles
              "flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-700",
              
              // Active state
              currentMode === mode.value ? [
                "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm",
                "ring-1 ring-blue-200 dark:ring-blue-800"
              ] : [
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
                "hover:bg-gray-200 dark:hover:bg-gray-600"
              ]
            )}
            title={mode.description}
          >
            <span className={cn(
              "transition-colors duration-200",
              currentMode === mode.value 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              {mode.icon}
            </span>
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden">{mode.label.charAt(0)}</span>
          </button>
        ))}
      </div>
      
      {/* Optional: Mode description */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        {modes.find(mode => mode.value === currentMode)?.description}
      </div>
    </div>
  );
}

/**
 * Badge con contador para cada modo (opcional)
 */
export function ViewModeToggleWithCounts({ 
  currentMode, 
  onModeChange,
  counts = { all: 0, individual: 0, groups: 0 },
  className 
}: ViewModeToggleProps & { 
  counts?: { all: number; individual: number; groups: number } 
}) {
  
  const modes = [
    {
      value: 'all' as ViewMode,
      label: 'Todas',
      count: counts.all,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      value: 'individual' as ViewMode,
      label: 'Directas',
      count: counts.individual,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      value: 'groups' as ViewMode,
      label: 'Grupos',
      count: counts.groups,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={cn("mt-3", className)}>
      <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            className={cn(
              "flex flex-col items-center space-y-1 px-2 py-3 rounded-md text-xs font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              
              currentMode === mode.value ? [
                "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
              ] : [
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
                "hover:bg-gray-200 dark:hover:bg-gray-600"
              ]
            )}
          >
            <span className={cn(
              currentMode === mode.value 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              {mode.icon}
            </span>
            <span className="text-xs">{mode.label}</span>
            {mode.count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-medium",
                currentMode === mode.value 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" 
                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
              )}>
                {mode.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
