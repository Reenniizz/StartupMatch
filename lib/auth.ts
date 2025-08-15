// lib/auth.ts - Sistema centralizado de autenticación y autorización
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger, securityLogger } from './logger';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface AuthContext {
  user: AuthUser | null;
  session: any;
  error?: string;
}

/**
 * Extraer y validar token JWT del request
 */
export function extractToken(request: NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Check cookies
  const cookieToken = request.cookies.get('sb-access-token')?.value ||
                      request.cookies.get('supabase-auth-token')?.value;
  
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

/**
 * Verificar autenticación del usuario
 */
export async function verifyAuth(request: NextRequest): Promise<AuthContext> {
  const startTime = performance.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    const token = extractToken(request);
    
    if (!token) {
      securityLogger.warn('Authentication attempt without token', {
        path: request.nextUrl.pathname,
        method: request.method,
        ip,
        userAgent: request.headers.get('user-agent')?.slice(0, 100)
      });
      
      return {
        user: null,
        session: null,
        error: 'No authentication token provided'
      };
    }

    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      securityLogger.warn('Authentication failed - Invalid token', {
        path: request.nextUrl.pathname,
        method: request.method,
        ip,
        error: authError?.message,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      
      return {
        user: null,
        session: null,
        error: authError?.message || 'Invalid token'
      };
    }

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      path: request.nextUrl.pathname,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    return {
      user: authUser,
      session: session,
      error: undefined
    };
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    securityLogger.error('Authentication system error', error as Error, {
      path: request.nextUrl.pathname,
      method: request.method,
      ip,
      duration: `${duration.toFixed(2)}ms`
    });
    
    return {
      user: null,
      session: null,
      error: 'Authentication system error'
    };
  }
}

/**
 * Verificar permisos específicos del usuario
 */
export async function verifyPermissions(
  user: AuthUser,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> {
  try {
    // Admin users have all permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // Resource-specific permissions
    switch (resource) {
      case 'projects':
        return action === 'read' || action === 'write'; // All users can read/write projects
        
      case 'users':
        return action === 'read'; // Only read access to users
        
      case 'admin':
        return user.role === 'admin'; // Only admin access
        
      case 'own-profile':
        return true; // Users can always access their own profile
        
      default:
        logger.warn('Unknown resource permission check', {
          userId: user.id,
          resource,
          action
        });
        return false;
    }
    
  } catch (error) {
    securityLogger.error('Permission verification error', error as Error, {
      userId: user.id,
      resource,
      action
    });
    return false;
  }
}

/**
 * Middleware helper para rutas protegidas
 */
export async function requireAuth(
  request: NextRequest,
  options: {
    resource?: string;
    action?: 'read' | 'write' | 'delete' | 'admin';
    allowUnauthenticated?: boolean;
  } = {}
): Promise<{
  authorized: boolean;
  user: AuthUser | null;
  response?: Response;
}> {
  const authContext = await verifyAuth(request);
  
  // If authentication failed and we don't allow unauthenticated access
  if (!authContext.user && !options.allowUnauthenticated) {
    return {
      authorized: false,
      user: null,
      response: new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: authContext.error || 'Please log in to access this resource',
          code: 'AUTH_REQUIRED'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="API", charset="UTF-8"'
          }
        }
      )
    };
  }
  
  // If we have specific resource/action requirements
  if (authContext.user && options.resource && options.action) {
    const hasPermission = await verifyPermissions(
      authContext.user,
      options.resource,
      options.action
    );
    
    if (!hasPermission) {
      securityLogger.warn('Insufficient permissions', {
        userId: authContext.user.id,
        resource: options.resource,
        action: options.action,
        path: request.nextUrl.pathname
      });
      
      return {
        authorized: false,
        user: authContext.user,
        response: new Response(
          JSON.stringify({
            error: 'Insufficient permissions',
            message: `You don't have permission to ${options.action} ${options.resource}`,
            code: 'INSUFFICIENT_PERMISSIONS'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      };
    }
  }
  
  return {
    authorized: true,
    user: authContext.user
  };
}

/**
 * Validar que el usuario puede acceder a un recurso específico
 */
export async function validateResourceAccess(
  user: AuthUser,
  resourceType: 'project' | 'conversation' | 'connection',
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'project':
        // Check if user owns the project or is a collaborator
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id, collaborators')
          .eq('id', resourceId)
          .single();
          
        if (project?.owner_id === user.id) {
          return true;
        }
        
        if (project?.collaborators && Array.isArray(project.collaborators)) {
          return project.collaborators.includes(user.id);
        }
        
        return false;
        
      case 'conversation':
        // Check if user is participant in conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .select('participants')
          .eq('id', resourceId)
          .single();
          
        return conversation?.participants?.includes(user.id) || false;
        
      case 'connection':
        // Check if user is part of the connection request
        const { data: connection } = await supabase
          .from('connection_requests')
          .select('requester_id, requested_id')
          .eq('id', resourceId)
          .single();
          
        return connection?.requester_id === user.id || connection?.requested_id === user.id;
        
      default:
        return false;
    }
    
  } catch (error) {
    securityLogger.error('Resource access validation error', error as Error, {
      userId: user.id,
      resourceType,
      resourceId
    });
    return false;
  }
}

/**
 * Security headers helper
 */
export function addSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

/**
 * Rate limiting for authentication attempts
 */
export async function checkAuthRateLimit(
  identifier: string,
  action: 'login' | 'register' | 'reset-password'
): Promise<{ allowed: boolean; resetTime?: number }> {
  // This would integrate with your rate limiting system
  // For now, implement basic in-memory rate limiting
  const rateLimits = {
    'login': { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    'register': { attempts: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
    'reset-password': { attempts: 2, window: 60 * 60 * 1000 } // 2 attempts per hour
  };
  
  // Implementation would go here - integrate with existing rate limiter
  return { allowed: true };
}

export default {
  verifyAuth,
  requireAuth,
  verifyPermissions,
  validateResourceAccess,
  extractToken,
  addSecurityHeaders,
  checkAuthRateLimit
};
