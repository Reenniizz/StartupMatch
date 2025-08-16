/**
 * Enhanced Input Validation and Sanitization
 * Protege contra XSS, SQL Injection, y otros ataques de input
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ===========================================
// SANITIZACIÓN AVANZADA
// ===========================================

/**
 * Sanitización completa de HTML para prevenir XSS
 */
export function sanitizeHtml(input: string, allowBasicMarkdown = false): string {
  if (typeof input !== 'string') return '';
  
  const config = allowBasicMarkdown ? {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: []
  } : {};
  
  return DOMPurify.sanitize(input, config)
    // Eliminar javascript: URLs
    .replace(/javascript:/gi, '')
    // Eliminar data: URLs peligrosos
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg))[^;]*;/gi, '')
    // Eliminar event handlers
    .replace(/\s*on\w+\s*=/gi, '')
    // Limpiar caracteres de control
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

/**
 * Sanitización de texto plano
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Eliminar < >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+\s*=/gi, '') // Eliminar event handlers
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Caracteres de control
    .trim();
}

/**
 * Escape SQL para prevenir inyección SQL
 */
export function escapeSql(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\0/g, '\\0') // Escape null bytes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\x1a/g, '\\Z'); // Escape ctrl+Z
}

// ===========================================
// ESQUEMAS DE VALIDACIÓN SEGUROS
// ===========================================

/**
 * Validación de email robusta
 */
export const emailSchema = z.string()
  .min(5, 'Email demasiado corto')
  .max(254, 'Email demasiado largo') // RFC 5321 limit
  .email('Formato de email inválido')
  .refine((email) => {
    // Verificaciones adicionales de seguridad
    const domain = email.split('@')[1];
    return domain && !domain.includes('..') && !domain.startsWith('-') && !domain.endsWith('-');
  }, 'Dominio de email inválido')
  .transform((email) => email.toLowerCase().trim());

/**
 * Validación de contraseña segura
 */
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres')
  .refine((password) => {
    // Verificar complejidad
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpper && hasLower && hasNumber && hasSpecial;
  }, 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos especiales')
  .refine((password) => {
    // Verificar que no sea una contraseña común
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    return !commonPasswords.includes(password.toLowerCase());
  }, 'Contraseña demasiado común');

/**
 * Validación de nombre de usuario
 */
export const usernameSchema = z.string()
  .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
  .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Solo se permiten letras, números, guiones y guiones bajos')
  .refine((username) => !username.startsWith('_') && !username.endsWith('_'), 
    'No puede empezar o terminar con guión bajo')
  .refine((username) => {
    // Lista de nombres reservados
    const reserved = ['admin', 'root', 'administrator', 'moderator', 'support', 'help'];
    return !reserved.includes(username.toLowerCase());
  }, 'Nombre de usuario reservado')
  .transform((username) => username.toLowerCase().trim());

/**
 * Validación de texto general (nombres, descripciones, etc.)
 */
export const textSchema = z.string()
  .min(1, 'Este campo es requerido')
  .max(5000, 'Texto demasiado largo')
  .transform((text) => sanitizeText(text))
  .refine((text) => text.length > 0, 'El texto no puede estar vacío después de la sanitización');

/**
 * Validación de nombre completo
 */
export const nameSchema = z.string()
  .min(1, 'El nombre es requerido')
  .max(100, 'Nombre demasiado largo')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Solo se permiten letras, espacios, apostrofes y guiones')
  .transform((name) => {
    // Capitalizar primera letra de cada palabra
    return name.trim().replace(/\b\w/g, letter => letter.toUpperCase());
  });

/**
 * Validación de mensaje de chat
 */
export const messageSchema = z.string()
  .min(1, 'El mensaje no puede estar vacío')
  .max(5000, 'Mensaje demasiado largo')
  .transform((message) => sanitizeHtml(message, true)) // Permite markdown básico
  .refine((message) => message.trim().length > 0, 'Mensaje vacío después de sanitización')
  .refine((message) => {
    // Verificar que no sea solo espacios o caracteres especiales
    return /\w/.test(message);
  }, 'El mensaje debe contener al menos una palabra');

/**
 * Validación de UUID
 */
export const uuidSchema = z.string()
  .uuid('UUID inválido')
  .transform((uuid) => uuid.toLowerCase());

/**
 * Validación de URL
 */
export const urlSchema = z.string()
  .url('URL inválida')
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      // Solo permitir HTTP y HTTPS
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }, 'Solo se permiten URLs HTTP/HTTPS')
  .refine((url) => {
    // Verificar que no sea localhost en producción
    if (process.env.NODE_ENV === 'production') {
      return !url.includes('localhost') && !url.includes('127.0.0.1');
    }
    return true;
  }, 'URLs localhost no permitidas en producción');

// ===========================================
// VALIDADORES PARA FORMULARIOS
// ===========================================

/**
 * Schema para registro de usuario
 */
export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida')
});

/**
 * Schema para envío de mensajes
 */
export const sendMessageSchema = z.object({
  message: messageSchema,
  conversationId: uuidSchema,
  tempId: z.number().optional()
});

/**
 * Schema para actualización de perfil
 */
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  bio: textSchema.optional(),
  website: urlSchema.optional(),
  location: textSchema.optional()
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Valida y sanitiza datos de entrada
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Error de validación desconocido'] };
  }
}

/**
 * Rate limiting por IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 15 * 60 * 1000 // 15 minutos
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Limpiar entradas expiradas
  Array.from(rateLimitMap.entries()).forEach(([key, value]) => {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  });
  
  const current = rateLimitMap.get(identifier);
  
  if (!current || current.resetTime < now) {
    // Primera request o ventana expirada
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

/**
 * Generador de tokens CSRF seguros
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback para Node.js
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(32);
    array.set(buffer);
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verificación de token CSRF
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken || token.length !== 64 || sessionToken.length !== 64) {
    return false;
  }
  
  // Comparación temporal constante para prevenir timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Logging seguro (no logea información sensible)
 */
export function secureLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  console[level](`[SECURITY] ${message}`, sanitizedData);
}

function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitive = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}
