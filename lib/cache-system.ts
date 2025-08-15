// ======================================
// FASE 2: INTELLIGENT CACHING SYSTEM
// Advanced caching strategies for optimal performance
// ======================================

import { NextRequest, NextResponse } from 'next/server';

// === CACHE CONFIGURATION ===
export const CACHE_STRATEGIES = {
  // Static content - long cache
  STATIC: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400, // 1 day
  },
  
  // API data - medium cache
  API_DATA: {
    maxAge: 300, // 5 minutes
    sMaxAge: 300,
    staleWhileRevalidate: 60, // 1 minute
  },
  
  // User-specific data - short cache
  USER_DATA: {
    maxAge: 60, // 1 minute
    sMaxAge: 60,
    staleWhileRevalidate: 30, // 30 seconds
  },
  
  // Real-time data - no cache
  REALTIME: {
    maxAge: 0,
    sMaxAge: 0,
    mustRevalidate: true,
  } as const,
  
  // Search results - smart cache
  SEARCH: {
    maxAge: 180, // 3 minutes
    sMaxAge: 180,
    staleWhileRevalidate: 60,
  }
} as const;

// === CACHE HELPER FUNCTIONS ===

export function getCacheHeaders(strategy: keyof typeof CACHE_STRATEGIES) {
  const config = CACHE_STRATEGIES[strategy];
  
  const headers: Record<string, string> = {};
  
  if ('mustRevalidate' in config && config.mustRevalidate) {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  } else {
    const cacheControl = [
      `max-age=${config.maxAge}`,
      `s-maxage=${config.sMaxAge}`
    ];
    
    if ('staleWhileRevalidate' in config && config.staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }
    
    headers['Cache-Control'] = cacheControl.join(', ');
  }
  
  return headers;
}

// Generate cache key with smart hashing
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((sorted, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        sorted[key] = params[key];
      }
      return sorted;
    }, {} as Record<string, any>);
  
  const paramsString = JSON.stringify(sortedParams);
  return `${prefix}:${btoa(paramsString).replace(/[^a-zA-Z0-9]/g, '')}`;
}

// === IN-MEMORY CACHE WITH TTL ===

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries

  set<T>(key: string, data: T, ttlSeconds: number = 300, tags: string[] = []): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      tags
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now <= entry.expiresAt).length;
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries: this.cache.size - validEntries
    };
  }
}

// Singleton cache instance
export const memoryCache = new InMemoryCache();

// === CACHE MIDDLEWARE FOR API ROUTES ===

export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    strategy: keyof typeof CACHE_STRATEGIES;
    keyGenerator?: (req: NextRequest) => string;
    tags?: string[];
    condition?: (req: NextRequest) => boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check if caching should be applied
    if (options.condition && !options.condition(req)) {
      return handler(req);
    }

    // Generate cache key
    const cacheKey = options.keyGenerator ? 
      options.keyGenerator(req) : 
      generateCacheKey(req.url, Object.fromEntries(req.nextUrl.searchParams));

    // Try to get from cache
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      const response = NextResponse.json(cached);
      
      // Add cache headers
      const cacheHeaders = getCacheHeaders(options.strategy);
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Execute handler
    const response = await handler(req);
    
    // Cache successful responses
    if (response.ok) {
      const data = await response.clone().json();
      const ttl = CACHE_STRATEGIES[options.strategy].maxAge;
      
      memoryCache.set(cacheKey, data, ttl, options.tags || []);
    }

    // Add cache headers
    const cacheHeaders = getCacheHeaders(options.strategy);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    response.headers.set('X-Cache', 'MISS');
    return response;
  };
}

// === SMART CACHE INVALIDATION ===

export class CacheInvalidator {
  static invalidateProjects() {
    memoryCache.invalidateByTag('projects');
  }

  static invalidateUserData(userId: string) {
    memoryCache.invalidateByTag(`user:${userId}`);
  }

  static invalidateConnections(userId: string) {
    memoryCache.invalidateByTag(`connections:${userId}`);
  }

  static invalidateMessages(conversationId: string) {
    memoryCache.invalidateByTag(`messages:${conversationId}`);
  }

  static invalidateSearch() {
    memoryCache.invalidateByTag('search');
  }

  static invalidateAll() {
    memoryCache.clear();
  }
}

// === CACHE WARMING STRATEGIES ===

export class CacheWarmer {
  static async warmProjectsCache() {
    try {
      // Warm popular project queries
      const popularQueries = [
        { category: 'tech' },
        { category: 'fintech' },
        { stage: 'mvp' },
        { seeking_cofounder: 'true' }
      ];

      for (const query of popularQueries) {
        const cacheKey = generateCacheKey('projects', query);
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          params.append(key, value);
        });
        
        const response = await fetch('/api/projects?' + params.toString());
        
        if (response.ok) {
          const data = await response.json();
          memoryCache.set(cacheKey, data, 300, ['projects']);
        }
      }
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  static async warmUserDataCache(userId: string) {
    try {
      // Warm user-specific data
      const endpoints = [
        `/api/users/${userId}/profile`,
        `/api/users/${userId}/projects`,
        `/api/users/${userId}/connections`
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          const cacheKey = generateCacheKey(endpoint, {});
          memoryCache.set(cacheKey, data, 60, [`user:${userId}`]);
        }
      }
    } catch (error) {
      console.warn('User cache warming failed:', error);
    }
  }
}

// === PERFORMANCE MONITORING ===

export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;
  private static startTime = Date.now();

  static recordHit() {
    this.hits++;
  }

  static recordMiss() {
    this.misses++;
  }

  static getMetrics() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const uptime = Date.now() - this.startTime;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      uptime: Math.floor(uptime / 1000) + 's',
      cacheStats: memoryCache.getStats()
    };
  }

  static reset() {
    this.hits = 0;
    this.misses = 0;
    this.startTime = Date.now();
  }
}

// === USAGE EXAMPLES ===

/*
// In API route:
export const GET = withCache(
  async (req: NextRequest) => {
    // Your API logic here
    const data = await fetchProjects();
    return NextResponse.json(data);
  },
  {
    strategy: 'API_DATA',
    tags: ['projects'],
    keyGenerator: (req) => generateCacheKey('projects', Object.fromEntries(req.nextUrl.searchParams)),
    condition: (req) => req.method === 'GET'
  }
);

// Manual caching:
const cacheKey = generateCacheKey('user-profile', { userId: '123' });
const cached = memoryCache.get(cacheKey);
if (!cached) {
  const data = await fetchUserProfile('123');
  memoryCache.set(cacheKey, data, 300, ['user:123']);
}
*/

export default {
  getCacheHeaders,
  generateCacheKey,
  memoryCache,
  withCache,
  CacheInvalidator,
  CacheWarmer,
  CacheMetrics
};
