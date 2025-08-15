/**
 * Lazy Loading Hooks
 * Solves: Bundle size excesivo + componentes cargados inmediatamente
 */

import { lazy, ComponentType, useEffect, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

/**
 * Hook para lazy loading con intersection observer
 */
export function useLazyLoad(
  threshold: number = 0.1,
  rootMargin: string = '100px'
) {
  const { ref, inView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return {
    ref,
    shouldLoad: inView,
  };
}

/**
 * Hook para lazy loading de imágenes
 */
export function useLazyImage(
  src: string,
  placeholder?: string,
  options?: {
    threshold?: number;
    rootMargin?: string;
  }
) {
  const { ref, shouldLoad } = useLazyLoad(
    options?.threshold,
    options?.rootMargin
  );

  return {
    ref,
    src: shouldLoad ? src : placeholder || '',
    isLoaded: shouldLoad,
  };
}

/**
 * Factory para crear componentes lazy
 */
export function createLazyComponent<T = {}>(
  componentImport: () => Promise<{ default: ComponentType<T> }>
) {
  return lazy(componentImport);
}

/**
 * Hook para preload de componentes
 */
export function usePreloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>,
  condition: boolean = true
) {
  useEffect(() => {
    if (condition) {
      // Preload el componente
      componentImport().catch(console.error);
    }
  }, [componentImport, condition]);
}

/**
 * Hook para lazy loading de datos
 */
export function useLazyData<T>(
  dataFetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;
  const { ref, shouldLoad } = useLazyLoad(threshold, rootMargin);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (shouldLoad && enabled && !data && !loading) {
      setLoading(true);
      setError(null);
      
      dataFetcher()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [shouldLoad, enabled, data, loading, dataFetcher, ...dependencies]);

  return {
    ref,
    data,
    loading,
    error,
    shouldLoad,
  };
}
