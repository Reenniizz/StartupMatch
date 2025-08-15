/**
 * CORS Configuration and Security Headers
 */

import { NextResponse } from 'next/server';
import { securityLogger } from './logger';

// Environment-based CORS configuration
const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Production allowed origins
const PRODUCTION_ORIGINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://app.yourdomain.com',
  // Add your actual production domains here
];

// Development allowed origins
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://localhost:3000',
  'https://localhost:3001',
];

// Get allowed origins based on environment
export function getAllowedOrigins(): string[] {
  if (isDev) {
    return [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS];
  }
  return PRODUCTION_ORIGINS;
}

// Check if origin is allowed
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return isDev; // Allow requests with no origin in development only
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

// Security headers configuration
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // CORS headers
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name',
    'Access-Control-Max-Age': '86400', // 24 hours
    
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    
    // HSTS (only in production with HTTPS)
    ...(isProduction ? {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
    } : {}),
    
    // CSP Header
    'Content-Security-Policy': getContentSecurityPolicy(),
    
    // Permissions Policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  return headers;
}

// Content Security Policy
function getContentSecurityPolicy(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  return policies.join('; ');
}

// Apply CORS headers to response
export function applyCorsHeaders(
  request: Request,
  response: NextResponse
): NextResponse {
  const origin = request.headers.get('origin');
  
  // Apply security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Handle CORS origin
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // Log blocked origin for security monitoring
    securityLogger.warn('CORS: Blocked origin', { 
      origin,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });
    
    // Don't set CORS headers for blocked origins
    response.headers.delete('Access-Control-Allow-Origin');
    response.headers.delete('Access-Control-Allow-Credentials');
  }
  
  return response;
}

// Handle preflight OPTIONS requests
export function handlePreflightRequest(request: Request): Response {
  const origin = request.headers.get('origin');
  
  if (!isOriginAllowed(origin)) {
    securityLogger.warn('CORS: Blocked preflight request', { 
      origin,
      userAgent: request.headers.get('user-agent')
    });
    
    return new Response(null, { status: 403 });
  }
  
  const response = new Response(null, { status: 200 });
  
  // Apply CORS headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

// Middleware helper for API routes
export function withCors(handler: Function) {
  return async (request: Request, context?: any) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request);
    }
    
    // Execute the original handler
    const response = await handler(request, context);
    
    // Apply CORS headers to the response
    return applyCorsHeaders(request, response);
  };
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limit configurations
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    message: 'Too many authentication attempts'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many upload requests'
  },
  
  // General endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many requests'
  }
};

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetTime: now + config.windowMs };
  }
  
  if (current.count >= config.max) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: config.max - current.count, 
    resetTime: current.resetTime 
  };
}

// Clean up expired entries (run periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}

// Security audit logger
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request?: Request
): void {
  const logData = {
    event,
    ...details,
    timestamp: new Date().toISOString(),
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
    userAgent: request?.headers.get('user-agent'),
    referer: request?.headers.get('referer'),
  };
  
  securityLogger.info('Security Event', logData);
}
