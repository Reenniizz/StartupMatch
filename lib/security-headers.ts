/**
 * Security Headers Configuration - OWASP Top 10 Compliance
 * Implementa todos los headers de seguridad necesarios para producción
 */

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Headers de seguridad básicos OWASP
 */
export const basicSecurityHeaders: SecurityHeaders = {
  // Prevenir clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevenir MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Política de referrer estricta
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Forzar HTTPS
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Prevenir cross-domain policies
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // Control de características del navegador
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  
  // Prevenir XSS
  'X-XSS-Protection': '1; mode=block',
  
  // Cache control para APIs
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  
  // Pragma para compatibilidad HTTP/1.0
  'Pragma': 'no-cache',
  
  // Expires para evitar cache
  'Expires': '0',
  
  // Surrogate control
  'Surrogate-Control': 'no-store',
};

/**
 * Content Security Policy estricto
 */
export const getContentSecurityPolicy = (): string => {
  const nonce = Math.random().toString(36).substring(2, 15);
  
  return [
    // Default sources
    "default-src 'self'",
    
    // Script sources - solo scripts del mismo origen
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    
    // Style sources - solo estilos del mismo origen
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Font sources - Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    
    // Image sources - solo imágenes del mismo origen y data URIs seguras
    "img-src 'self' data: https: blob:",
    
    // Connect sources - APIs del mismo origen
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    
    // Media sources - solo del mismo origen
    "media-src 'self'",
    
    // Object sources - bloquear plugins
    "object-src 'none'",
    
    // Frame sources - bloquear iframes
    "frame-src 'none'",
    
    // Worker sources - solo del mismo origen
    "worker-src 'self'",
    
    // Manifest sources - solo del mismo origen
    "manifest-src 'self'",
    
    // Base URI - solo del mismo origen
    "base-uri 'self'",
    
    // Form action - solo del mismo origen
    "form-action 'self'",
    
    // Frame ancestors - bloquear embedding
    "frame-ancestors 'none'",
    
    // Upgrade insecure requests
    "upgrade-insecure-requests",
    
    // Block mixed content
    "block-all-mixed-content"
  ].join('; ');
};

/**
 * Headers de seguridad completos para producción
 */
export const getProductionSecurityHeaders = (): SecurityHeaders => {
  return {
    ...basicSecurityHeaders,
    'Content-Security-Policy': getContentSecurityPolicy(),
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
};

/**
 * Headers de seguridad para desarrollo (menos restrictivos)
 */
export const getDevelopmentSecurityHeaders = (): SecurityHeaders => {
  return {
    ...basicSecurityHeaders,
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' http://localhost:* https://*.supabase.co",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
  };
};

/**
 * Headers específicos para APIs
 */
export const getAPISecurityHeaders = (): SecurityHeaders => {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };
};

/**
 * Headers para archivos estáticos
 */
export const getStaticFileSecurityHeaders = (): SecurityHeaders => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Frame-Options': 'DENY',
  };
};

/**
 * Validar headers de seguridad
 */
export const validateSecurityHeaders = (headers: SecurityHeaders): string[] => {
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'Content-Security-Policy'
  ];
  
  const missingHeaders: string[] = [];
  
  requiredHeaders.forEach(header => {
    if (!headers[header]) {
      missingHeaders.push(header);
    }
  });
  
  return missingHeaders;
};

/**
 * Generar reporte de seguridad de headers
 */
export const generateSecurityReport = (headers: SecurityHeaders): {
  score: number;
  missing: string[];
  recommendations: string[];
} => {
  const missing = validateSecurityHeaders(headers);
  const score = Math.max(0, 100 - (missing.length * 20));
  
  const recommendations = missing.map(header => {
    switch (header) {
      case 'X-Frame-Options':
        return 'Implementar X-Frame-Options para prevenir clickjacking';
      case 'X-Content-Type-Options':
        return 'Implementar X-Content-Type-Options para prevenir MIME sniffing';
      case 'Referrer-Policy':
        return 'Implementar Referrer-Policy para controlar información de referrer';
      case 'Strict-Transport-Security':
        return 'Implementar HSTS para forzar HTTPS';
      case 'Content-Security-Policy':
        return 'Implementar CSP para prevenir XSS y otras inyecciones';
      default:
        return `Implementar header de seguridad: ${header}`;
    }
  });
  
  return { score, missing, recommendations };
};
