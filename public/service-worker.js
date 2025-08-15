// service-worker.js - Advanced caching strategy
const CACHE_NAME = 'startupmatch-v1.2';
const STATIC_CACHE = 'startupmatch-static-v1.2';
const DYNAMIC_CACHE = 'startupmatch-dynamic-v1.2';
const API_CACHE = 'startupmatch-api-v1.2';

// Cache strategies
const CACHE_STRATEGIES = {
  static: 'cache-first',
  dynamic: 'network-first',
  api: 'network-first-with-cache'
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register', 
  '/dashboard',
  '/projects',
  '/offline', // Offline fallback page
  '/static/js/bundle.js',
  '/static/css/bundle.css',
  '/manifest.json'
];

// Dynamic cache patterns
const DYNAMIC_PATTERNS = [
  /^\/projects\/\d+$/,
  /^\/profile\/\d+$/,
  /^\/messages/,
  /^\/matches/
];

// API cache patterns
const API_PATTERNS = [
  /^\/api\/projects/,
  /^\/api\/users/,
  /^\/api\/dashboard/
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v1.2');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Static assets cached successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Failed to cache static assets:', error);
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v1.2');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches
            return cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE && 
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch handler with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // 1. API Requests - Network first with cache fallback
    if (isAPIRequest(pathname)) {
      return handleAPIRequest(request);
    }
    
    // 2. Static Assets - Cache first
    if (isStaticAsset(pathname)) {
      return handleStaticRequest(request);
    }
    
    // 3. Dynamic Pages - Network first with cache fallback
    if (isDynamicPage(pathname)) {
      return handleDynamicRequest(request);
    }
    
    // 4. Default - Network first
    return handleDefaultRequest(request);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    return handleOfflineFallback(request);
  }
}

// API Request Handler
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      
      // Add cache headers
      const response = networkResponse.clone();
      response.headers.set('sw-cache', 'network');
      return response;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      cachedResponse.headers.set('sw-cache', 'cache');
      return cachedResponse;
    }
    
    // Return offline API response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static Asset Handler
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Cache first strategy
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset failed:', error);
    throw error;
  }
}

// Dynamic Page Handler  
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed for dynamic page, trying cache:', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Default Request Handler
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Default request failed:', request.url);
    return handleOfflineFallback(request);
  }
}

// Offline Fallback Handler
async function handleOfflineFallback(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // For navigation requests, return offline page
  if (request.destination === 'document') {
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('You are offline', { status: 503 });
  }
  
  // For other requests, return cached version or error
  const cachedResponse = await cache.match(request);
  return cachedResponse || new Response('Offline', { status: 503 });
}

// Utility functions
function isAPIRequest(pathname) {
  return API_PATTERNS.some(pattern => pattern.test(pathname));
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/static/') || 
         pathname.startsWith('/_next/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg');
}

function isDynamicPage(pathname) {
  return DYNAMIC_PATTERNS.some(pattern => pattern.test(pathname));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Process queued actions when online
    const actions = await getQueuedActions();
    
    for (const action of actions) {
      await processAction(action);
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'startupmatch-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('StartupMatch', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}
