/**
 * API Security Helper Functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, requireAuth } from './auth';
import { validateRequest, ValidationSchema } from './security';
import { applyCorsHeaders, checkRateLimit, RATE_LIMITS, logSecurityEvent } from './cors';
import { securityLogger } from './logger';

// Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SecureAPIConfig {
  requireAuth?: boolean;
  requireRoles?: string[];
  rateLimit?: keyof typeof RATE_LIMITS;
  validation?: ValidationSchema;
  corsEnabled?: boolean;
  logAccess?: boolean;
}

/**
 * Secure API wrapper that handles common security concerns
 */
export function withSecureAPI(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  config: SecureAPIConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // CORS preflight handling
      if (request.method === 'OPTIONS' && config.corsEnabled !== false) {
        const origin = request.headers.get('origin');
        const response = new Response(null, { status: 200 });
        
        // Apply CORS headers
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400');
        
        if (origin) {
          response.headers.set('Access-Control-Allow-Origin', origin);
          response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        
        return new NextResponse(response.body, response);
      }

      // Security logging
      if (config.logAccess) {
        logSecurityEvent('API_ACCESS', {
          endpoint: request.nextUrl.pathname,
          method: request.method,
        }, request);
      }

      // Rate limiting
      if (config.rateLimit) {
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        
        const rateLimitCheck = checkRateLimit(
          `${clientIP}:${config.rateLimit}`,
          RATE_LIMITS[config.rateLimit]
        );
        
        if (!rateLimitCheck.allowed) {
          logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            ip: clientIP,
            endpoint: request.nextUrl.pathname,
            rateLimit: config.rateLimit,
          }, request);
          
          return NextResponse.json(
            { 
              error: 'Too Many Requests',
              message: RATE_LIMITS[config.rateLimit].message,
              retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
            },
            { status: 429 }
          );
        }
      }

      // Authentication
      let authContext = null;
      if (config.requireAuth) {
        const authResult = await verifyAuth(request);
        
        if (!authResult.user) {
          logSecurityEvent('AUTH_FAILURE', {
            endpoint: request.nextUrl.pathname,
            error: 'Authentication failed',
          }, request);
          
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
        
        authContext = authResult.user;
      }

      // Role-based authorization
      if (config.requireRoles && config.requireRoles.length > 0) {
        const authResult = await requireAuth(request, {
          action: 'read',
          resource: 'api'
        });
        
        if (!authResult.authorized || !authResult.user) {
          logSecurityEvent('AUTHORIZATION_FAILURE', {
            endpoint: request.nextUrl.pathname,
            requiredRoles: config.requireRoles,
            error: 'Authorization failed',
          }, request);
          
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        // Additional role check
        const userRole = authResult.user.role || 'user';
        if (!config.requireRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient role permissions' },
            { status: 403 }
          );
        }
        
        authContext = authResult.user;
      }

      // Input validation
      let validatedData = null;
      if (config.validation && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          const body = await request.json();
          const validation = validateRequest(body, config.validation);
          
          if (!validation.isValid) {
            logSecurityEvent('VALIDATION_FAILURE', {
              endpoint: request.nextUrl.pathname,
              errors: validation.errors,
            }, request);
            
            return NextResponse.json(
              { 
                error: 'Validation Error',
                details: validation.errors
              },
              { status: 400 }
            );
          }
          
          validatedData = validation.sanitizedData;
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
          );
        }
      }

      // Execute the handler with security context
      const enhancedContext = {
        ...context,
        user: authContext,
        validatedData,
        supabase,
      };

      const response = await handler(request, enhancedContext);

      // Apply CORS headers if enabled
      if (config.corsEnabled !== false) {
        return applyCorsHeaders(request, response);
      }

      // Performance logging
      const duration = Date.now() - startTime;
      if (duration > 1000) { // Log slow requests
        securityLogger.warn('Slow API response', {
          endpoint: request.nextUrl.pathname,
          duration,
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logSecurityEvent('API_ERROR', {
        endpoint: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }, request);
      
      securityLogger.error('API Handler Error', error);
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Common validation schemas for API endpoints
 */
export const API_VALIDATION_SCHEMAS = {
  // User profile validation
  profile: {
    name: { 
      required: true, 
      type: 'string' as const, 
      minLength: 2, 
      maxLength: 100, 
      sanitize: true 
    },
    bio: { 
      type: 'string' as const, 
      maxLength: 500, 
      sanitize: true 
    },
    skills: { 
      type: 'string' as const, 
      maxLength: 1000, 
      sanitize: true 
    },
  },
  
  // Project validation
  project: {
    title: { 
      required: true, 
      type: 'string' as const, 
      minLength: 3, 
      maxLength: 100, 
      sanitize: true 
    },
    description: { 
      required: true, 
      type: 'string' as const, 
      minLength: 10, 
      maxLength: 2000, 
      sanitize: true 
    },
    category: { 
      required: true, 
      type: 'string' as const, 
      maxLength: 50 
    },
    funding_goal: { 
      type: 'number' as const, 
      custom: (value: any) => {
        const num = Number(value);
        return (num >= 0 && num <= 10000000) || 'Funding goal must be between 0 and 10M';
      }
    },
  },
  
  // Message validation
  message: {
    content: { 
      required: true, 
      type: 'string' as const, 
      minLength: 1, 
      maxLength: 1000, 
      sanitize: true 
    },
    recipient_id: { 
      required: true, 
      type: 'uuid' as const 
    },
  },
  
  // Connection request validation
  connection: {
    message: { 
      type: 'string' as const, 
      maxLength: 500, 
      sanitize: true 
    },
    target_user_id: { 
      required: true, 
      type: 'uuid' as const 
    },
  },
  
  // Search validation
  search: {
    query: { 
      required: true, 
      type: 'string' as const, 
      minLength: 1, 
      maxLength: 100, 
      sanitize: true 
    },
    limit: { 
      type: 'number' as const,
      custom: (value: any) => {
        const num = Number(value);
        return (num >= 1 && num <= 50) || 'Limit must be between 1 and 50';
      }
    },
  },
} as const;

/**
 * Helper to extract user ID from authenticated context
 */
export function getUserId(context: any): string | null {
  return context?.user?.id || null;
}

/**
 * Helper to check if user owns resource
 */
export async function checkResourceOwnership(
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(resourceType)
      .select('user_id, owner_id')
      .eq('id', resourceId)
      .single();
    
    if (error || !data) return false;
    
    return data.user_id === userId || data.owner_id === userId;
  } catch {
    return false;
  }
}

/**
 * Database query helper with automatic user filtering
 */
export class SecureQuery {
  private table: string;
  private supabaseClient: any;
  
  constructor(tableName: string) {
    this.table = tableName;
    this.supabaseClient = supabase;
  }
  
  // Get records owned by user
  async getByUser(userId: string, columns = '*') {
    return await this.supabaseClient
      .from(this.table)
      .select(columns)
      .eq('user_id', userId);
  }
  
  // Get single record with ownership check
  async getById(id: string, userId: string, columns = '*') {
    return await this.supabaseClient
      .from(this.table)
      .select(columns)
      .eq('id', id)
      .eq('user_id', userId)
      .single();
  }
  
  // Create record with user ownership
  async create(data: any, userId: string) {
    return await this.supabaseClient
      .from(this.table)
      .insert({ ...data, user_id: userId })
      .select()
      .single();
  }
  
  // Update record with ownership check
  async update(id: string, userId: string, data: any) {
    return await this.supabaseClient
      .from(this.table)
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
  }
  
  // Delete record with ownership check
  async delete(id: string, userId: string) {
    return await this.supabaseClient
      .from(this.table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  }
}

// Export commonly used secure query instances
export const secureQueries = {
  projects: new SecureQuery('projects'),
  profiles: new SecureQuery('profiles'),
  messages: new SecureQuery('messages'),
  connections: new SecureQuery('connection_requests'),
  notifications: new SecureQuery('notifications'),
};
