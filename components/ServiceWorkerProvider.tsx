'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeServiceWorker, useServiceWorker } from '@/lib/serviceWorker';

interface ServiceWorkerContextType {
  isOnline: boolean;
  cacheStats: Record<string, number>;
  clearCache: (cacheName?: string) => Promise<void>;
  preloadRoute: (route: string) => Promise<void>;
  getPerformanceMetrics: () => Promise<any>;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | undefined>(undefined);

interface ServiceWorkerProviderProps {
  children: ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const serviceWorkerData = useServiceWorker();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize service worker on client side
    if (typeof window !== 'undefined' && !isInitialized) {
      console.log('🚀 Initializing Service Worker...');
      initializeServiceWorker();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return (
    <ServiceWorkerContext.Provider value={serviceWorkerData}>
      {children}
      {/* Offline Indicator */}
      <OfflineIndicator isOnline={serviceWorkerData.isOnline} />
    </ServiceWorkerContext.Provider>
  );
}

export function useServiceWorkerContext() {
  const context = useContext(ServiceWorkerContext);
  if (context === undefined) {
    throw new Error('useServiceWorkerContext must be used within a ServiceWorkerProvider');
  }
  return context;
}

// Offline Indicator Component
function OfflineIndicator({ isOnline }: { isOnline: boolean }) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Hide indicator after coming back online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-200' : 'bg-red-200'
          }`}
        />
        <span className="text-sm font-medium">
          {isOnline ? '🌐 Back online' : '📴 You are offline'}
        </span>
      </div>
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const { getPerformanceMetrics } = useServiceWorkerContext();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const newMetrics = await getPerformanceMetrics();
        setMetrics(newMetrics);
      } catch (error) {
        console.error('Failed to get performance metrics:', error);
      }
    };

    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    updateMetrics(); // Initial load

    return () => clearInterval(interval);
  }, [getPerformanceMetrics]);

  return metrics;
}

// Cache management hook
export function useCacheManagement() {
  const { cacheStats, clearCache } = useServiceWorkerContext();

  const getCacheSize = () => {
    return Object.values(cacheStats).reduce((total, size) => total + size, 0);
  };

  const clearAllCaches = async () => {
    try {
      await clearCache();
      console.log('✅ All caches cleared');
      // Optionally refresh the page
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
    }
  };

  return {
    cacheStats,
    cacheSize: getCacheSize(),
    clearAllCaches,
    clearSpecificCache: clearCache,
  };
}

// Default export for compatibility
export default ServiceWorkerProvider;
