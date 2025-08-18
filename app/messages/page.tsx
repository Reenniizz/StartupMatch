"use client";

import React, { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import SimpleMessagesPage from './simple-page';

// Loading skeleton component
const MessagesLoadingSkeleton = () => (
  <div className="flex h-screen bg-gray-50 animate-pulse">
    {/* Sidebar skeleton */}
    <div className="w-1/3 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
      
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
    
    {/* Main chat area skeleton */}
    <div className="flex-1 bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
    </div>
  </div>
);

/**
 * Messages Page - Socket.IO Real-Time Version
 * 
 * Esta versión implementa mensajes en tiempo real usando:
 * - Socket.IO para comunicación instantánea
 * - Optimistic UI updates para mejor UX
 * - Fallback HTTP API para robustez
 * - Indicadores de estado de conexión
 * - Auto-scroll y timestamps
 */
export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen bg-gray-50">
        <Suspense fallback={<MessagesLoadingSkeleton />}>
          <SimpleMessagesPage />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}