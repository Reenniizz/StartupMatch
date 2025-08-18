import { NextRequest, NextResponse } from 'next/server';

// Middleware simplificado sin Supabase para mejor compatibilidad con Edge Runtime
export async function middleware(request: NextRequest) {
  console.log(`📝 Handling request: ${request.method} ${request.nextUrl.pathname}`);
  
  // Handle missing chunk files gracefully
  if (request.nextUrl.pathname.includes('/_next/static/chunks/') && 
      request.nextUrl.pathname.includes('_app-pages-browser_lib_supabase-client_ts.js')) {
    console.log('🔧 Interceptando chunk faltante de supabase-client, devolviendo vacío');
    return new NextResponse('', {
      status: 404,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  const response = NextResponse.next();
  
  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' *.supabase.co wss://cbaxjoozbnffrryuywno.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Rate Limiting (basic implementation)
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const rateLimit = await checkRateLimit(ip);
  
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  // Nota: La autenticación se maneja ahora en componentes individuales
  // usando ProtectedRoute o useAuth en lugar del middleware para mejor rendimiento
  
  return response;
}

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map();

async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }
  
  const limit = rateLimitMap.get(identifier);
  
  if (now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }
  
  if (limit.count >= maxRequests) {
    return { success: false };
  }
  
  limit.count++;
  return { success: true };
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/_next/static/chunks/:path*', // Include chunk handling for missing files
  ],
};
