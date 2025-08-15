/**
 * Advanced Memoization Hooks
 * Solves: Re-renders innecesarios + optimización de componentes costosos
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook para memoizar valores costosos con dependencias profundas
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  equalityFn?: (a: any, b: any) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>(undefined);
  
  const defaultEqualityFn = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => defaultEqualityFn(item, b[index]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => defaultEqualityFn(a[key], b[key]));
    }
    return false;
  };

  const checkEquality = equalityFn || defaultEqualityFn;

  if (!ref.current || !checkEquality(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Hook para callbacks estables con dependencias complejas
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<React.DependencyList>(deps);

  // Solo actualizar si las dependencias realmente cambiaron
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => !Object.is(dep, depsRef.current[index]));
  }, deps);

  useEffect(() => {
    if (depsChanged) {
      callbackRef.current = callback;
      depsRef.current = deps;
    }
  });

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    [depsChanged]
  );
}

/**
 * Hook para memoizar arrays que cambian frecuentemente
 */
export function useMemoArray<T>(
  array: T[],
  equalityFn?: (a: T, b: T) => boolean
): T[] {
  const defaultEqualityFn = (a: T, b: T) => a === b;
  const checkEquality = equalityFn || defaultEqualityFn;

  return useMemo(() => array, [
    array.length,
    ...array.map((item, index) => 
      // Solo incluir el item si es diferente del anterior
      array.findIndex(prevItem => checkEquality(prevItem, item)) === index ? item : null
    ),
  ]);
}

/**
 * Hook para memoizar objetos que cambian frecuentemente
 */
export function useMemoObject<T extends Record<string, any>>(
  obj: T,
  keys?: (keyof T)[]
): T {
  const relevantKeys = keys || (Object.keys(obj) as (keyof T)[]);
  
  return useMemo(() => obj, [
    ...relevantKeys.map(key => obj[key]),
  ]);
}

/**
 * Hook para lazy evaluation de valores costosos
 */
export function useLazyValue<T>(
  factory: () => T,
  condition: boolean = true
): T | null {
  const [value, setValue] = useState<T | null>(null);
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (condition && !hasExecuted.current) {
      setValue(factory());
      hasExecuted.current = true;
    }
  }, [condition, factory]);

  return value;
}

/**
 * Hook para memoización con expiración (cache TTL)
 */
export function useMemoWithTTL<T>(
  factory: () => T,
  deps: React.DependencyList,
  ttl: number = 5000 // 5 segundos por defecto
): T {
  const cache = useRef<{
    value: T;
    timestamp: number;
    deps: React.DependencyList;
  } | null>(null);

  return useMemo(() => {
    const now = Date.now();
    
    // Verificar si el cache es válido
    if (
      cache.current &&
      now - cache.current.timestamp < ttl &&
      cache.current.deps.length === deps.length &&
      cache.current.deps.every((dep, index) => Object.is(dep, deps[index]))
    ) {
      return cache.current.value;
    }

    // Generar nuevo valor y actualizar cache
    const newValue = factory();
    cache.current = {
      value: newValue,
      timestamp: now,
      deps: [...deps],
    };

    return newValue;
  }, deps);
}

/**
 * Hook para batching de actualizaciones de estado
 */
export function useBatchedState<T>(
  initialState: T | (() => T),
  batchDelay: number = 16 // Un frame de 60fps
) {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<((prev: T) => T)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(() => {
    if (pendingUpdates.current.length > 0) {
      setState((prevState: T) => {
        let newState = prevState;
        pendingUpdates.current.forEach(update => {
          newState = update(newState);
        });
        return newState;
      });
      pendingUpdates.current = [];
    }
    timeoutRef.current = null;
  }, []);

  const batchedSetState = useCallback((update: T | ((prev: T) => T)) => {
    const updateFn = typeof update === 'function' ? update as (prev: T) => T : () => update;
    
    pendingUpdates.current.push(updateFn);

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(flushUpdates, batchDelay);
    }
  }, [flushUpdates, batchDelay]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        flushUpdates();
      }
    };
  }, [flushUpdates]);

  return [state, batchedSetState] as const;
}
