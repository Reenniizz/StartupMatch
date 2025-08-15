/**
 * Universal Loading States Components
 * Solves: Loading states inconsistentes
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic Loading Skeleton
 */
export const UniversalSkeleton = ({ 
  count = 3, 
  type = 'card' 
}: { 
  count?: number;
  type?: 'card' | 'list' | 'grid' | 'table';
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse">
            <Skeleton className="h-full w-full rounded-lg" />
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex space-x-4 pb-2 border-b animate-pulse">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex space-x-4 py-2 animate-pulse">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

/**
 * Project-specific loading components
 */
export const ProjectCardSkeleton = ({ count = 3 }: { count?: number }) => (
  <UniversalSkeleton count={count} type="card" />
);

export const ProjectListSkeleton = ({ count = 5 }: { count?: number }) => (
  <UniversalSkeleton count={count} type="list" />
);

/**
 * Page-level loading wrapper
 */
export const PageLoadingWrapper = ({ 
  loading, 
  error, 
  children, 
  loadingComponent,
  errorComponent 
}: {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}) => {
  if (loading) {
    return <>{loadingComponent || <UniversalSkeleton />}</>;
  }

  if (error) {
    return <>{errorComponent || <div className="text-red-500 p-4">Error: {error}</div>}</>;
  }

  return <>{children}</>;
};

/**
 * Loading states for different contexts
 */
export const LoadingStates = {
  // Skeleton placeholders
  ProjectGrid: () => <ProjectCardSkeleton count={6} />,
  ProjectList: () => <ProjectListSkeleton count={5} />,
  UserList: () => <UniversalSkeleton count={4} type="list" />,
  
  // Inline loaders
  ButtonLoading: ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {children}
    </div>
  ),
  
  // Full page loader
  PageLoading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  ),
  
  // Content loading overlay
  ContentLoading: ({ children, loading }: { children: React.ReactNode; loading: boolean }) => (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
};
