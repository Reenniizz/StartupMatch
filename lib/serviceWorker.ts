'use client';

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = true;
  private cacheStats: Record<string, number> = {};
  
  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeServiceWorker();
      this.setupOnlineOfflineHandlers();
    }
  }
  
  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }
  
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        console.log('🔄 Registering Service Worker...');
        
        this.registration = await navigator.serviceWorker.register(
          '/service-worker.js',
          { 
            scope: '/',
            updateViaCache: 'none'
          }
        );
        
        console.log('✅ Service Worker registered successfully');
        
        // Handle updates
        this.registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
          this.handleServiceWorkerUpdate();
        });
        
        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });
        
        // Check for updates periodically
        setInterval(() => {
          this.registration?.update();
        }, 60000); // Check every minute
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Workers not supported');
    }
  }
  
  private handleServiceWorkerUpdate() {
    const installingWorker = this.registration?.installing;
    
    if (installingWorker) {
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available
            this.showUpdateNotification();
          }
        }
      });
    }
  }
  
  private showUpdateNotification() {
    // Show user-friendly update notification
    if (window.confirm('A new version is available! Reload to update?')) {
      window.location.reload();
    }
  }
  
  private setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });
    
    // Initial status
    this.isOnline = navigator.onLine;
  }
  
  private handleOnlineStatusChange(isOnline: boolean) {
    // Notify app about online status change
    const event = new CustomEvent('onlinestatuschange', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
    
    if (isOnline) {
      // Sync queued actions
      this.triggerBackgroundSync();
    }
  }
  
  private handleServiceWorkerMessage(event: MessageEvent) {
    if (event.data.type === 'CACHE_UPDATED') {
      console.log('📦 Cache updated:', event.data.cache);
    }
  }
  
  // Public methods
  public async getCacheStats(): Promise<Record<string, number>> {
    return new Promise((resolve) => {
      if (!this.registration || !navigator.serviceWorker.controller) {
        resolve({});
        return;
      }
      
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_STATS' },
        [messageChannel.port2]
      );
    });
  }
  
  public async clearCache(cacheName?: string): Promise<void> {
    if ('caches' in window) {
      if (cacheName) {
        await caches.delete(cacheName);
        console.log(`🗑️ Cache cleared: ${cacheName}`);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ All caches cleared');
      }
    }
  }
  
  public async preloadRoute(route: string): Promise<void> {
    try {
      await fetch(route, { 
        method: 'GET',
        cache: 'force-cache'
      });
      console.log(`📥 Route preloaded: ${route}`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload route: ${route}`, error);
    }
  }
  
  public async preloadCriticalRoutes(): Promise<void> {
    const criticalRoutes = [
      '/projects',
      '/dashboard',
      '/matches',
      '/messages'
    ];
    
    await Promise.all(
      criticalRoutes.map(route => this.preloadRoute(route))
    );
  }
  
  private async triggerBackgroundSync(): Promise<void> {
    if (this.registration && 'sync' in this.registration) {
      try {
        // @ts-ignore - Background sync is experimental
        await this.registration.sync.register('background-sync');
        console.log('🔄 Background sync triggered');
      } catch (error) {
        console.warn('⚠️ Background sync failed:', error);
      }
    }
  }
  
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
  
  public async getNetworkInfo(): Promise<any> {
    // @ts-ignore - Network Information API
    if ('connection' in navigator) {
      // @ts-ignore - Network Information API is experimental
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      };
    }
    return null;
  }
  
  // Performance monitoring
  public async getPerformanceMetrics(): Promise<any> {
    const cacheStats = await this.getCacheStats();
    const networkInfo = await this.getNetworkInfo();
    
    return {
      isOnline: this.isOnline,
      cacheStats,
      networkInfo,
      serviceWorkerActive: !!this.registration?.active,
      timestamp: new Date().toISOString()
    };
  }
}

// Hook for React components
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheStats, setCacheStats] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const swManager = ServiceWorkerManager.getInstance();
    
    // Initial status
    setIsOnline(swManager.getOnlineStatus());
    
    // Listen for online status changes
    const handleOnlineStatusChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline);
    };
    
    window.addEventListener('onlinestatuschange', handleOnlineStatusChange as EventListener);
    
    // Get cache stats
    swManager.getCacheStats().then(setCacheStats);
    
    return () => {
      window.removeEventListener('onlinestatuschange', handleOnlineStatusChange as EventListener);
    };
  }, []);
  
  const swManager = ServiceWorkerManager.getInstance();
  
  return {
    isOnline,
    cacheStats,
    clearCache: swManager.clearCache.bind(swManager),
    preloadRoute: swManager.preloadRoute.bind(swManager),
    getPerformanceMetrics: swManager.getPerformanceMetrics.bind(swManager)
  };
}

// React and useState import
import { useEffect, useState } from 'react';

// Initialize service worker on app start
export const initializeServiceWorker = () => {
  if (typeof window !== 'undefined') {
    ServiceWorkerManager.getInstance();
  }
};
