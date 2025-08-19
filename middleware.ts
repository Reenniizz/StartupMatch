import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProductionSecurityHeaders, getDevelopmentSecurityHeaders } from './lib/security-headers';
import { securityMonitoring, logSecurityEvent } from './lib/security-monitoring';
import { rateLimit } from './lib/rate-limiting';

// Configurar rate limiting para diferentes tipos de endpoints
const configureRateLimiting = () => {
  // Endpoints de autenticación - muy restrictivo
  rateLimit.configureEndpoint('auth', {
    maxRequests: 5,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });

  // APIs públicas - moderadamente restrictivo
  rateLimit.configureEndpoint('public_api', {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });

  // APIs privadas - menos restrictivo
  rateLimit.configureEndpoint('private_api', {
    maxRequests: 1000,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });

  // Uploads - restrictivo por tamaño
  rateLimit.configureEndpoint('upload', {
    maxRequests: 10,
    windowMs: 300000, // 5 minutos
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });
};

// Configurar rate limiting al inicializar
configureRateLimiting();

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  try {
    // 1. Obtener headers de seguridad según el entorno
    const securityHeaders = process.env.NODE_ENV === 'production' 
      ? getProductionSecurityHeaders() 
      : getDevelopmentSecurityHeaders();
    
    // 2. Aplicar rate limiting según el tipo de endpoint
    const endpoint = getEndpointType(request.nextUrl.pathname);
    const rateLimitResult = await applyRateLimiting(request, endpoint);
    
    if (!rateLimitResult.allowed) {
      // Log del evento de rate limiting
      logSecurityEvent('rate_limit', 'medium', 'middleware', {
        endpoint: request.nextUrl.pathname,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        reason: 'Rate limit exceeded'
      }, {
        ipAddress: getClientIP(request),
        requestId
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
          retryAfter: rateLimitResult.retryAfter,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            ...securityHeaders
          }
        }
      );
    }
    
    // 3. Detectar amenazas potenciales
    const threats = detectSecurityThreats(request);
    if (threats.length > 0) {
      // Log de amenazas detectadas
      threats.forEach(threat => {
        logSecurityEvent(threat.type, threat.severity, 'middleware', {
          endpoint: request.nextUrl.pathname,
          ip: getClientIP(request),
          userAgent: request.headers.get('user-agent'),
          threat: threat.description,
          pattern: threat.pattern
        }, {
          ipAddress: getClientIP(request),
          requestId
        });
      });
      
      // Si hay amenazas críticas, bloquear el request
      if (threats.some(t => t.severity === 'critical')) {
        return new NextResponse(
          JSON.stringify({
            error: 'Security threat detected',
            message: 'Se detectó una amenaza de seguridad. El request ha sido bloqueado.',
            timestamp: new Date().toISOString()
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders
            }
          }
        );
      }
    }
    
    // 4. Crear respuesta con headers de seguridad
    const response = NextResponse.next();
    
    // Aplicar headers de seguridad
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Agregar headers de rate limiting
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit?.toString() || '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    
    // Agregar headers de seguridad adicionales
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // 5. Log de request exitoso
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Log requests lentos
      logSecurityEvent('system', 'low', 'middleware', {
        endpoint: request.nextUrl.pathname,
        duration,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent')
      }, {
        ipAddress: getClientIP(request),
        requestId
      });
    }
    
    return response;
    
  } catch (error) {
    // Log de error en middleware
    logSecurityEvent('system', 'high', 'middleware', {
      endpoint: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Error desconocido',
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent')
    }, {
      ipAddress: getClientIP(request),
      requestId
    });
    
    // Retornar error 500 con headers de seguridad
    const securityHeaders = process.env.NODE_ENV === 'production' 
      ? getProductionSecurityHeaders() 
      : getDevelopmentSecurityHeaders();
    
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      }
    );
  }
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

/**
 * Determinar el tipo de endpoint para rate limiting
 */
function getEndpointType(pathname: string): string {
  // Autenticación
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth')) {
    return 'auth';
  }
  
  // APIs públicas
  if (pathname.startsWith('/api/public') || pathname.startsWith('/api/explore')) {
    return 'public_api';
  }
  
  // APIs privadas
  if (pathname.startsWith('/api/')) {
    return 'private_api';
  }
  
  // Uploads
  if (pathname.includes('/upload') || pathname.includes('/files')) {
    return 'upload';
  }
  
  // Por defecto, tratar como API pública
  return 'public_api';
}

/**
 * Aplicar rate limiting
 */
async function applyRateLimiting(request: NextRequest, endpoint: string) {
  try {
    const identifier = getClientIP(request);
    const result = await rateLimit.checkLimit(identifier, endpoint, 100, 60000);
    
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
      retryAfter: result.retryAfter,
      limit: 100
    };
  } catch (error) {
    // En caso de error, permitir el request
    console.warn('Rate limiting error:', error);
    return {
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
      limit: 100
    };
  }
}

/**
 * Detectar amenazas de seguridad
 */
function detectSecurityThreats(request: NextRequest): Array<{
  type: 'xss' | 'injection' | 'malware' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  pattern: string;
}> {
  const threats: Array<{
    type: 'xss' | 'injection' | 'malware' | 'anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    pattern: string;
  }> = [];
  
  const url = request.nextUrl.toString();
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detectar patrones XSS en URL
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /expression\s*\(/i
  ];
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(url)) {
      threats.push({
        type: 'xss',
        severity: 'high',
        description: 'Patrón XSS detectado en URL',
        pattern: pattern.toString()
      });
    }
  });
  
  // Detectar patrones de inyección SQL
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /xp_cmdshell/i
  ];
  
  sqlPatterns.forEach(pattern => {
    if (pattern.test(url)) {
      threats.push({
        type: 'injection',
        severity: 'critical',
        description: 'Patrón de inyección SQL detectado',
        pattern: pattern.toString()
      });
    }
  });
  
  // Detectar User-Agents maliciosos
  const maliciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /w3af/i,
    /burp/i,
    /zap/i,
    /scanner/i,
    /bot/i,
    /crawler/i
  ];
  
  maliciousUserAgents.forEach(pattern => {
    if (pattern.test(userAgent)) {
      threats.push({
        type: 'malware',
        severity: 'medium',
        description: 'User-Agent potencialmente malicioso detectado',
        pattern: pattern.toString()
      });
    }
  });
  
  // Detectar requests anómalos
  const pathname = request.nextUrl.pathname;
  
  // URLs muy largas pueden ser ataques
  if (url.length > 2048) {
    threats.push({
      type: 'anomaly',
      severity: 'medium',
      description: 'URL extremadamente larga detectada',
      pattern: 'url_length_exceeded'
    });
  }
  
  // Múltiples parámetros pueden ser sospechosos
  const queryParams = request.nextUrl.searchParams;
  if (queryParams.size > 20) {
    threats.push({
      type: 'anomaly',
      severity: 'low',
      description: 'Demasiados parámetros de query',
      pattern: 'excessive_query_params'
    });
  }
  
  // Headers sospechosos
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-forwarded-proto',
    'x-forwarded-host'
  ];
  
  suspiciousHeaders.forEach(header => {
    if (request.headers.get(header)) {
      threats.push({
        type: 'anomaly',
        severity: 'low',
        description: `Header sospechoso detectado: ${header}`,
        pattern: `suspicious_header_${header}`
      });
    }
  });
  
  return threats;
}

/**
 * Obtener IP real del cliente
 */
function getClientIP(request: NextRequest): string {
  // Intentar obtener IP real considerando proxies
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback a IP local para desarrollo
  return '127.0.0.1';
}
