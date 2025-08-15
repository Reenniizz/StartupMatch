// lib/logger.ts - Sistema de logging robusto para producción
import { NextRequest } from 'next/server';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};
  
  constructor(private serviceName: string = 'StartupMatch') {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  private formatMessage(level: LogLevel, message: string, extra?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      context: this.context,
      ...(extra && { extra })
    };
    
    return JSON.stringify(logEntry);
  }

  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === 'development') return true;
    
    const minLevel = process.env.LOG_LEVEL || 'info';
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  debug(message: string, extra?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, extra));
    }
  }

  info(message: string, extra?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, extra));
    }
  }

  warn(message: string, extra?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, extra));
    }
  }

  error(message: string, error?: Error | any, extra?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error;
      
      console.error(this.formatMessage(LogLevel.ERROR, message, { 
        error: errorDetails, 
        ...extra 
      }));
    }
  }

  fatal(message: string, error?: Error | any, extra?: any) {
    if (this.shouldLog(LogLevel.FATAL)) {
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error;
      
      console.error(this.formatMessage(LogLevel.FATAL, message, { 
        error: errorDetails, 
        ...extra 
      }));
    }
  }

  // Specialized logging methods
  apiRequest(req: NextRequest, response: any, duration: number) {
    this.info('API Request completed', {
      method: req.method,
      url: req.url,
      status: response.status,
      duration: `${duration}ms`,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    });
  }

  authEvent(event: string, userId?: string, success: boolean = true, extra?: any) {
    this.info(`Auth Event: ${event}`, {
      userId,
      success,
      event,
      ...extra
    });
  }

  dbQuery(query: string, duration: number, error?: Error) {
    if (error) {
      this.error('Database query failed', error, { query, duration });
    } else {
      this.debug('Database query executed', { query, duration: `${duration}ms` });
    }
  }

  securityAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical', extra?: any) {
    this.error(`🚨 SECURITY ALERT [${severity.toUpperCase()}]: ${message}`, null, {
      severity,
      timestamp: new Date().toISOString(),
      ...extra
    });
  }
}

// Export singleton logger instances
export const logger = new Logger();
export const apiLogger = new Logger('API');
export const authLogger = new Logger('AUTH');
export const dbLogger = new Logger('DATABASE');
export const securityLogger = new Logger('SECURITY');

// Request context helper
export function createRequestLogger(req: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  const requestLogger = new Logger('REQUEST');
  
  requestLogger.setContext({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  });
  
  return { requestLogger, requestId };
}
