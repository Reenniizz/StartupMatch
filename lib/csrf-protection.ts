/**
 * CSRF Protection System - OWASP Top 10 Compliance
 * Implementa protección completa contra Cross-Site Request Forgery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from './supabase-server';
import crypto from 'crypto';

export interface CSRFToken {
  token: string;
  sessionId: string;
  expiresAt: Date;
  used: boolean;
}

export interface CSRFValidationResult {
  isValid: boolean;
  reason?: string;
  token?: string;
}

/**
 * Clase principal de protección CSRF
 */
export class CSRFProtectionService {
  private static instance: CSRFProtectionService;
  private tokens: Map<string, CSRFToken> = new Map();
  private sessionTokens: Map<string, string[]> = new Map();
  
  private constructor() {
    // Limpiar tokens expirados cada 5 minutos
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }
  
  public static getInstance(): CSRFProtectionService {
    if (!CSRFProtectionService.instance) {
      CSRFProtectionService.instance = new CSRFProtectionService();
    }
    return CSRFProtectionService.instance;
  }
  
  /**
   * Generar token CSRF único
   */
  generateToken(sessionId: string): string {
    // Generar token criptográficamente seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    
    const csrfToken: CSRFToken = {
      token,
      sessionId,
      expiresAt,
      used: false
    };
    
    // Almacenar token
    this.tokens.set(token, csrfToken);
    
    // Asociar token con sesión
    if (!this.sessionTokens.has(sessionId)) {
      this.sessionTokens.set(sessionId, []);
    }
    this.sessionTokens.get(sessionId)!.push(token);
    
    // Limitar tokens por sesión (máximo 5)
    const sessionTokens = this.sessionTokens.get(sessionId)!;
    if (sessionTokens.length > 5) {
      const oldToken = sessionTokens.shift()!;
      this.tokens.delete(oldToken);
    }
    
    return token;
  }
  
  /**
   * Validar token CSRF
   */
  validateToken(token: string, sessionId: string): CSRFValidationResult {
    const csrfToken = this.tokens.get(token);
    
    if (!csrfToken) {
      return {
        isValid: false,
        reason: 'Token CSRF no encontrado'
      };
    }
    
    if (csrfToken.sessionId !== sessionId) {
      return {
        isValid: false,
        reason: 'Token CSRF no corresponde a la sesión'
      };
    }
    
    if (csrfToken.expiresAt < new Date()) {
      // Eliminar token expirado
      this.tokens.delete(token);
      this.removeTokenFromSession(sessionId, token);
      
      return {
        isValid: false,
        reason: 'Token CSRF expirado'
      };
    }
    
    if (csrfToken.used) {
      return {
        isValid: false,
        reason: 'Token CSRF ya utilizado'
      };
    }
    
    // Marcar token como usado
    csrfToken.used = true;
    
    return {
      isValid: true,
      token
    };
  }
  
  /**
   * Validar token desde request
   */
  async validateRequest(request: NextRequest, sessionId: string): Promise<CSRFValidationResult> {
    try {
      // Obtener token desde diferentes fuentes
      const token = this.extractCSRFToken(request);
      
      if (!token) {
        return {
          isValid: false,
          reason: 'Token CSRF no proporcionado'
        };
      }
      
      return this.validateToken(token, sessionId);
      
    } catch (error) {
      return {
        isValid: false,
        reason: `Error validando token CSRF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
  
  /**
   * Extraer token CSRF del request
   */
  private extractCSRFToken(request: NextRequest): string | null {
    // 1. Intentar desde header personalizado
    const csrfHeader = request.headers.get('x-csrf-token');
    if (csrfHeader) {
      return csrfHeader;
    }
    
    // 2. Intentar desde header estándar
    const standardHeader = request.headers.get('x-xsrf-token');
    if (standardHeader) {
      return standardHeader;
    }
    
    // 3. Intentar desde cookie
    const csrfCookie = request.cookies.get('csrf-token');
    if (csrfCookie) {
      return csrfCookie.value;
    }
    
    // 4. Intentar desde body (para POST/PUT/PATCH)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // Para requests con body, el token debe venir en header o cookie
      // No se puede leer body aquí sin consumir el stream
      return null;
    }
    
    return null;
  }
  
  /**
   * Remover token de sesión
   */
  private removeTokenFromSession(sessionId: string, token: string): void {
    const sessionTokens = this.sessionTokens.get(sessionId);
    if (sessionTokens) {
      const index = sessionTokens.indexOf(token);
      if (index > -1) {
        sessionTokens.splice(index, 1);
      }
      
      // Si no quedan tokens, eliminar sesión
      if (sessionTokens.length === 0) {
        this.sessionTokens.delete(sessionId);
      }
    }
  }
  
  /**
   * Limpiar tokens expirados
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    const expiredTokens: string[] = [];
    
    this.tokens.forEach((token, tokenString) => {
      if (token.expiresAt < now) {
        expiredTokens.push(tokenString);
      }
    });
    
    expiredTokens.forEach(token => {
      const csrfToken = this.tokens.get(token);
      if (csrfToken) {
        this.removeTokenFromSession(csrfToken.sessionId, token);
        this.tokens.delete(token);
      }
    });
    
    if (expiredTokens.length > 0) {
      console.log(`[CSRF_CLEANUP] Removed ${expiredTokens.length} expired tokens`);
    }
  }
  
  /**
   * Revocar todos los tokens de una sesión
   */
  revokeSessionTokens(sessionId: string): void {
    const sessionTokens = this.sessionTokens.get(sessionId);
    if (sessionTokens) {
      sessionTokens.forEach(token => {
        this.tokens.delete(token);
      });
      this.sessionTokens.delete(sessionId);
    }
  }
  
  /**
   * Obtener estadísticas de tokens
   */
  getTokenStats(): {
    totalTokens: number;
    activeSessions: number;
    expiredTokens: number;
  } {
    const now = new Date();
    let expiredCount = 0;
    
    this.tokens.forEach(token => {
      if (token.expiresAt < now) {
        expiredCount++;
      }
    });
    
    return {
      totalTokens: this.tokens.size,
      activeSessions: this.sessionTokens.size,
      expiredTokens: expiredCount
    };
  }
  
  /**
   * Verificar si una sesión tiene tokens válidos
   */
  hasValidTokens(sessionId: string): boolean {
    const sessionTokens = this.sessionTokens.get(sessionId);
    if (!sessionTokens) {
      return false;
    }
    
    const now = new Date();
    return sessionTokens.some(token => {
      const csrfToken = this.tokens.get(token);
      return csrfToken && csrfToken.expiresAt > now && !csrfToken.used;
    });
  }
}

/**
 * Instancia global del servicio de protección CSRF
 */
export const csrfProtectionService = CSRFProtectionService.getInstance();

/**
 * Middleware de protección CSRF para APIs
 */
export const withCSRFProtection = (handler: Function) => {
  return async (request: NextRequest, context: any) => {
    try {
      // Solo aplicar CSRF protection a métodos que modifican datos
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        return await handler(request, context);
      }
      
      // Obtener sessionId del contexto de autenticación
      const sessionId = context?.auth?.sessionId || 
                       request.cookies.get('session-id')?.value ||
                       request.headers.get('x-session-id');
      
      if (!sessionId) {
        return new Response(
          JSON.stringify({ 
            error: 'Sesión no válida',
            message: 'Se requiere sesión válida para esta operación',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Validar token CSRF
      const validation = await csrfProtectionService.validateRequest(request, sessionId);
      
      if (!validation.isValid) {
        return new Response(
          JSON.stringify({ 
            error: 'Token CSRF inválido',
            message: validation.reason || 'Token CSRF no válido',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Continuar con el handler
      return await handler(request, context);
      
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Error de validación CSRF',
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

/**
 * Helper para generar token CSRF en el frontend
 */
export const generateCSRFToken = async (): Promise<string> => {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Error generando token CSRF');
    }
    
    const data = await response.json();
    return data.token;
    
  } catch (error) {
    console.error('Error generando token CSRF:', error);
    throw error;
  }
};

/**
 * Helper para incluir token CSRF en requests
 */
export const includeCSRFToken = (headers: Headers, token: string): void => {
  headers.set('x-csrf-token', token);
};

/**
 * Helper para validar token CSRF en el frontend
 */
export const validateCSRFToken = (token: string): boolean => {
  // Validación básica en el frontend
  return token && token.length === 64 && /^[a-f0-9]+$/i.test(token);
};
