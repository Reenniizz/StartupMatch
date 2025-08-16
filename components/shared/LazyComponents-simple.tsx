"use client";

import { lazy, Suspense } from 'react';

// Simple loading component
const LoadingFallback = ({ message = "Cargando..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    <span className="ml-3">{message}</span>
  </div>
);

// Simple error fallback
const ErrorFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <p>Error cargando {componentName}</p>
    <p className="text-sm text-red-600 mt-1">Componente no disponible</p>
  </div>
);

// Simple wrapper component
export const LazyWrapper = ({ 
  children, 
  fallback = <LoadingFallback /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Export simple fallbacks for now
export const ApplicationModalFallback = () => <ErrorFallback componentName="Application Modal" />;
export const MyApplicationsFallback = () => <ErrorFallback componentName="My Applications" />;
export const StatsCardsFallback = () => <ErrorFallback componentName="Stats Cards" />;

// Simple components (no lazy for now to avoid errors)
export const LazyApplicationModal = ApplicationModalFallback;
export const LazyMyApplications = MyApplicationsFallback;
export const LazyStatsCards = StatsCardsFallback;
