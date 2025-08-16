/**
 * Secure Authentication Utilities
 * Sistema de autenticación robusto y seguro
 */

import { createServerClient } from '@supabase/ssr';
import { createBrowserClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { secureLog } from './input-validation';

// ===========================================
// TIPOS Y INTERFACES
// ===========================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: AuthError | null;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  user: AuthenticatedUser | null;
  reason?: string;
}

// ===========================================
// CONFIGURACIÓN SEGURA DE SUPABASE
// ===========================================

/**
 * Cliente Supabase para server-side con configuración segura
 */
export function createSecureServerClient(request?: NextRequest, response?: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        if (request) {
          return request.cookies.get(name)?.value;
        }
        // Fallback para cuando no hay request (ej: en API routes)
        return undefined;
      },
      set(name: string, value: string, options: any) {
        if (response) {
          response.cookies.set({ name, value, ...options });
        }
      },
      remove(name: string, options: any) {
        if (response) {
          response.cookies.set({ name, value: '', ...options });
        }
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Prevenir CSRF en URLs
    }
  });
}

/**
 * Cliente Supabase para client-side con configuración segura
 */
export function createSecureBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Más seguro que implicit flow
    },
    global: {
      headers: {
        'X-Client-Info': 'startupmatch-web',
      },
    },
  });
}

// ===========================================
// FUNCIONES DE AUTENTICACIÓN SEGURA
// ===========================================

/**
 * Obtener usuario autenticado de forma segura (SERVER-SIDE)
 * Esta es la función SEGURA que debe usarse en API routes y middleware
 */
export async function getAuthenticatedUser(request?: NextRequest, response?: NextResponse): Promise<AuthResult> {
  try {
    const supabase = createSecureServerClient(request, response);
    
    // ✅ SEGURO: Usar getUser() en lugar de getSession()
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      secureLog('warn', 'Authentication validation failed', { 
        error: error.message,
        code: error.name
      });
      
      return { 
        user: null, 
        error: { 
          message: 'Authentication failed', 
          status: 401,
          code: error.name
        } 
      };
    }

    if (!user) {
      return { 
        user: null, 
        error: { 
          message: 'No authenticated user found', 
          status: 401 
        } 
      };
    }

    // Validaciones adicionales de seguridad
    const validationResult = validateUserSession(user);
    if (!validationResult.isValid) {
      secureLog('warn', 'User session validation failed', { 
        userId: user.id,
        reason: validationResult.reason
      });
      
      return { 
        user: null, 
        error: { 
          message: validationResult.reason || 'Invalid session', 
          status: 401 
        } 
      };
    }

    secureLog('info', 'User authenticated successfully', { 
      userId: user.id,
      email: user.email?.replace(/(.{3}).+(@.+)/, '$1***$2') // Ofuscar email en logs
    });

    return { user: user as AuthenticatedUser, error: null };
  } catch (error) {
    secureLog('error', 'Authentication error', error);
    
    return { 
      user: null, 
      error: { 
        message: 'Internal authentication error', 
        status: 500 
      } 
    };
  }
}

/**
 * Obtener usuario autenticado (CLIENT-SIDE)
 * Solo para uso en componentes React
 */
export async function getAuthenticatedUserClient(): Promise<AuthResult> {
  try {
    const supabase = createSecureBrowserClient();
    
    // ✅ SEGURO: Usar getUser() para validar contra el servidor
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { 
        user: null, 
        error: { 
          message: error?.message || 'No authenticated user', 
          status: 401 
        } 
      };
    }

    const validationResult = validateUserSession(user);
    if (!validationResult.isValid) {
      return { 
        user: null, 
        error: { 
          message: validationResult.reason || 'Invalid session', 
          status: 401 
        } 
      };
    }

    return { user: user as AuthenticatedUser, error: null };
  } catch (error) {
    secureLog('error', 'Client authentication error', error);
    
    return { 
      user: null, 
      error: { 
        message: 'Authentication error', 
        status: 500 
      } 
    };
  }
}

/**
 * Middleware helper para rutas protegidas
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authResult = await getAuthenticatedUser(request);
  
  if (!authResult.user) {
    secureLog('warn', 'Unauthorized access attempt', {
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });

    return NextResponse.json(
      { 
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }

  return authResult;
}

/**
 * Verificar permisos de usuario
 */
export function checkUserPermissions(user: AuthenticatedUser, requiredRole?: string): boolean {
  if (!user) return false;

  // Verificar si el usuario está confirmado
  if (!user.email_confirmed_at) {
    secureLog('warn', 'Unconfirmed user attempted access', { userId: user.id });
    return false;
  }

  // Verificar rol si es requerido
  if (requiredRole) {
    const userRole = user.app_metadata?.role || user.user_metadata?.role || 'user';
    if (userRole !== requiredRole && userRole !== 'admin') {
      secureLog('warn', 'Insufficient permissions', { 
        userId: user.id, 
        requiredRole, 
        userRole 
      });
      return false;
    }
  }

  return true;
}

// ===========================================
// VALIDACIONES DE SESIÓN
// ===========================================

/**
 * Validar sesión de usuario
 */
function validateUserSession(user: any): SessionValidationResult {
  if (!user) {
    return { isValid: false, user: null, reason: 'No user provided' };
  }

  // Verificar que el usuario tenga ID válido
  if (!user.id || typeof user.id !== 'string') {
    return { isValid: false, user: null, reason: 'Invalid user ID' };
  }

  // Verificar que el email esté presente
  if (!user.email) {
    return { isValid: false, user: null, reason: 'No email found' };
  }

  // Verificar que la cuenta no esté suspendida
  if (user.app_metadata?.suspended) {
    return { isValid: false, user: null, reason: 'Account suspended' };
  }

  // Verificar timestamp de creación para detectar tokens manipulados
  if (user.created_at) {
    const createdAt = new Date(user.created_at);
    if (createdAt > new Date()) {
      return { isValid: false, user: null, reason: 'Invalid creation date' };
    }
  }

  return { isValid: true, user: user as AuthenticatedUser };
}

// ===========================================
// HELPERS DE SEGURIDAD
// ===========================================

/**
 * Limpiar sesión de usuario de forma segura
 */
export async function secureSignOut(): Promise<void> {
  try {
    const supabase = createSecureBrowserClient();
    
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpiar sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
    
    secureLog('info', 'User signed out successfully');
  } catch (error) {
    secureLog('error', 'Error during sign out', error);
  }
}

/**
 * Verificar si el usuario está autenticado (client-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const result = await getAuthenticatedUserClient();
  return !!result.user;
}

/**
 * Obtener token de sesión de forma segura
 */
export async function getSecureSessionToken(): Promise<string | null> {
  try {
    const supabase = createSecureBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Solo devolver token si también validamos el usuario
    if (session?.access_token) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return session.access_token;
      }
    }
    
    return null;
  } catch (error) {
    secureLog('error', 'Error getting session token', error);
    return null;
  }
}

/**
 * Refrescar token de autenticación
 */
export async function refreshAuthToken(): Promise<boolean> {
  try {
    const supabase = createSecureBrowserClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      secureLog('warn', 'Token refresh failed', { error: error?.message });
      return false;
    }
    
    secureLog('info', 'Token refreshed successfully');
    return true;
  } catch (error) {
    secureLog('error', 'Error refreshing token', error);
    return false;
  }
}

// ===========================================
// RATE LIMITING ESPECÍFICO PARA AUTH
// ===========================================

const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

/**
 * Rate limiting para intentos de autenticación
 */
export function checkAuthRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const current = authAttempts.get(identifier);
  
  if (!current) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Limpiar si ha pasado la ventana de tiempo
  if (now - current.lastAttempt > windowMs) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  if (current.count >= maxAttempts) {
    const waitTime = windowMs - (now - current.lastAttempt);
    return { allowed: false, waitTime };
  }
  
  current.count++;
  current.lastAttempt = now;
  return { allowed: true };
}

/**
 * Registrar intento de autenticación fallido
 */
export function recordFailedAuthAttempt(identifier: string, reason: string): void {
  secureLog('warn', 'Failed authentication attempt', {
    identifier: identifier.replace(/(.{3}).+/, '$1***'), // Ofuscar identificador
    reason,
    timestamp: new Date().toISOString()
  });
}

// ===========================================
// EXPORTAR CLIENTE POR DEFECTO (LEGACY SUPPORT)
// ===========================================

export const supabase = createSecureBrowserClient();
