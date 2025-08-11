/**
 * Security utilities for input sanitization and validation
 */

import { z } from 'zod';

// XSS Protection
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQL Injection Protection
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

// Password Security Validation
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede tener más de 128 caracteres')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Debe contener al menos una letra mayúscula',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Debe contener al menos una letra minúscula',
  })
  .refine((password) => /\d/.test(password), {
    message: 'Debe contener al menos un número',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: 'Debe contener al menos un carácter especial',
  });

// Email Validation
export const emailSchema = z.string()
  .email('Email inválido')
  .max(254, 'Email demasiado largo')
  .refine((email) => !email.includes('..'), {
    message: 'Email no puede contener puntos consecutivos',
  });

// Username Validation
export const usernameSchema = z.string()
  .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
  .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
  .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guión bajo')
  .refine((username) => !username.startsWith('_'), {
    message: 'No puede empezar con guión bajo',
  })
  .refine((username) => !username.endsWith('_'), {
    message: 'No puede terminar con guión bajo',
  });

// General text validation (for names, descriptions, etc.)
export const textSchema = z.string()
  .trim()
  .min(1, 'Este campo es requerido')
  .max(1000, 'Texto demasiado largo')
  .refine((text) => !/[<>]/.test(text), {
    message: 'No se permiten caracteres HTML',
  });

// Name validation  
export const nameSchema = z.string()
  .trim()
  .min(1, 'Este campo es requerido')
  .max(50, 'Nombre demasiado largo')
  .refine((text) => !/[<>]/.test(text), {
    message: 'No se permiten caracteres HTML',
  });

// Rate limiting helpers
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultRateLimit: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultRateLimit, ...config };
  const requests = new Map<string, { count: number; resetTime: number }>();

  return {
    check: (identifier: string): { success: boolean; remaining: number } => {
      const now = Date.now();
      const windowStart = now - finalConfig.windowMs;

      // Clean old entries
      Array.from(requests.entries()).forEach(([key, data]) => {
        if (data.resetTime < now) {
          requests.delete(key);
        }
      });

      const current = requests.get(identifier);
      
      if (!current) {
        requests.set(identifier, { count: 1, resetTime: now + finalConfig.windowMs });
        return { success: true, remaining: finalConfig.maxRequests - 1 };
      }

      if (current.count >= finalConfig.maxRequests) {
        return { success: false, remaining: 0 };
      }

      current.count++;
      return { success: true, remaining: finalConfig.maxRequests - current.count };
    }
  };
}

// CSRF Protection
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

// Validation schemas for forms
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Session validation
export interface SessionValidation {
  isValid: boolean;
  reason?: string;
}

export function validateSession(session: any): SessionValidation {
  if (!session) {
    return { isValid: false, reason: 'No session found' };
  }

  const now = new Date().getTime();
  const sessionExpiry = new Date(session.expires_at || 0).getTime();

  if (sessionExpiry <= now) {
    return { isValid: false, reason: 'Session expired' };
  }

  if (!session.user?.id) {
    return { isValid: false, reason: 'Invalid user data' };
  }

  return { isValid: true };
}
