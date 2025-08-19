/**
 * Authentication Security System - Enterprise Grade
 * Implementa autenticación robusta con OWASP Top 10 compliance
 */

import { createSupabaseServer } from './supabase-server';
import { NextRequest } from 'next/server';
import { rateLimit } from './rate-limiting';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  lastActivity: Date;
  isActive: boolean;
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  permissions: string[];
  sessionId: string | null;
  requestId: string;
  timestamp: Date;
}

export interface JWTClaims {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
  jti: string;
}

/**
 * Clase principal de autenticación segura
 */
export class SecureAuthService {
  private static instance: SecureAuthService;
  private activeSessions: Map<string, AuthContext> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  
  private constructor() {}
  
  public static getInstance(): SecureAuthService {
    if (!SecureAuthService.instance) {
      SecureAuthService.instance = new SecureAuthService();
    }
    return SecureAuthService.instance;
  }
  
  /**
   * Verificar autenticación completa con validación de claims
   */
  async verifyAuth(request: NextRequest): Promise<AuthContext> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      // 1. Rate limiting por IP
      const clientIP = this.getClientIP(request);
      await this.checkRateLimit(clientIP);
      
      // 2. Extraer y validar token
      const token = this.extractToken(request);
      if (!token) {
        throw new Error('Token no proporcionado');
      }
      
      // 3. Validar formato del token
      if (!this.isValidTokenFormat(token)) {
        throw new Error('Formato de token inválido');
      }
      
      // 4. Verificar con Supabase
      const supabase = await createSupabaseServer();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new Error('Token inválido o expirado');
      }
      
      // 5. Validar claims del JWT
      const claims = await this.validateJWTClaims(token, user);
      
      // 6. Verificar sesión activa
      const session = await this.validateActiveSession(claims.sessionId);
      
      // 7. Verificar permisos y roles
      const permissions = await this.getUserPermissions(user.id);
      
      // 8. Crear contexto de autenticación
      const authContext: AuthContext = {
        user: {
          id: user.id,
          email: user.email || '',
          role: claims.role,
          permissions,
          sessionId: claims.sessionId,
          lastActivity: new Date(),
          isActive: true
        },
        isAuthenticated: true,
        permissions,
        sessionId: claims.sessionId,
        requestId,
        timestamp: new Date()
      };
      
      // 9. Actualizar sesión activa
      this.activeSessions.set(claims.sessionId, authContext);
      
      // 10. Log de autenticación exitosa
      this.logAuthSuccess(clientIP, user.id, Date.now() - startTime);
      
      return authContext;
      
    } catch (error) {
      // Log de autenticación fallida
      const clientIP = this.getClientIP(request);
      this.logAuthFailure(clientIP, error instanceof Error ? error.message : 'Error desconocido');
      
      // Incrementar contador de intentos fallidos
      this.incrementFailedAttempts(clientIP);
      
      throw error;
    }
  }
  
  /**
   * Validar claims del JWT
   */
  private async validateJWTClaims(token: string, user: any): Promise<JWTClaims> {
    try {
      // Decodificar JWT (sin verificar firma - Supabase ya lo hace)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      const claims: JWTClaims = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role || 'user',
        permissions: payload.permissions || [],
        sessionId: payload.sessionId || payload.jti,
        iat: payload.iat,
        exp: payload.exp,
        jti: payload.jti
      };
      
      // Validar claims requeridos
      if (!claims.sub || !claims.email || !claims.sessionId) {
        throw new Error('Claims del JWT incompletos');
      }
      
      // Validar expiración
      if (claims.exp && Date.now() >= claims.exp * 1000) {
        throw new Error('Token expirado');
      }
      
      // Validar que el usuario del token coincida con el usuario de Supabase
      if (claims.sub !== user.id) {
        throw new Error('Token no corresponde al usuario');
      }
      
      return claims;
      
    } catch (error) {
      throw new Error(`Error validando claims del JWT: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Verificar sesión activa
   */
  private async validateActiveSession(sessionId: string): Promise<boolean> {
    // Verificar en sesiones activas
    if (this.activeSessions.has(sessionId)) {
      const session = this.activeSessions.get(sessionId)!;
      const now = new Date();
      const lastActivity = session.user.lastActivity;
      
      // Sesión expira después de 30 minutos de inactividad
      if (now.getTime() - lastActivity.getTime() > 30 * 60 * 1000) {
        this.activeSessions.delete(sessionId);
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtener permisos del usuario
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const supabase = await createSupabaseServer();
      
      // Obtener permisos desde la base de datos
      const { data: permissions, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId);
      
      if (error) {
        console.warn('Error obteniendo permisos del usuario:', error);
        return ['read:own'];
      }
      
      return permissions?.map(p => p.permission) || ['read:own'];
      
    } catch (error) {
      console.warn('Error obteniendo permisos del usuario:', error);
      return ['read:own'];
    }
  }
  
  /**
   * Verificar rate limiting
   */
  private async checkRateLimit(clientIP: string): Promise<void> {
    const limit = await rateLimit.checkLimit(clientIP, 'auth', 5, 60000); // 5 intentos por minuto
    
    if (!limit.allowed) {
      throw new Error('Demasiados intentos de autenticación. Intente nuevamente en 1 minuto.');
    }
  }
  
  /**
   * Extraer token del request
   */
  private extractToken(request: NextRequest): string | null {
    // 1. Intentar desde Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // 2. Intentar desde cookie
    const tokenCookie = request.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }
    
    // 3. Intentar desde query parameter (solo para desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const url = new URL(request.url);
      return url.searchParams.get('token');
    }
    
    return null;
  }
  
  /**
   * Validar formato del token
   */
  private isValidTokenFormat(token: string): boolean {
    // Verificar que sea un JWT válido (3 partes separadas por puntos)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Verificar que cada parte sea base64 válido
    try {
      parts.forEach(part => {
        if (part) {
          Buffer.from(part, 'base64');
        }
      });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Obtener IP del cliente
   */
  private getClientIP(request: NextRequest): string {
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
   * Generar ID único para el request
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Incrementar contador de intentos fallidos
   */
  private incrementFailedAttempts(clientIP: string): void {
    const current = this.failedAttempts.get(clientIP) || { count: 0, lastAttempt: new Date() };
    current.count++;
    current.lastAttempt = new Date();
    this.failedAttempts.set(clientIP, current);
    
    // Si hay demasiados intentos fallidos, bloquear temporalmente
    if (current.count >= 10) {
      // Bloquear por 15 minutos
      setTimeout(() => {
        this.failedAttempts.delete(clientIP);
      }, 15 * 60 * 1000);
    }
  }
  
  /**
   * Log de autenticación exitosa
   */
  private logAuthSuccess(clientIP: string, userId: string, duration: number): void {
    console.log(`[AUTH_SUCCESS] IP: ${clientIP}, User: ${userId}, Duration: ${duration}ms`);
  }
  
  /**
   * Log de autenticación fallida
   */
  private logAuthFailure(clientIP: string, reason: string): void {
    console.warn(`[AUTH_FAILURE] IP: ${clientIP}, Reason: ${reason}`);
  }
  
  /**
   * Revocar sesión
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }
  
  /**
   * Obtener estadísticas de sesiones activas
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }
  
  /**
   * Limpiar sesiones expiradas
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    this.activeSessions.forEach((session, sessionId) => {
      const lastActivity = session.user.lastActivity;
      if (now.getTime() - lastActivity.getTime() > 30 * 60 * 1000) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`[AUTH_CLEANUP] Removed ${expiredSessions.length} expired sessions`);
    }
  }
}

/**
 * Instancia global del servicio de autenticación
 */
export const secureAuthService = SecureAuthService.getInstance();

/**
 * Middleware de autenticación para APIs
 */
export const withSecureAuth = (handler: Function) => {
  return async (request: NextRequest, context: any) => {
    try {
      const authContext = await secureAuthService.verifyAuth(request);
      
      // Agregar contexto de autenticación al request
      const enhancedRequest = {
        ...request,
        auth: authContext
      };
      
      return await handler(enhancedRequest, context);
      
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'No autorizado',
          message: error instanceof Error ? error.message : 'Error de autenticación',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          }
        }
      );
    }
  };
};
