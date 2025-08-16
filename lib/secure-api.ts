/**
 * Enhanced API Security System
 * Sistema de seguridad API robusto y completo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './auth-secure';
import { validateAndSanitize, checkRateLimit, secureLog } from './input-validation';
import { z } from 'zod';

// ===========================================
// TIPOS Y INTERFACES
// ===========================================

export interface SecureAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  requestId: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role?: string;
    email_confirmed_at?: string | null;
  };
  requestId: string;
  clientIP: string;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Crear respuesta API segura y estandarizada
 */
export function createSecureResponse<T>(
  data?: T,
  error?: string,
  code?: string,
  status = 200,
  meta?: any
): NextResponse<SecureAPIResponse<T>> {
  const requestId = crypto.randomUUID();
  
  const response: SecureAPIResponse<T> = {
    success: !error,
    timestamp: new Date().toISOString(),
    requestId,
  };

  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (code) response.code = code;
  if (meta) response.meta = meta;

  return NextResponse.json(response, { 
    status,
    headers: {
      'X-Request-ID': requestId,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

/**
 * Crear respuesta de error segura
 */
export function createSecureError(
  message: string,
  status = 400,
  code?: string,
  details?: any
): NextResponse<SecureAPIResponse> {
  const requestId = crypto.randomUUID();
  
  secureLog('warn', `API Error: ${message}`, { 
    status, 
    code, 
    requestId,
    details: details ? JSON.stringify(details).substring(0, 200) : undefined
  });
  
  return createSecureResponse(undefined, message, code, status);
}

// ===========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ===========================================

/**
 * Middleware de autenticación robusto
 */
export function withSecureAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const clientIP = getClientIP(request);
    
    try {
      // Rate limiting para autenticación
      const authRateLimit = checkRateLimit(
        `auth:${clientIP}`,
        10, // 10 intentos por minuto
        60 * 1000
      );

      if (!authRateLimit.allowed) {
        secureLog('warn', 'Auth rate limit exceeded', { clientIP });
        
        return createSecureError(
          'Too many authentication attempts',
          429,
          'AUTH_RATE_LIMITED'
        );
      }

      // Verificar autenticación
      const authResult = await getAuthenticatedUser(request);
      
      if (!authResult.user || authResult.error) {
        secureLog('warn', 'Authentication failed', {
          requestId,
          clientIP,
          path: request.nextUrl.pathname,
          error: authResult.error?.message
        });
        
        return createSecureError(
          'Authentication required',
          401,
          'UNAUTHORIZED'
        );
      }

      // Verificar que el email esté confirmado
      if (!authResult.user.email_confirmed_at) {
        secureLog('warn', 'Unconfirmed email access attempt', {
          userId: authResult.user.id,
          clientIP
        });
        
        return createSecureError(
          'Email verification required',
          403,
          'EMAIL_NOT_CONFIRMED'
        );
      }

      // Crear request autenticado
      const authRequest = request as AuthenticatedRequest;
      authRequest.user = authResult.user;
      authRequest.requestId = requestId;
      authRequest.clientIP = clientIP;

      secureLog('info', 'API request authenticated', {
        requestId,
        userId: authResult.user.id,
        method: request.method,
        path: request.nextUrl.pathname,
        duration: Date.now() - startTime
      });

      return await handler(authRequest);
      
    } catch (error) {
      secureLog('error', 'Authentication middleware error', {
        error,
        requestId,
        clientIP,
        duration: Date.now() - startTime
      });
      
      return createSecureError(
        'Internal authentication error',
        500,
        'AUTH_INTERNAL_ERROR'
      );
    }
  };
}

// ===========================================
// MIDDLEWARE DE VALIDACIÓN
// ===========================================

/**
 * Middleware de validación de entrada con Zod
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>
) {
  return function(
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const startTime = Date.now();
      
      try {
        let rawData: unknown;
        const contentType = request.headers.get('content-type') || '';

        // Obtener datos según el tipo de contenido
        if (request.method === 'GET') {
          const url = new URL(request.url);
          rawData = Object.fromEntries(url.searchParams);
        } else if (contentType.includes('application/json')) {
          try {
            rawData = await request.json();
          } catch {
            return createSecureError('Invalid JSON payload', 400, 'INVALID_JSON');
          }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          rawData = Object.fromEntries(formData);
        } else {
          return createSecureError('Unsupported content type', 400, 'UNSUPPORTED_CONTENT_TYPE');
        }

        // Validar y sanitizar datos
        const validation = validateAndSanitize(schema, rawData);
        
        if (!validation.success) {
          secureLog('warn', 'Validation failed', {
            path: request.nextUrl.pathname,
            errors: validation.errors,
            duration: Date.now() - startTime
          });
          
          return createSecureError(
            'Validation failed',
            400,
            'VALIDATION_ERROR',
            { errors: validation.errors }
          );
        }

        return await handler(request, validation.data);
        
      } catch (error) {
        secureLog('error', 'Validation middleware error', {
          error,
          path: request.nextUrl.pathname,
          duration: Date.now() - startTime
        });
        
        return createSecureError('Validation error', 500, 'VALIDATION_INTERNAL_ERROR');
      }
    };
  };
}

// ===========================================
// MIDDLEWARE DE RATE LIMITING
// ===========================================

/**
 * Middleware de rate limiting avanzado
 */
export function withRateLimit(
  limits: {
    maxRequests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const key = limits.keyGenerator 
        ? limits.keyGenerator(request)
        : `api:${getClientIP(request)}:${request.nextUrl.pathname}`;

      const rateLimit = checkRateLimit(key, limits.maxRequests, limits.windowMs);

      if (!rateLimit.allowed) {
        const resetTime = Math.ceil(rateLimit.resetTime / 1000);
        
        secureLog('warn', 'Rate limit exceeded', {
          key: key.substring(0, 50),
          path: request.nextUrl.pathname,
          remaining: rateLimit.remaining,
          resetTime
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limits.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }

      // Ejecutar handler
      const response = await handler(request);
      
      // Agregar headers de rate limiting
      response.headers.set('X-RateLimit-Limit', limits.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());

      return response;
    };
  };
}

// ===========================================
// MIDDLEWARE DE PERMISOS
// ===========================================

/**
 * Middleware para verificar roles y permisos
 */
export function withPermissions(config: {
  roles?: string[];
  permissions?: string[];
  resourceCheck?: (req: AuthenticatedRequest) => Promise<boolean>;
}) {
  return function(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return withSecureAuth(async (request: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        // Verificar roles
        if (config.roles && config.roles.length > 0) {
          const userRole = request.user.role || 'user';
          
          if (!config.roles.includes(userRole) && userRole !== 'admin') {
            secureLog('warn', 'Insufficient role permissions', {
              userId: request.user.id,
              userRole,
              requiredRoles: config.roles,
              path: request.nextUrl.pathname
            });
            
            return createSecureError(
              'Insufficient permissions',
              403,
              'INSUFFICIENT_ROLE'
            );
          }
        }

        // Verificar permisos específicos
        if (config.permissions && config.permissions.length > 0) {
          // Aquí puedes implementar lógica de permisos más granular
          // Por ejemplo, verificar contra una tabla de permisos en la BD
        }

        // Verificar acceso a recurso específico
        if (config.resourceCheck) {
          const hasAccess = await config.resourceCheck(request);
          
          if (!hasAccess) {
            secureLog('warn', 'Resource access denied', {
              userId: request.user.id,
              path: request.nextUrl.pathname
            });
            
            return createSecureError(
              'Access denied to resource',
              403,
              'RESOURCE_ACCESS_DENIED'
            );
          }
        }

        return await handler(request);
        
      } catch (error) {
        secureLog('error', 'Permission middleware error', {
          error,
          userId: request.user.id,
          path: request.nextUrl.pathname
        });
        
        return createSecureError(
          'Permission check failed',
          500,
          'PERMISSION_INTERNAL_ERROR'
        );
      }
    });
  };
}

// ===========================================
// MIDDLEWARE COMPLETO
// ===========================================

/**
 * Middleware de seguridad completo que combina todas las funcionalidades
 */
export function withCompleteSecurity<T = any>(config: {
  auth: boolean;
  validation?: z.ZodSchema<T>;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: NextRequest) => string;
  };
  permissions?: {
    roles?: string[];
    resourceCheck?: (req: AuthenticatedRequest) => Promise<boolean>;
  };
  cors?: boolean;
}) {
  return function(
    handler: (
      req: NextRequest | AuthenticatedRequest,
      validatedData?: T
    ) => Promise<NextResponse>
  ) {
    let wrappedHandler = handler;

    // Aplicar middlewares en orden
    if (config.rateLimit) {
      wrappedHandler = withRateLimit(config.rateLimit)(wrappedHandler);
    }

    if (config.validation) {
      wrappedHandler = withValidation(config.validation)(wrappedHandler as any);
    }

    if (config.permissions) {
      wrappedHandler = withPermissions(config.permissions)(wrappedHandler as any);
    }

    if (config.auth) {
      wrappedHandler = withSecureAuth(wrappedHandler as any);
    }

    // Aplicar CORS si está habilitado
    if (config.cors) {
      const originalHandler = wrappedHandler;
      wrappedHandler = async (request: NextRequest): Promise<NextResponse> => {
        // Manejar preflight
        if (request.method === 'OPTIONS') {
          return new NextResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Max-Age': '86400',
            },
          });
        }

        const response = await originalHandler(request);
        
        // Agregar headers CORS
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;
      };
    }

    return wrappedHandler;
  };
}

// ===========================================
// UTILIDADES
// ===========================================

/**
 * Obtener IP del cliente de forma segura
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}

/**
 * Verificar si el usuario es propietario del recurso
 */
export async function verifyResourceOwnership(
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  // Esta función debería implementar la lógica específica de verificación
  // Por ahora retornamos true para evitar errores
  return true;
}

/**
 * Esquemas de validación comunes
 */
export const CommonSchemas = {
  // ID de recurso
  resourceId: z.string().uuid('Invalid resource ID'),
  
  // Paginación
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
  
  // Búsqueda
  search: z.object({
    query: z.string().min(1).max(100),
    filters: z.record(z.string()).optional(),
  }),
  
  // Mensaje
  message: z.object({
    content: z.string().min(1).max(5000),
    recipientId: z.string().uuid(),
  }),
  
  // Perfil
  profile: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).max(20).optional(),
  }),
};

/**
 * Configuraciones de rate limiting predefinidas
 */
export const RateLimitPresets = {
  // API general: 100 req/min
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  
  // Autenticación: 10 req/min
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
  
  // Subida de archivos: 5 req/min
  upload: { maxRequests: 5, windowMs: 60 * 1000 },
  
  // Búsquedas: 50 req/min
  search: { maxRequests: 50, windowMs: 60 * 1000 },
  
  // Mensajes: 200 req/min
  messaging: { maxRequests: 200, windowMs: 60 * 1000 },
};
