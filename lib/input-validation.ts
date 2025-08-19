/**
 * Input Validation System - OWASP Top 10 Compliance
 * Implementa validación robusta de entrada con Zod schemas y sanitización
 */

import { z } from 'zod';
import { xssProtectionService } from './xss-protection';

/**
 * Schemas de validación para tipos comunes
 */
export const CommonSchemas = {
  // Identificadores
  id: z.string().uuid('ID debe ser un UUID válido'),
  numericId: z.number().int().positive('ID debe ser un número entero positivo'),
  
  // Texto básico
  text: z.string().min(1, 'El texto no puede estar vacío').max(1000, 'El texto es demasiado largo'),
  shortText: z.string().min(1, 'El texto no puede estar vacío').max(100, 'El texto es demasiado largo'),
  longText: z.string().min(1, 'El texto no puede estar vacío').max(10000, 'El texto es demasiado largo'),
  
  // Emails
  email: z.string().email('Formato de email inválido').max(254, 'Email demasiado largo'),
  
  // URLs
  url: z.string().url('Formato de URL inválido').max(2048, 'URL demasiado larga'),
  
  // Contraseñas
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  // Nombres
  name: z.string()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  // Números
  positiveNumber: z.number().positive('El número debe ser positivo'),
  nonNegativeNumber: z.number().nonnegative('El número no puede ser negativo'),
  percentage: z.number().min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje no puede exceder 100'),
  
  // Fechas
  date: z.date(),
  futureDate: z.date().refine(date => date > new Date(), 'La fecha debe ser futura'),
  pastDate: z.date().refine(date => date < new Date(), 'La fecha debe ser pasada'),
  
  // Archivos
  fileSize: z.number().max(10 * 1024 * 1024, 'El archivo no puede exceder 10MB'), // 10MB
  imageFile: z.string().refine(
    filename => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename),
    'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'
  ),
  documentFile: z.string().refine(
    filename => /\.(pdf|doc|docx|txt|rtf)$/i.test(filename),
    'Solo se permiten documentos (PDF, DOC, DOCX, TXT, RTF)'
  ),
  
  // Códigos de país
  countryCode: z.string().length(2, 'El código de país debe tener 2 caracteres').toUpperCase(),
  
  // Códigos de teléfono
  phoneNumber: z.string()
    .min(10, 'El número de teléfono debe tener al menos 10 dígitos')
    .max(15, 'El número de teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El número de teléfono contiene caracteres inválidos'),
  
  // Códigos postales
  postalCode: z.string()
    .min(4, 'El código postal debe tener al menos 4 caracteres')
    .max(10, 'El código postal es demasiado largo'),
  
  // Monedas
  currency: z.string().length(3, 'El código de moneda debe tener 3 caracteres').toUpperCase(),
  
  // Colores hex
  hexColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'El color debe ser un código hexadecimal válido de 6 caracteres'),
  
  // IP addresses
  ipAddress: z.string().regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Dirección IP inválida'
  ),
  
  // UUIDs
  uuid: z.string().uuid('UUID inválido'),
  
  // Hashes
  hash: z.string().regex(/^[a-f0-9]{32,}$/i, 'Hash inválido'),
  
  // Base64
  base64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, 'String Base64 inválido'),
  
  // JSON
  json: z.string().refine(
    str => {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    },
    'String JSON inválido'
  )
};

/**
 * Schemas específicos para la aplicación
 */
export const AppSchemas = {
  // Usuario
  user: z.object({
    id: CommonSchemas.id.optional(),
    email: CommonSchemas.email,
    name: CommonSchemas.name,
    role: z.enum(['user', 'admin', 'moderator']).default('user'),
    isActive: z.boolean().default(true),
    createdAt: CommonSchemas.date.optional(),
    updatedAt: CommonSchemas.date.optional()
  }),
  
  // Perfil de usuario
  userProfile: z.object({
    userId: CommonSchemas.id,
    bio: CommonSchemas.longText.optional(),
    avatar: CommonSchemas.url.optional(),
    location: CommonSchemas.shortText.optional(),
    website: CommonSchemas.url.optional(),
    skills: z.array(CommonSchemas.shortText).max(20, 'Máximo 20 habilidades'),
    experience: z.number().int().min(0).max(50, 'La experiencia debe estar entre 0 y 50 años'),
    education: z.array(z.object({
      institution: CommonSchemas.shortText,
      degree: CommonSchemas.shortText,
      field: CommonSchemas.shortText,
      year: z.number().int().min(1900).max(new Date().getFullYear() + 10)
    })).max(10, 'Máximo 10 estudios'),
    socialLinks: z.object({
      linkedin: CommonSchemas.url.optional(),
      github: CommonSchemas.url.optional(),
      twitter: CommonSchemas.url.optional()
    }).optional()
  }),
  
  // Proyecto
  project: z.object({
    id: CommonSchemas.id.optional(),
    title: CommonSchemas.shortText,
    description: CommonSchemas.longText,
    category: z.enum(['tech', 'business', 'social', 'environmental', 'health', 'education', 'other']),
    status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
    budget: z.object({
      min: CommonSchemas.positiveNumber,
      max: CommonSchemas.positiveNumber.optional(),
      currency: CommonSchemas.currency.default('USD')
    }).optional(),
    timeline: z.object({
      startDate: CommonSchemas.futureDate,
      endDate: CommonSchemas.futureDate.optional()
    }).optional(),
    skills: z.array(CommonSchemas.shortText).max(15, 'Máximo 15 habilidades'),
    tags: z.array(CommonSchemas.shortText).max(10, 'Máximo 10 etiquetas'),
    location: z.object({
      country: CommonSchemas.countryCode,
      city: CommonSchemas.shortText.optional(),
      remote: z.boolean().default(false)
    }).optional(),
    teamSize: z.object({
      min: z.number().int().min(1).max(100),
      max: z.number().int().min(1).max(100)
    }).optional(),
    attachments: z.array(z.object({
      filename: CommonSchemas.shortText,
      size: CommonSchemas.fileSize,
      type: CommonSchemas.shortText
    })).max(10, 'Máximo 10 archivos adjuntos')
  }),
  
  // Mensaje
  message: z.object({
    id: CommonSchemas.id.optional(),
    senderId: CommonSchemas.id,
    receiverId: CommonSchemas.id,
    content: CommonSchemas.longText,
    type: z.enum(['text', 'file', 'image', 'system']).default('text'),
    attachments: z.array(z.object({
      filename: CommonSchemas.shortText,
      size: CommonSchemas.fileSize,
      type: CommonSchemas.shortText,
      url: CommonSchemas.url
    })).max(5, 'Máximo 5 archivos adjuntos'),
    isRead: z.boolean().default(false),
    isDelivered: z.boolean().default(false),
    createdAt: CommonSchemas.date.optional()
  }),
  
  // Grupo
  group: z.object({
    id: CommonSchemas.id.optional(),
    name: CommonSchemas.shortText,
    description: CommonSchemas.longText,
    category: z.enum(['professional', 'interest', 'project', 'location', 'other']),
    isPrivate: z.boolean().default(false),
    maxMembers: z.number().int().min(2).max(1000).default(100),
    rules: z.array(CommonSchemas.shortText).max(20, 'Máximo 20 reglas'),
    tags: z.array(CommonSchemas.shortText).max(15, 'Máximo 15 etiquetas'),
    avatar: CommonSchemas.url.optional(),
    banner: CommonSchemas.url.optional()
  }),
  
  // Conexión
  connection: z.object({
    id: CommonSchemas.id.optional(),
    requesterId: CommonSchemas.id,
    receiverId: CommonSchemas.id,
    message: CommonSchemas.shortText.optional(),
    status: z.enum(['pending', 'accepted', 'rejected', 'blocked']).default('pending'),
    createdAt: CommonSchemas.date.optional(),
    updatedAt: CommonSchemas.date.optional()
  }),
  
  // Notificación
  notification: z.object({
    id: CommonSchemas.id.optional(),
    userId: CommonSchemas.id,
    type: z.enum(['message', 'connection', 'project', 'group', 'system']),
    title: CommonSchemas.shortText,
    content: CommonSchemas.text,
    isRead: z.boolean().default(false),
    actionUrl: CommonSchemas.url.optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    expiresAt: CommonSchemas.futureDate.optional(),
    createdAt: CommonSchemas.date.optional()
  })
};

/**
 * Clase principal de validación de entrada
 */
export class InputValidationService {
  private static instance: InputValidationService;
  private validationCache: Map<string, any> = new Map();
  private validationErrors: Map<string, string[]> = new Map();
  
  private constructor() {}
  
  public static getInstance(): InputValidationService {
    if (!InputValidationService.instance) {
      InputValidationService.instance = new InputValidationService();
    }
    return InputValidationService.instance;
  }
  
  /**
   * Validar datos con un schema
   */
  validate<T>(data: any, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: T;
    errors?: string[];
    sanitizedData?: any;
  } {
    try {
      // 1. Validar con Zod
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        this.logValidationErrors(data, errors);
        
        return {
          success: false,
          errors
        };
      }
      
      // 2. Sanitizar datos para XSS
      const sanitizedData = this.sanitizeData(result.data);
      
      // 3. Cache de validación exitosa
      const cacheKey = this.generateCacheKey(data, schema);
      this.validationCache.set(cacheKey, {
        data: sanitizedData,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: result.data,
        sanitizedData
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación desconocido';
      this.logValidationErrors(data, [errorMessage]);
      
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }
  
  /**
   * Validar datos parciales (solo campos proporcionados)
   */
  validatePartial<T>(data: any, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: Partial<T>;
    errors?: string[];
    sanitizedData?: Partial<T>;
  } {
    try {
      // Crear schema parcial
      const partialSchema = schema.partial();
      return this.validate(data, partialSchema);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación parcial';
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }
  
  /**
   * Validar array de datos
   */
  validateArray<T>(data: any[], schema: z.ZodSchema<T>, maxItems: number = 100): {
    success: boolean;
    data?: T[];
    errors?: string[];
    sanitizedData?: T[];
  } {
    try {
      // Validar longitud del array
      if (data.length > maxItems) {
        return {
          success: false,
          errors: [`El array no puede tener más de ${maxItems} elementos`]
        };
      }
      
      // Validar cada elemento
      const arraySchema = z.array(schema);
      return this.validate(data, arraySchema);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de validación de array';
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }
  
  /**
   * Sanitizar datos para prevenir XSS
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return xssProtectionService.validateAndSanitize(data).sanitizedValue;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = this.sanitizeData(data[key]);
      });
      return sanitized;
    }
    
    return data;
  }
  
  /**
   * Generar clave de cache
   */
  private generateCacheKey(data: any, schema: z.ZodSchema<any>): string {
    const dataHash = JSON.stringify(data);
    const schemaHash = schema.toString();
    return `${dataHash}:${schemaHash}`;
  }
  
  /**
   * Log de errores de validación
   */
  private logValidationErrors(data: any, errors: string[]): void {
    const dataKey = typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : String(data);
    this.validationErrors.set(dataKey, errors);
    
    console.warn(`[INPUT_VALIDATION] Validation failed:`, {
      data: dataKey,
      errors,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Obtener estadísticas de validación
   */
  getValidationStats(): {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    cacheHits: number;
    commonErrors: { [key: string]: number };
  } {
    const commonErrors: { [key: string]: number } = {};
    
    this.validationErrors.forEach(errors => {
      errors.forEach(error => {
        commonErrors[error] = (commonErrors[error] || 0) + 1;
      });
    });
    
    return {
      totalValidations: this.validationCache.size + this.validationErrors.size,
      successfulValidations: this.validationCache.size,
      failedValidations: this.validationErrors.size,
      cacheHits: this.validationCache.size,
      commonErrors
    };
  }
  
  /**
   * Limpiar cache y logs antiguos
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos
    
    // Limpiar cache antiguo
    this.validationCache.forEach((value, key) => {
      if (now - value.timestamp > maxAge) {
        this.validationCache.delete(key);
      }
    });
    
    // Limpiar errores antiguos (mantener solo últimos 1000)
    if (this.validationErrors.size > 1000) {
      const entries = Array.from(this.validationErrors.entries());
      this.validationErrors.clear();
      entries.slice(-1000).forEach(([key, value]) => {
        this.validationErrors.set(key, value);
      });
    }
  }
  
  /**
   * Validar y transformar datos
   */
  validateAndTransform<T, U>(
    data: any, 
    schema: z.ZodSchema<T>, 
    transformer: (data: T) => U
  ): {
    success: boolean;
    data?: U;
    errors?: string[];
  } {
    const validation = this.validate(data, schema);
    
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    try {
      const transformedData = transformer(validation.data!);
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Error de transformación']
      };
    }
  }
}

/**
 * Instancia global del servicio de validación
 */
export const inputValidationService = InputValidationService.getInstance();

/**
 * Middleware de validación para APIs
 */
export const withInputValidation = <T>(schema: z.ZodSchema<T>) => {
  return (handler: Function) => {
    return async (request: Request, context: any) => {
      try {
        // Solo validar en métodos que reciben datos
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const body = await request.json();
          
          const validation = inputValidationService.validate(body, schema);
          
          if (!validation.success) {
            return new Response(
              JSON.stringify({
                error: 'Validación fallida',
                message: 'Los datos proporcionados no son válidos',
                errors: validation.errors,
                timestamp: new Date().toISOString()
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          // Agregar datos validados al contexto
          context.validatedData = validation.sanitizedData;
        }
        
        return await handler(request, context);
        
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Error de validación',
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
 * Helper para validar datos en el frontend
 */
export const validateInput = <T>(data: any, schema: z.ZodSchema<T>): {
  success: boolean;
  data?: T;
  errors?: string[];
} => {
  return inputValidationService.validate(data, schema);
};

/**
 * Helper para validar datos parciales en el frontend
 */
export const validatePartialInput = <T>(data: any, schema: z.ZodSchema<T>): {
  success: boolean;
  data?: Partial<T>;
  errors?: string[];
} => {
  return inputValidationService.validatePartial(data, schema);
};
