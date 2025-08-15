// lib/rate-limiting.ts - Sistema avanzado de rate limiting
import { NextRequest } from 'next/server';
import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    this.store.forEach((entry, key) => {
      if (entry.resetTime < now) {
        this.store.delete(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  private getKey(req: NextRequest, keyGenerator?: (req: NextRequest) => string): string {
    if (keyGenerator) {
      return keyGenerator(req);
    }
    
    // Default key: IP + User Agent + Path
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const path = new URL(req.url).pathname;
    
    return `${ip}:${userAgent.slice(0, 50)}:${path}`;
  }

  async checkRateLimit(req: NextRequest, config: RateLimitConfig): Promise<{
    success: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const key = this.getKey(req, config.keyGenerator);
    const now = Date.now();
    const windowStart = now;
    const resetTime = windowStart + config.windowMs;

    let entry = this.store.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime,
        firstRequestTime: now
      };
      this.store.set(key, entry);
    }

    // Increment counter
    entry.count++;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const success = entry.count <= config.maxRequests;

    // Log rate limit violations
    if (!success) {
      logger.warn('Rate limit exceeded', {
        key: key.split(':')[0], // Only log IP part for privacy
        path: new URL(req.url).pathname,
        method: req.method,
        count: entry.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      });
    }

    return {
      success,
      remaining,
      resetTime: entry.resetTime,
      totalHits: entry.count
    };
  }

  // Specific rate limiters for different use cases
  
  // API rate limiter - 100 requests per 15 minutes
  async apiRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many API requests, please try again later.'
    });
  }

  // Authentication rate limiter - 5 attempts per 15 minutes per IP
  async authRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => {
        const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        return `auth:${ip}`;
      },
      message: 'Too many authentication attempts, please try again later.'
    });
  }

  // File upload rate limiter - 10 uploads per hour
  async uploadRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (req) => {
        const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        return `upload:${ip}`;
      },
      message: 'Too many file uploads, please try again later.'
    });
  }

  // Search rate limiter - 50 searches per 5 minutes
  async searchRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 50,
      keyGenerator: (req) => {
        const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        return `search:${ip}`;
      },
      message: 'Too many search requests, please slow down.'
    });
  }

  // Message sending rate limiter - 20 messages per minute
  async messageRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyGenerator: (req) => {
        const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        return `message:${ip}`;
      },
      message: 'Too many messages sent, please wait before sending more.'
    });
  }

  // Connection request rate limiter - 10 connection requests per hour
  async connectionRateLimit(req: NextRequest) {
    return this.checkRateLimit(req, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (req) => {
        const ip = req.headers.get('x-forwarded-for') || 
                  req.headers.get('x-real-ip') || 
                  'unknown';
        return `connection:${ip}`;
      },
      message: 'Too many connection requests, please wait before making more.'
    });
  }

  // Get current stats for monitoring
  getStats() {
    const stats = {
      totalEntries: this.store.size,
      entriesByType: new Map<string, number>(),
      topIPs: new Map<string, number>()
    };

    this.store.forEach((entry, key) => {
      const [type, ip] = key.split(':');
      
      // Count by type
      const typeCount = stats.entriesByType.get(type) || 0;
      stats.entriesByType.set(type, typeCount + 1);
      
      // Count by IP
      const ipCount = stats.topIPs.get(ip) || 0;
      stats.topIPs.set(ip, ipCount + entry.count);
    });

    return {
      ...stats,
      entriesByType: Object.fromEntries(stats.entriesByType),
      topIPs: Object.fromEntries(
        Array.from(stats.topIPs.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
      )
    };
  }

  // Manual cleanup for testing
  clear() {
    this.store.clear();
  }

  // Graceful shutdown
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

// Utility function to create rate limit response
export function createRateLimitResponse(
  remaining: number, 
  resetTime: number, 
  message?: string
) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
      }
    }
  );
}
