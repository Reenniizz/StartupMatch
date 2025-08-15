/**
 * Security utilities for input sanitization and validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { securityLogger } from './logger';

// Enhanced XSS Protection
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove script tags completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    // Remove data: URLs (except safe image types)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg))[^;]*;[^,]*,/gi, '')
    // Remove dangerous functions
    .replace(/eval\s*\(/gi, '')
    .replace(/Function\s*\(/gi, '')
    // Standard HTML encoding
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQL Injection Protection
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove SQL keywords and dangerous patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
    .replace(/('|(\\')|(--)|(\;)|(\|)|(\*)|(%)|(\+))/g, '')
    // Remove SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*/g, '')
    // Remove common injection patterns
    .replace(/(\bOR\b.*\b=\b.*\b=\b)|(\bAND\b.*\b=\b.*\b=\b)/gi, '')
    .trim();
}

// General Input Sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

// Validation interface
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'email' | 'url' | 'uuid';
  sanitize?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Request validation function
export function validateRequest(
  data: Record<string, any>,
  schema: ValidationSchema
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
} {
  const errors: Record<string, string[]> = {};
  const sanitizedData: Record<string, any> = {};
  
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors: string[] = [];
    
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field} is required`);
      continue;
    }
    
    // Skip if empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitizedData[field] = value;
      continue;
    }
    
    let processedValue = value;
    
    // Type validation
    if (rule.type) {
      switch (rule.type) {
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            fieldErrors.push(`${field} must be a valid email address`);
            continue;
          }
          break;
          
        case 'uuid':
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidPattern.test(value)) {
            fieldErrors.push(`${field} must be a valid UUID`);
            continue;
          }
          break;
          
        case 'url':
          try {
            new URL(value);
          } catch {
            fieldErrors.push(`${field} must be a valid URL`);
            continue;
          }
          break;
      }
    }
    
    // Length validation
    if (rule.minLength && processedValue.length < rule.minLength) {
      fieldErrors.push(`${field} must be at least ${rule.minLength} characters long`);
    }
    
    if (rule.maxLength && processedValue.length > rule.maxLength) {
      fieldErrors.push(`${field} must be no more than ${rule.maxLength} characters long`);
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(processedValue)) {
      fieldErrors.push(`${field} does not match the required format`);
    }
    
    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(processedValue);
      if (customResult !== true) {
        fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} failed custom validation`);
      }
    }
    
    // Sanitization
    if (rule.sanitize && typeof processedValue === 'string') {
      processedValue = sanitizeHtml(processedValue);
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    } else {
      sanitizedData[field] = processedValue;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
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
