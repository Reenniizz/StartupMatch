import { lazy, ComponentType } from 'react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

// Lazy loading con preload
const createLazyComponent = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  preload: boolean = false
) => {
  const LazyComponent = lazy(factory);
  
  if (preload && typeof window !== 'undefined') {
    // Preload en el cliente después del initial load
    setTimeout(() => {
      factory().catch(() => {
        // Silently handle preload failures
      });
    }, 2000);
  }
  
  return LazyComponent;
};

// Componentes optimizados para dashboard
export const LazyDashboardComponents = {
  // Dashboard components con preload
  StatsCards: createLazyComponent(
    () => import('@/app/(protected)/dashboard/components/StatsCards'),
    true
  ),
  QuickActions: createLazyComponent(
    () => import('@/app/(protected)/dashboard/components/QuickActions'),
    true
  ),
  PopularGroups: createLazyComponent(
    () => import('@/app/(protected)/dashboard/components/PopularGroups'),
    false
  ),
  RecentActivity: createLazyComponent(
    () => import('@/app/(protected)/dashboard/components/RecentActivity'),
    false
  ),
  
  // Messaging components
  NotificationCenter: createLazyComponent(
    () => import('@/components/messaging/NotificationCenter'),
    false
  ),
  
  // Project components
  ProjectModal: createLazyComponent(
    () => import('@/components/projects/ProjectModal'),
    false
  ),
  ApplicationModal: createLazyComponent(
    () => import('@/components/projects/ApplicationModal'),
    false
  ),
  
  // Rich content components
  RichTextEditor: createLazyComponent(
    () => import('@/components/RichTextEditor'),
    false
  ),
  
  // UI Heavy components
  DataTable: createLazyComponent(
    () => import('@/components/ui/data-table'),
    false
  ),
};

// Loading fallbacks optimizados
export const LazyFallbacks = {
  dashboard: <LoadingSkeleton />,
  card: <LoadingSkeleton />,
  list: <LoadingSkeleton />,
  editor: <LoadingSkeleton />,
  modal: <LoadingSkeleton />,
};

// Hook para lazy loading con intersection observer
export const useLazyLoading = () => {
  return {
    // Implementación del hook
  };
};
