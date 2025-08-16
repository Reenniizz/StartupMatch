'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MainMessagesLayout } from './components/MainMessagesLayout';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

/**
 * Página principal de mensajes refactorizada
 * Transformada de 1,309 líneas monolíticas a ~80 líneas modulares
 * 
 * Arquitectura:
 * - ProtectedRoute: Maneja la autenticación
 * - MainMessagesLayout: Orchestador principal con todos los hooks
 * - Componentes modulares: ConversationsList, ChatArea, GroupCreationModal
 * - Hooks especializados: useMessagesState, useActiveChat, etc.
 */
export default function MessagesPage() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r">
          <MessagesLoadingSkeleton />
        </div>
        <div className="flex-1">
          <ChatLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen">
        {/* 
          MainMessagesLayout maneja toda la lógica compleja que antes estaba aquí:
          - Estado de conversaciones y mensajes
          - Socket management 
          - Búsqueda y filtros
          - Mobile responsiveness
          - Optimizaciones de rendimiento
          - Integración entre componentes
        */}
        <MainMessagesLayout>
          {/* El layout se encarga de todo el contenido */}
        </MainMessagesLayout>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Loading skeleton para la lista de conversaciones
 */
function MessagesLoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      
      {/* View mode toggle skeleton */}
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-18"></div>
      </div>
      
      {/* Conversations skeleton */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-4 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton para el área de chat
 */
function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat header skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
          >
            <div className={`flex items-end space-x-2 max-w-xs ${i % 2 === 1 ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {i % 2 === 0 && (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              )}
              <div className={`space-y-1 ${i % 2 === 1 ? 'items-end' : ''}`}>
                <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i % 2 === 1 ? 'bg-blue-200 dark:bg-blue-800' : ''}`} style={{ width: `${Math.random() * 100 + 100}px` }}></div>
                <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i % 2 === 1 ? 'bg-blue-200 dark:bg-blue-800' : ''}`} style={{ width: `${Math.random() * 150 + 80}px` }}></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message input skeleton */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
