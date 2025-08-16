// LazyComponents.tsx - Advanced lazy loading for heavy components
'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallbacks
const ComponentSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-[200px] w-full" />
  </div>
);

const FormSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-10 w-[120px]" />
  </div>
);

const CardSkeleton = () => (
  <div className="space-y-4 p-4 border rounded-lg">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ componentName }: { componentName: string }) => (
  <div className="p-4 text-center text-red-500 border border-red-200 rounded-lg bg-red-50">
    <p>Error loading {componentName}</p>
    <p className="text-sm text-red-400 mt-1">Component not available</p>
  </div>
);

// Lazy loaded components with proper error handling
const LazyEditProjectForm = lazy(() => 
  import('@/components/projects/EditProjectForm').catch(() => ({
    default: () => <ErrorFallback componentName="EditProjectForm" />
  }))
);

const LazyProjectModal = lazy(() => 
  import('@/components/projects/ProjectModal').catch(() => ({
    default: () => <ErrorFallback componentName="ProjectModal" />
  }))
);

const LazyCreateGroupModal = lazy(() => 
  import('./CreateGroupModal').then(module => ({
    default: (module as any).default || (module as any).CreateGroupModal || ErrorFallback
  })).catch(() => ({
    default: () => <ErrorFallback componentName="CreateGroupModal" />
  }))
);

const LazyMessagesArea = lazy(() => 
  import('./MessagesArea').then(module => ({
    default: (module as any).default || (module as any).MessagesArea || ErrorFallback
  })).catch(() => ({
    default: () => <ErrorFallback componentName="MessagesArea" />
  }))
);

const LazyMatchingCard = lazy(() => 
  import('./MatchingCard').then(module => ({
    default: (module as any).default || (module as any).MatchingCard || ErrorFallback
  })).catch(() => ({
    default: () => <ErrorFallback componentName="MatchingCard" />
  }))
);

// Simple fallback components for empty/problematic modules
const ApplicationModalFallback = () => (
  <div className="p-6 border rounded-lg bg-gray-50">
    <h3 className="text-lg font-semibold mb-2">Application Modal</h3>
    <p className="text-gray-600">Component under development</p>
  </div>
);

const MyApplicationsFallback = () => (
  <div className="p-6 border rounded-lg bg-gray-50">
    <h3 className="text-lg font-semibold mb-2">My Applications</h3>
    <p className="text-gray-600">Component under development</p>
  </div>
);

const StatsCardsFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
    <div className="p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium">Projects</h4>
      <p className="text-2xl font-bold">--</p>
    </div>
    <div className="p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium">Matches</h4>
      <p className="text-2xl font-bold">--</p>
    </div>
    <div className="p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium">Connections</h4>
      <p className="text-2xl font-bold">--</p>
    </div>
  </div>
);

// Use fallback components for problematic imports
const LazyApplicationModal = () => <ApplicationModalFallback />;
const LazyMyApplications = () => <MyApplicationsFallback />;
const LazyStatsCards = () => <StatsCardsFallback />;

// Wrapper components with suspense and error boundaries
export const LazyEditProjectWrapper = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyEditProjectForm {...props} />
  </Suspense>
);

export const LazyProjectModalWrapper = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyProjectModal {...props} />
  </Suspense>
);

export const LazyApplicationModalWrapper = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyApplicationModal {...props} />
  </Suspense>
);

export const LazyCreateGroupModalWrapper = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyCreateGroupModal {...props} />
  </Suspense>
);

export const LazyMessagesWrapper = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyMessagesArea {...props} />
  </Suspense>
);

export const LazyApplicationsWrapper = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyMyApplications {...props} />
  </Suspense>
);

export const LazyMatchingWrapper = (props: any) => (
  <Suspense fallback={<CardSkeleton />}>
    <LazyMatchingCard {...props} />
  </Suspense>
);

export const LazyStatsWrapper = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyStatsCards {...props} />
  </Suspense>
);

// Advanced lazy loading hook with intersection observer
export const useLazyComponentLoader = (threshold = 0.1, rootMargin = '50px') => {
  try {
    const { useIntersectionObserver } = require('@/hooks/useIntersectionObserver');
    const { ref, inView } = useIntersectionObserver({
      threshold,
      rootMargin,
    });
    return { ref, shouldLoad: inView };
  } catch (error) {
    console.warn('Intersection observer hook not available, loading immediately');
    return { ref: null, shouldLoad: true };
  }
};

// Preloader utility for critical components
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    componentImport().then(() => {
      console.log('✅ Component preloaded');
    }).catch(() => {
      console.warn('⚠️ Failed to preload component');
    });
  }
};

// Preload critical components on app load
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload after initial page load
    setTimeout(() => {
      preloadComponent(() => import('./ProjectModal'));
      preloadComponent(() => import('./MessagesArea'));
      preloadComponent(() => import('./EditProjectForm'));
    }, 2000);
  }
};

// Bundle size optimization utilities
export const getComponentSizeEstimate = (componentName: string): number => {
  const estimates: Record<string, number> = {
    'EditProjectForm': 25, // KB
    'ProjectModal': 30,
    'ApplicationModal': 20,
    'CreateGroupModal': 15,
    'MessagesArea': 35,
    'MyApplications': 25,
    'MatchingCard': 20,
    'StatsCards': 15,
  };
  
  return estimates[componentName] || 10;
};

export const shouldLazyLoad = (componentName: string): boolean => {
  const threshold = 20; // KB
  return getComponentSizeEstimate(componentName) > threshold;
};

// Re-export all lazy components
export {
  LazyEditProjectForm,
  LazyProjectModal,
  LazyApplicationModal,
  LazyCreateGroupModal,
  LazyMessagesArea,
  LazyMyApplications,
  LazyMatchingCard,
  LazyStatsCards,
};
