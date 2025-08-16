'use client';

import React from 'react';
import { MessagesLayoutProps } from '../types/messages.types';
import { cn } from '@/lib/utils';

/**
 * Layout principal para la página de mensajes
 * Proporciona la estructura base responsive con sidebar y área principal
 */
export function MessagesLayout({ children, className }: MessagesLayoutProps) {
  return (
    <div className={cn(
      "flex h-screen bg-gray-50 dark:bg-gray-900",
      "transition-colors duration-200",
      className
    )}>
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * Sidebar container para la lista de conversaciones
 * Responsive: full width en mobile, sidebar en desktop
 */
export function MessagesSidebar({ 
  children, 
  className,
  isOpen = true 
}: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) {
  return (
    <div className={cn(
      // Base styles
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
      "flex flex-col transition-all duration-300",
      // Responsive width
      "w-full md:w-96 lg:w-80 xl:w-96",
      // Mobile responsive
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      "md:relative absolute md:z-auto z-30 h-full",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Área principal del chat
 * Se adapta al espacio disponible cuando el sidebar está visible/oculto
 */
export function MessagesChatArea({ 
  children, 
  className,
  isEmpty = false 
}: {
  children: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className={cn(
      "flex-1 flex flex-col",
      "bg-white dark:bg-gray-800",
      isEmpty && "items-center justify-center",
      className
    )}>
      {isEmpty ? (
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Selecciona una conversación
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Elige una conversación de la lista para comenzar a chatear
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
