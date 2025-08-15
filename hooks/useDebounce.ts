/**
 * Advanced Debounce Hook with Performance Optimizations
 * Solves: Re-renders innecesarios + API calls excesivas
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook de debounce optimizado que previene re-renders innecesarios
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos
 * @param options - Opciones adicionales
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean;
    maxWait?: number;
    equalityFn?: (prev: T, next: T) => boolean;
  } = {}
) {
  const {
    leading = false,
    maxWait,
    equalityFn = (prev, next) => prev === next,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastArgsRef = useRef<T>(value);

  const updateDebouncedValue = useCallback((newValue: T) => {
    if (!equalityFn(lastArgsRef.current, newValue)) {
      setDebouncedValue(newValue);
      lastArgsRef.current = newValue;
    }
  }, [equalityFn]);

  useEffect(() => {
    // Si el valor no ha cambiado, no hacer nada
    if (equalityFn(lastArgsRef.current, value)) {
      return;
    }

    const now = Date.now();
    lastCallTimeRef.current = now;

    // Ejecutar inmediatamente si leading es true y no hay timeout activo
    if (leading && !timeoutRef.current) {
      updateDebouncedValue(value);
    }

    // Limpiar timeouts existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer el timeout principal
    timeoutRef.current = setTimeout(() => {
      updateDebouncedValue(value);
      timeoutRef.current = null;
      
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    }, delay);

    // Establecer maxWait timeout si está especificado
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        updateDebouncedValue(value);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        maxTimeoutRef.current = null;
      }, maxWait);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
  }, [value, delay, leading, maxWait, updateDebouncedValue, equalityFn]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;
    maxWait?: number;
    deps?: React.DependencyList;
  } = {}
) {
  const { leading = false, maxWait, deps = [] } = options;

  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | undefined>(undefined);

  // Actualizar el callback ref
  useEffect(() => {
    callbackRef.current = callback;
  });

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastCallTimeRef.current = now;

      const execute = () => {
        callbackRef.current(...args);
      };

      // Ejecutar inmediatamente si leading es true y no hay timeout activo
      if (leading && !timeoutRef.current) {
        execute();
      }

      // Limpiar timeouts existentes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Establecer el timeout principal
      timeoutRef.current = setTimeout(() => {
        if (!leading) {
          execute();
        }
        timeoutRef.current = null;
        
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, delay);

      // Establecer maxWait timeout si está especificado
      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          execute();
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          maxTimeoutRef.current = null;
        }, maxWait);
      }
    },
    [delay, leading, maxWait, ...deps]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook para throttle (limitar frecuencia de ejecución)
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRunRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now >= lastRunRef.current + limit) {
      setThrottledValue(value);
      lastRunRef.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastRunRef.current = Date.now();
      }, limit - (now - lastRunRef.current));

      return () => clearTimeout(timeoutId);
    }
  }, [value, limit]);

  return throttledValue;
}
