/**
 * XSS Protection System - OWASP Top 10 Compliance
 * Implementa protección completa contra Cross-Site Scripting
 */

import { NextRequest, NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

export interface XSSValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  threats: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface XSSThreat {
  type: 'script' | 'event' | 'attribute' | 'protocol' | 'encoding';
  pattern: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Patrones de amenazas XSS conocidas
 */
const XSS_THREAT_PATTERNS: XSSThreat[] = [
  // Script tags
  {
    type: 'script',
    pattern: /<script[^>]*>.*?<\/script>/gi,
    description: 'Script tags HTML',
    riskLevel: 'critical'
  },
  {
    type: 'script',
    pattern: /<script[^>]*>/gi,
    description: 'Script tags HTML abiertos',
    riskLevel: 'critical'
  },
  
  // Event handlers
  {
    type: 'event',
    pattern: /on\w+\s*=/gi,
    description: 'Event handlers inline',
    riskLevel: 'high'
  },
  {
    type: 'event',
    pattern: /javascript:/gi,
    description: 'Protocolo JavaScript',
    riskLevel: 'high'
  },
  
  // Attributes peligrosos
  {
    type: 'attribute',
    pattern: /href\s*=\s*["']?\s*javascript:/gi,
    description: 'Href con JavaScript',
    riskLevel: 'high'
  },
  {
    type: 'attribute',
    pattern: /src\s*=\s*["']?\s*javascript:/gi,
    description: 'Src con JavaScript',
    riskLevel: 'high'
  },
  
  // Encoding bypass
  {
    type: 'encoding',
    pattern: /&#x?[0-9a-f]+/gi,
    description: 'Entidades HTML hexadecimales',
    riskLevel: 'medium'
  },
  {
    type: 'encoding',
    pattern: /%[0-9a-f]{2}/gi,
    description: 'URL encoding',
    riskLevel: 'medium'
  },
  
  // CSS expressions
  {
    type: 'script',
    pattern: /expression\s*\(/gi,
    description: 'CSS expressions',
    riskLevel: 'high'
  },
  
  // VBScript
  {
    type: 'script',
    pattern: /vbscript:/gi,
    description: 'Protocolo VBScript',
    riskLevel: 'critical'
  },
  
  // Data URIs peligrosos
  {
    type: 'protocol',
    pattern: /data:\s*text\/html/gi,
    description: 'Data URI con HTML',
    riskLevel: 'high'
  },
  
  // Iframes
  {
    type: 'script',
    pattern: /<iframe[^>]*>/gi,
    description: 'Iframe tags',
    riskLevel: 'medium'
  },
  
  // Object tags
  {
    type: 'script',
    pattern: /<object[^>]*>/gi,
    description: 'Object tags',
    riskLevel: 'medium'
  },
  
  // Embed tags
  {
    type: 'script',
    pattern: /<embed[^>]*>/gi,
    description: 'Embed tags',
    riskLevel: 'medium'
  },
  
  // Form tags con action peligroso
  {
    type: 'attribute',
    pattern: /<form[^>]*action\s*=\s*["']?\s*javascript:/gi,
    description: 'Form con action JavaScript',
    riskLevel: 'high'
  },
  
  // Meta refresh con JavaScript
  {
    type: 'attribute',
    pattern: /<meta[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*content\s*=\s*["']?\s*\d+\s*;\s*url\s*=\s*javascript:/gi,
    description: 'Meta refresh con JavaScript',
    riskLevel: 'high'
  }
];

/**
 * Clase principal de protección XSS
 */
export class XSSProtectionService {
  private static instance: XSSProtectionService;
  private threatLog: XSSThreat[] = [];
  private blockedAttempts: Map<string, number> = new Map();
  
  private constructor() {}
  
  public static getInstance(): XSSProtectionService {
    if (!XSSProtectionService.instance) {
      XSSProtectionService.instance = new XSSProtectionService();
    }
    return XSSProtectionService.instance;
  }
  
  /**
   * Validar y sanitizar input contra XSS
   */
  validateAndSanitize(input: string, context: 'html' | 'attribute' | 'url' | 'css' | 'javascript' = 'html'): XSSValidationResult {
    const threats: XSSThreat[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    // 1. Detectar amenazas conocidas
    XSS_THREAT_PATTERNS.forEach(threat => {
      if (threat.pattern.test(input)) {
        threats.push(threat);
        
        // Determinar nivel de riesgo más alto
        if (threat.riskLevel === 'critical') {
          riskLevel = 'critical';
        } else if (threat.riskLevel === 'high' && riskLevel !== 'critical') {
          riskLevel = 'high';
        } else if (threat.riskLevel === 'medium' && riskLevel === 'low') {
          riskLevel = 'medium';
        }
      }
    });
    
    // 2. Detectar amenazas adicionales según el contexto
    const contextThreats = this.detectContextSpecificThreats(input, context);
    threats.push(...contextThreats);
    
    // 3. Sanitizar según el contexto
    let sanitizedValue = input;
    
    if (threats.length > 0) {
      sanitizedValue = this.sanitizeInput(input, context);
      
      // Log de amenazas bloqueadas
      this.logThreats(threats, input, sanitizedValue);
      
      // Incrementar contador de intentos bloqueados
      this.incrementBlockedAttempts();
    }
    
    return {
      isValid: threats.length === 0,
      sanitizedValue,
      threats,
      riskLevel
    };
  }
  
  /**
   * Detectar amenazas específicas del contexto
   */
  private detectContextSpecificThreats(input: string, context: string): XSSThreat[] {
    const threats: XSSThreat[] = [];
    
    switch (context) {
      case 'html':
        // Verificar tags HTML no permitidos
        const htmlTags = input.match(/<[^>]+>/g);
        if (htmlTags) {
          const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div'];
          htmlTags.forEach(tag => {
            const tagName = tag.match(/<(\w+)/)?.[1]?.toLowerCase();
            if (tagName && !allowedTags.includes(tagName)) {
              threats.push({
                type: 'script',
                pattern: new RegExp(tag, 'i'),
                description: `Tag HTML no permitido: ${tagName}`,
                riskLevel: 'medium'
              });
            }
          });
        }
        break;
        
      case 'attribute':
        // Verificar atributos peligrosos
        const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus'];
        dangerousAttrs.forEach(attr => {
          if (input.toLowerCase().includes(attr)) {
            threats.push({
              type: 'event',
              pattern: new RegExp(attr, 'i'),
              description: `Atributo peligroso: ${attr}`,
              riskLevel: 'high'
            });
          }
        });
        break;
        
      case 'url':
        // Verificar URLs peligrosas
        if (input.toLowerCase().startsWith('javascript:') || 
            input.toLowerCase().startsWith('vbscript:') ||
            input.toLowerCase().startsWith('data:text/html')) {
          threats.push({
            type: 'protocol',
            pattern: /^[a-z]+:/i,
            description: 'Protocolo peligroso en URL',
            riskLevel: 'critical'
          });
        }
        break;
        
      case 'css':
        // Verificar CSS peligroso
        if (input.toLowerCase().includes('expression(') || 
            input.toLowerCase().includes('url(javascript:') ||
            input.toLowerCase().includes('behavior:')) {
          threats.push({
            type: 'script',
            pattern: /expression\(|url\(javascript:|behavior:/gi,
            description: 'CSS peligroso detectado',
            riskLevel: 'high'
          });
        }
        break;
        
      case 'javascript':
        // Verificar JavaScript peligroso
        const dangerousJS = ['eval(', 'Function(', 'setTimeout(', 'setInterval('];
        dangerousJS.forEach(js => {
          if (input.includes(js)) {
            threats.push({
              type: 'script',
              pattern: new RegExp(js.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
              description: `Función JavaScript peligrosa: ${js}`,
              riskLevel: 'high'
            });
          }
        });
        break;
    }
    
    return threats;
  }
  
  /**
   * Sanitizar input según el contexto
   */
  private sanitizeInput(input: string, context: string): string {
    let sanitized = input;
    
    switch (context) {
      case 'html':
        // Usar DOMPurify para HTML
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div'],
          ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
          FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
        });
        break;
        
      case 'attribute':
        // Escapar caracteres especiales para atributos
        sanitized = input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        break;
        
      case 'url':
        // Validar y limpiar URLs
        try {
          const url = new URL(input, 'http://localhost');
          if (['http:', 'https:'].includes(url.protocol)) {
            sanitized = url.href;
          } else {
            sanitized = '';
          }
        } catch {
          sanitized = '';
        }
        break;
        
      case 'css':
        // Limpiar CSS peligroso
        sanitized = input
          .replace(/expression\s*\([^)]*\)/gi, '')
          .replace(/url\s*\(\s*javascript:/gi, '')
          .replace(/behavior\s*:/gi, '');
        break;
        
      case 'javascript':
        // Limpiar JavaScript peligroso
        sanitized = input
          .replace(/eval\s*\(/gi, '')
          .replace(/Function\s*\(/gi, '')
          .replace(/setTimeout\s*\(/gi, '')
          .replace(/setInterval\s*\(/gi, '');
        break;
        
      default:
        // Sanitización general
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        });
    }
    
    return sanitized;
  }
  
  /**
   * Log de amenazas detectadas
   */
  private logThreats(threats: XSSThreat[], originalInput: string, sanitizedInput: string): void {
    threats.forEach(threat => {
      this.threatLog.push({
        ...threat,
        pattern: threat.pattern.toString() // Convertir RegExp a string para logging
      });
    });
    
    console.warn(`[XSS_PROTECTION] Threats detected and blocked:`, {
      threats: threats.map(t => ({ type: t.type, description: t.description, riskLevel: t.riskLevel })),
      originalInput: originalInput.substring(0, 100) + (originalInput.length > 100 ? '...' : ''),
      sanitizedInput: sanitizedInput.substring(0, 100) + (sanitizedInput.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Incrementar contador de intentos bloqueados
   */
  private incrementBlockedAttempts(): void {
    const now = new Date().toISOString().split('T')[0]; // Solo fecha
    const current = this.blockedAttempts.get(now) || 0;
    this.blockedAttempts.set(now, current + 1);
  }
  
  /**
   * Obtener estadísticas de protección XSS
   */
  getProtectionStats(): {
    totalThreats: number;
    blockedAttempts: number;
    threatTypes: { [key: string]: number };
    riskLevels: { [key: string]: number };
  } {
    const threatTypes: { [key: string]: number } = {};
    const riskLevels: { [key: string]: number } = {};
    
    this.threatLog.forEach(threat => {
      threatTypes[threat.type] = (threatTypes[threat.type] || 0) + 1;
      riskLevels[threat.riskLevel] = (riskLevels[threat.riskLevel] || 0) + 1;
    });
    
    const today = new Date().toISOString().split('T')[0];
    const blockedAttempts = this.blockedAttempts.get(today) || 0;
    
    return {
      totalThreats: this.threatLog.length,
      blockedAttempts,
      threatTypes,
      riskLevels
    };
  }
  
  /**
   * Limpiar logs antiguos (mantener solo últimos 1000)
   */
  cleanupOldLogs(): void {
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-1000);
    }
    
    // Limpiar intentos bloqueados de hace más de 7 días
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    this.blockedAttempts.forEach((count, date) => {
      if (new Date(date) < weekAgo) {
        this.blockedAttempts.delete(date);
      }
    });
  }
  
  /**
   * Verificar si un input es seguro
   */
  isInputSafe(input: string, context: string = 'html'): boolean {
    const result = this.validateAndSanitize(input, context as any);
    return result.isValid;
  }
  
  /**
   * Obtener recomendaciones de seguridad
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getProtectionStats();
    
    if (stats.totalThreats > 100) {
      recommendations.push('Alto número de amenazas XSS detectadas. Revisar inputs de usuario.');
    }
    
    if (stats.blockedAttempts > 50) {
      recommendations.push('Muchos intentos de XSS bloqueados. Considerar rate limiting adicional.');
    }
    
    if (stats.riskLevels.critical > 0) {
      recommendations.push('Amenazas críticas detectadas. Revisar inmediatamente la seguridad.');
    }
    
    if (stats.threatTypes.script > stats.totalThreats * 0.5) {
      recommendations.push('Alta proporción de amenazas de script. Reforzar validación de HTML.');
    }
    
    return recommendations;
  }
}

/**
 * Instancia global del servicio de protección XSS
 */
export const xssProtectionService = XSSProtectionService.getInstance();

/**
 * Middleware de protección XSS para APIs
 */
export const withXSSProtection = (handler: Function) => {
  return async (request: NextRequest, context: any) => {
    try {
      // Solo aplicar a métodos que reciben datos
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        // Clonar request para poder leer el body
        const clonedRequest = request.clone();
        
        try {
          const body = await clonedRequest.json();
          
          // Validar todos los campos del body
          const validationResult = validateRequestBody(body);
          
          if (!validationResult.isValid) {
            return new Response(
              JSON.stringify({
                error: 'Contenido potencialmente peligroso detectado',
                message: 'El input contiene patrones que podrían ser maliciosos',
                threats: validationResult.threats,
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
          
        } catch (error) {
          // Si no se puede parsear JSON, continuar (podría ser form data)
        }
      }
      
      return await handler(request, context);
      
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Error de validación XSS',
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
 * Validar body del request
 */
function validateRequestBody(body: any): { isValid: boolean; threats: string[] } {
  const threats: string[] = [];
  
  function validateValue(value: any, path: string = ''): void {
    if (typeof value === 'string') {
      const result = xssProtectionService.validateAndSanitize(value);
      if (!result.isValid) {
        threats.push(`${path}: ${result.threats.map(t => t.description).join(', ')}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          validateValue(item, `${path}[${index}]`);
        });
      } else {
        Object.keys(value).forEach(key => {
          validateValue(value[key], path ? `${path}.${key}` : key);
        });
      }
    }
  }
  
  validateValue(body);
  
  return {
    isValid: threats.length === 0,
    threats
  };
}

/**
 * Helper para sanitizar input en el frontend
 */
export const sanitizeInput = (input: string, context: 'html' | 'attribute' | 'url' | 'css' | 'javascript' = 'html'): string => {
  const result = xssProtectionService.validateAndSanitize(input, context);
  return result.sanitizedValue;
};

/**
 * Helper para validar input en el frontend
 */
export const isInputSafe = (input: string, context: 'html' | 'attribute' | 'url' | 'css' | 'javascript' = 'html'): boolean => {
  return xssProtectionService.isInputSafe(input, context);
};
