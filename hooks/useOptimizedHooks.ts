import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';

// Hook de debounce optimizado con cleanup
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook de debounce para funciones con cleanup
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Hook de lazy loading optimizado con Intersection Observer
export function useLazyLoading<T>(
  items: T[],
  itemsPerPage: number = 20,
  threshold: number = 0.1
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Cargar items iniciales
  useEffect(() => {
    setVisibleItems(items.slice(0, itemsPerPage));
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  // Configurar Intersection Observer
  useEffect(() => {
    if (!loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold }
    );

    observerRef.current = observer;
    observer.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading]);

  const loadMore = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);
    
    // Simular carga asíncrona
    setTimeout(() => {
      const currentLength = visibleItems.length;
      const newItems = items.slice(currentLength, currentLength + itemsPerPage);
      
      setVisibleItems(prev => [...prev, ...newItems]);
      setHasMore(currentLength + itemsPerPage < items.length);
      setIsLoading(false);
    }, 300);
  }, [items, visibleItems.length, itemsPerPage, isLoading]);

  const reset = useCallback(() => {
    setVisibleItems(items.slice(0, itemsPerPage));
    setHasMore(items.length > itemsPerPage);
    setIsLoading(false);
  }, [items, itemsPerPage]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadingRef,
    loadMore,
    reset,
  };
}

// Hook de memoización optimizada para arrays
export function useMemoizedArray<T>(
  array: T[],
  compareFn?: (a: T, b: T) => boolean
): T[] {
  return useMemo(() => {
    if (!compareFn) return array;
    
    // Memoización inteligente basada en función de comparación
    return array.filter((item, index, arr) => {
      const firstIndex = arr.findIndex(arrItem => compareFn(item, arrItem));
      return firstIndex === index;
    });
  }, [array, compareFn]);
}

// Hook de memoización para objetos con comparación profunda
export function useDeepMemo<T>(value: T, deps: any[]): T {
  const ref = useRef<{ value: T; deps: any[] }>();

  if (!ref.current || !shallowEqual(ref.current.deps, deps)) {
    ref.current = { value, deps };
  }

  return ref.current.value;
}

// Hook de scroll optimizado con throttling
export function useScrollPosition(throttleMs: number = 100) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          setScrollPosition(currentScrollY);
          setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
          lastScrollY.current = currentScrollY;
          
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollPosition, scrollDirection };
}

// Hook de viewport optimizado
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewport;
}

// Hook de media queries optimizado
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Hook de breakpoints basado en Tailwind
export function useBreakpoints() {
  const xs = useMediaQuery('(min-width: 475px)');
  const sm = useMediaQuery('(min-width: 640px)');
  const md = useMediaQuery('(min-width: 768px)');
  const lg = useMediaQuery('(min-width: 1024px)');
  const xl = useMediaQuery('(min-width: 1280px)');
  const twoXl = useMediaQuery('(min-width: 1536px)');

  return {
    xs,
    sm,
    md,
    lg,
    xl,
    '2xl': twoXl,
    isMobile: !md,
    isTablet: md && !lg,
    isDesktop: lg,
    isLargeDesktop: xl,
  };
}

// Hook de local storage optimizado
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook de session storage optimizado
export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook de click outside optimizado
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Hook de keyboard shortcuts optimizado
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrl, shift, alt, meta } = options;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !!event.ctrlKey === !!ctrl &&
        !!event.shiftKey === !!shift &&
        !!event.altKey === !!alt &&
        !!event.metaKey === !!meta
      ) {
        event.preventDefault();
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, options]);
}

// Hook de online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook de focus optimizado
export function useFocus() {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  const blur = useCallback(() => {
    ref.current?.blur();
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return { isFocused, ref, focus, blur };
}

// Utilidades auxiliares
function shallowEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Hook de performance para medir renders
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

// Hook de cleanup automático para timers
export function useTimer() {
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = global.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  const clearTimeout = useCallback((timer: NodeJS.Timeout) => {
    global.clearTimeout(timer);
    timers.current.delete(timer);
  }, []);

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const timer = global.setInterval(callback, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  const clearInterval = useCallback((timer: NodeJS.Timeout) => {
    global.clearInterval(timer);
    timers.current.delete(timer);
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach(timer => {
        global.clearTimeout(timer);
        global.clearInterval(timer);
      });
      timers.current.clear();
    };
  }, []);

  return { setTimeout, clearTimeout, setInterval, clearInterval };
}
