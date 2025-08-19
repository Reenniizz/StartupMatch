/**
 * Rate Limiting System - OWASP Top 10 Compliance
 * Implementa rate limiting robusto para prevenir ataques de fuerza bruta y DDoS
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
  handler?: (result: RateLimitResult) => Response;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockExpiry?: number;
}

/**
 * Estrategias de rate limiting
 */
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket'
}

/**
 * Clase principal de rate limiting
 */
export class RateLimitService {
  private static instance: RateLimitService;
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW;
  
  private constructor() {
    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }
  
  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }
  
  /**
   * Configurar rate limiting para un endpoint
   */
  configureEndpoint(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      keyGenerator: config.keyGenerator ?? ((identifier: string) => identifier),
      handler: config.handler
    });
  }
  
  /**
   * Verificar rate limit
   */
  async checkLimit(identifier: string, endpoint: string, maxRequests: number = 100, windowMs: number = 60000): Promise<RateLimitResult> {
    const config = this.configs.get(endpoint);
    const key = config?.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const limitKey = `${endpoint}:${key}`;
    
    const now = Date.now();
    const entry = this.limits.get(limitKey);
    
    // Si no hay entrada, crear una nueva
    if (!entry) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      };
      
      this.limits.set(limitKey, newEntry);
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }
    
    // Verificar si está bloqueado
    if (entry.blocked && entry.blockExpiry && now < entry.blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockExpiry,
        retryAfter: Math.ceil((entry.blockExpiry - now) / 1000)
      };
    }
    
    // Si el bloqueo expiró, resetear
    if (entry.blocked && entry.blockExpiry && now >= entry.blockExpiry) {
      entry.blocked = false;
      entry.blockExpiry = undefined;
    }
    
    // Verificar si la ventana de tiempo ha expirado
    if (now >= entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      entry.blocked = false;
      entry.blockExpiry = undefined;
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: entry.resetTime
      };
    }
    
    // Verificar si se ha excedido el límite
    if (entry.count >= maxRequests) {
      // Bloquear temporalmente (5 minutos)
      entry.blocked = true;
      entry.blockExpiry = now + 5 * 60 * 1000;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockExpiry,
        retryAfter: 300 // 5 minutos
      };
    }
    
    // Incrementar contador
    entry.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
  
  /**
   * Verificar rate limit con configuración del endpoint
   */
  async checkEndpointLimit(identifier: string, endpoint: string): Promise<RateLimitResult> {
    const config = this.configs.get(endpoint);
    
    if (!config) {
      // Configuración por defecto si no está configurado
      return this.checkLimit(identifier, endpoint, 100, 60000);
    }
    
    return this.checkLimit(identifier, endpoint, config.maxRequests, config.windowMs);
  }
  
  /**
   * Aplicar rate limiting a un request
   */
  async applyRateLimit(request: Request, endpoint: string): Promise<RateLimitResult> {
    const identifier = this.extractIdentifier(request);
    return this.checkEndpointLimit(identifier, endpoint);
  }
  
  /**
   * Extraer identificador del request
   */
  private extractIdentifier(request: Request): string {
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
  
  /**
   * Limpiar entradas expiradas
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.limits.forEach((entry, key) => {
      if (now >= entry.resetTime && !entry.blocked) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.limits.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      console.log(`[RATE_LIMIT_CLEANUP] Removed ${expiredKeys.length} expired entries`);
    }
  }
  
  /**
   * Obtener estadísticas de rate limiting
   */
  getStats(): {
    totalEndpoints: number;
    totalEntries: number;
    blockedEntries: number;
    activeEntries: number;
  } {
    let blockedCount = 0;
    let activeCount = 0;
    
    this.limits.forEach(entry => {
      if (entry.blocked) {
        blockedCount++;
      } else {
        activeCount++;
      }
    });
    
    return {
      totalEndpoints: this.configs.size,
      totalEntries: this.limits.size,
      blockedEntries: blockedCount,
      activeEntries: activeCount
    };
  }
  
  /**
   * Resetear rate limit para un identificador
   */
  resetLimit(identifier: string, endpoint: string): boolean {
    const config = this.configs.get(endpoint);
    const key = config?.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const limitKey = `${endpoint}:${key}`;
    
    return this.limits.delete(limitKey);
  }
  
  /**
   * Obtener información de rate limit para un identificador
   */
  getLimitInfo(identifier: string, endpoint: string): RateLimitEntry | null {
    const config = this.configs.get(endpoint);
    const key = config?.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const limitKey = `${endpoint}:${key}`;
    
    return this.limits.get(limitKey) || null;
  }
  
  /**
   * Configurar estrategia de rate limiting
   */
  setStrategy(strategy: RateLimitStrategy): void {
    this.strategy = strategy;
  }
  
  /**
   * Obtener estrategia actual
   */
  getStrategy(): RateLimitStrategy {
    return this.strategy;
  }
}

/**
 * Instancia global del servicio de rate limiting
 */
export const rateLimit = RateLimitService.getInstance();

/**
 * Configuraciones predefinidas para diferentes tipos de endpoints
 */
export const RATE_LIMIT_PRESETS = {
  // Autenticación - muy restrictivo
  AUTH: {
    maxRequests: 5,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // APIs públicas - moderadamente restrictivo
  PUBLIC_API: {
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // APIs privadas - menos restrictivo
  PRIVATE_API: {
    maxRequests: 1000,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Uploads - restrictivo por tamaño
  UPLOAD: {
    maxRequests: 10,
    windowMs: 300000, // 5 minutos
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Búsquedas - moderadamente restrictivo
  SEARCH: {
    maxRequests: 50,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Webhooks - muy restrictivo
  WEBHOOK: {
    maxRequests: 10,
    windowMs: 60000, // 1 minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

/**
 * Configurar endpoints con presets
 */
export function configureRateLimitPresets(): void {
  Object.entries(RATE_LIMIT_PRESETS).forEach(([preset, config]) => {
    rateLimit.configureEndpoint(preset.toLowerCase(), config);
  });
}

/**
 * Middleware de rate limiting para APIs
 */
export const withRateLimit = (endpoint: string, preset: keyof typeof RATE_LIMIT_PRESETS = 'PUBLIC_API') => {
  return (handler: Function) => {
    return async (request: Request, context: any) => {
      try {
        // Aplicar rate limiting
        const limitResult = await rateLimit.applyRateLimit(request, endpoint);
        
        if (!limitResult.allowed) {
          const config = RATE_LIMIT_PRESETS[preset];
          
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
              retryAfter: limitResult.retryAfter,
              resetTime: new Date(limitResult.resetTime).toISOString()
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': limitResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString(),
                'Retry-After': limitResult.retryAfter?.toString() || '60'
              }
            }
          );
        }
        
        // Agregar headers de rate limit a la respuesta
        const response = await handler(request, context);
        
        if (response instanceof Response) {
          const config = RATE_LIMIT_PRESETS[preset];
          response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
          response.headers.set('X-RateLimit-Reset', new Date(limitResult.resetTime).toISOString());
        }
        
        return response;
        
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit error',
            message: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toISOString()
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    };
  };
};

/**
 * Helper para generar identificadores únicos
 */
export const generateRateLimitKey = (base: string, ...parts: string[]): string => {
  return `${base}:${parts.join(':')}`;
};

/**
 * Helper para validar configuración de rate limit
 */
export const validateRateLimitConfig = (config: RateLimitConfig): string[] => {
  const errors: string[] = [];
  
  if (config.maxRequests <= 0) {
    errors.push('maxRequests debe ser mayor que 0');
  }
  
  if (config.windowMs <= 0) {
    errors.push('windowMs debe ser mayor que 0');
  }
  
  if (config.windowMs < 1000) {
    errors.push('windowMs debe ser al menos 1000ms (1 segundo)');
  }
  
  return errors;
};
