/**
 * Security Monitoring System - OWASP Top 10 Compliance
 * Implementa monitoreo completo de seguridad con detección de anomalías y logging
 */

export interface SecurityEvent {
  id: string;
  type: 'auth' | 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'anomaly' | 'threat' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  requestId?: string;
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  type: 'immediate' | 'delayed' | 'batch';
  message: string;
  recipients: string[];
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AnomalyDetection {
  pattern: string;
  threshold: number;
  timeWindow: number;
  currentCount: number;
  lastOccurrence: Date;
  isAnomaly: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: { [key: string]: number };
  eventsBySeverity: { [key: string]: number };
  eventsBySource: { [key: string]: number };
  activeAlerts: number;
  resolvedEvents: number;
  averageResolutionTime: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Clase principal de monitoreo de seguridad
 */
export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private events: Map<string, SecurityEvent> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private anomalyPatterns: Map<string, AnomalyDetection> = new Map();
  private alertThresholds: Map<string, number> = new Map();
  
  private constructor() {
    this.initializeAlertThresholds();
    this.initializeAnomalyPatterns();
    
    // Limpiar eventos antiguos cada hora
    setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1000);
    
    // Analizar anomalías cada 5 minutos
    setInterval(() => this.analyzeAnomalies(), 5 * 60 * 1000);
  }
  
  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }
  
  /**
   * Registrar evento de seguridad
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): string {
    const eventId = this.generateEventId();
    const timestamp = new Date();
    
    const securityEvent: SecurityEvent = {
      ...event,
      id: eventId,
      timestamp,
      resolved: false
    };
    
    this.events.set(eventId, securityEvent);
    
    // Verificar si requiere alerta inmediata
    if (event.severity === 'critical' || event.severity === 'high') {
      this.createImmediateAlert(eventId, event);
    }
    
    // Actualizar patrones de anomalía
    this.updateAnomalyPatterns(event);
    
    // Log del evento
    console.warn(`[SECURITY_EVENT] ${event.type.toUpperCase()}: ${event.severity} - ${event.source}`, {
      eventId,
      details: event.details,
      timestamp: timestamp.toISOString()
    });
    
    return eventId;
  }
  
  /**
   * Crear alerta inmediata
   */
  private createImmediateAlert(eventId: string, event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = this.generateAlertId();
    
    const alert: SecurityAlert = {
      id: alertId,
      eventId,
      type: 'immediate',
      message: this.generateAlertMessage(event),
      recipients: this.getAlertRecipients(event),
      sent: false,
      acknowledged: false
    };
    
    this.alerts.set(alertId, alert);
    
    // Enviar alerta inmediatamente
    this.sendAlert(alert);
  }
  
  /**
   * Generar mensaje de alerta
   */
  private generateAlertMessage(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): string {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    
    return `${severityEmoji[event.severity]} ALERTA DE SEGURIDAD: ${event.type.toUpperCase()}
    
Severidad: ${event.severity.toUpperCase()}
Origen: ${event.source}
Detalles: ${JSON.stringify(event.details, null, 2)}
IP: ${event.ipAddress || 'N/A'}
Usuario: ${event.userId || 'N/A'}
Timestamp: ${new Date().toISOString()}`;
  }
  
  /**
   * Obtener destinatarios de alertas
   */
  private getAlertRecipients(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): string[] {
    const recipients = ['security@startupmatch.com'];
    
    if (event.severity === 'critical') {
      recipients.push('admin@startupmatch.com', 'cto@startupmatch.com');
    }
    
    if (event.type === 'auth' && event.severity === 'high') {
      recipients.push('auth-team@startupmatch.com');
    }
    
    return recipients;
  }
  
  /**
   * Enviar alerta
   */
  private async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Aquí se implementaría el envío real de alertas
      // Por ahora solo simulamos el envío
      console.log(`[SECURITY_ALERT] Sending alert: ${alert.message}`);
      
      alert.sent = true;
      alert.sentAt = new Date();
      
      // Simular envío exitoso
      setTimeout(() => {
        console.log(`[SECURITY_ALERT] Alert sent successfully: ${alert.id}`);
      }, 1000);
      
    } catch (error) {
      console.error(`[SECURITY_ALERT] Failed to send alert: ${alert.id}`, error);
    }
  }
  
  /**
   * Actualizar patrones de anomalía
   */
  private updateAnomalyPatterns(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const patternKey = `${event.type}:${event.source}:${event.severity}`;
    
    if (!this.anomalyPatterns.has(patternKey)) {
      this.anomalyPatterns.set(patternKey, {
        pattern: patternKey,
        threshold: this.alertThresholds.get(event.type) || 10,
        timeWindow: 5 * 60 * 1000, // 5 minutos
        currentCount: 0,
        lastOccurrence: new Date(),
        isAnomaly: false
      });
    }
    
    const pattern = this.anomalyPatterns.get(patternKey)!;
    const now = new Date();
    
    // Resetear contador si ha pasado la ventana de tiempo
    if (now.getTime() - pattern.lastOccurrence.getTime() > pattern.timeWindow) {
      pattern.currentCount = 1;
    } else {
      pattern.currentCount++;
    }
    
    pattern.lastOccurrence = now;
    pattern.isAnomaly = pattern.currentCount > pattern.threshold;
    
    // Crear alerta si se detecta anomalía
    if (pattern.isAnomaly && !pattern.isAnomaly) {
      this.logSecurityEvent({
        type: 'anomaly',
        severity: 'high',
        source: 'anomaly_detection',
        details: {
          pattern: patternKey,
          count: pattern.currentCount,
          threshold: pattern.threshold,
          timeWindow: pattern.timeWindow
        },
        ipAddress: event.ipAddress,
        userId: event.userId,
        sessionId: event.sessionId,
        userAgent: event.userAgent,
        requestId: event.requestId
      });
    }
  }
  
  /**
   * Analizar anomalías
   */
  private analyzeAnomalies(): void {
    const now = new Date();
    
    this.anomalyPatterns.forEach((pattern, key) => {
      // Verificar si el patrón ha expirado
      if (now.getTime() - pattern.lastOccurrence.getTime() > pattern.timeWindow) {
        if (pattern.currentCount > 0) {
          // Resetear patrón
          pattern.currentCount = 0;
          pattern.isAnomaly = false;
        }
      }
    });
  }
  
  /**
   * Resolver evento de seguridad
   */
  resolveSecurityEvent(eventId: string, resolution: string, resolvedBy: string): boolean {
    const event = this.events.get(eventId);
    
    if (!event) {
      return false;
    }
    
    event.resolved = true;
    event.resolution = resolution;
    event.resolvedAt = new Date();
    
    // Marcar alertas relacionadas como reconocidas
    this.alerts.forEach(alert => {
      if (alert.eventId === eventId) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = resolvedBy;
      }
    });
    
    console.log(`[SECURITY_EVENT] Event resolved: ${eventId} by ${resolvedBy}`);
    return true;
  }
  
  /**
   * Obtener métricas de seguridad
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const eventsByType: { [key: string]: number } = {};
    const eventsBySeverity: { [key: string]: number } = {};
    const eventsBySource: { [key: string]: number } = {};
    
    let resolvedEvents = 0;
    let totalResolutionTime = 0;
    
    this.events.forEach(event => {
      // Contar por tipo
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Contar por severidad
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Contar por origen
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
      
      // Calcular tiempo de resolución
      if (event.resolved && event.resolvedAt) {
        resolvedEvents++;
        totalResolutionTime += event.resolvedAt.getTime() - event.timestamp.getTime();
      }
    });
    
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.acknowledged).length;
    const averageResolutionTime = resolvedEvents > 0 ? totalResolutionTime / resolvedEvents : 0;
    
    // Determinar nivel de amenaza
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (eventsBySeverity.critical > 0) {
      threatLevel = 'critical';
    } else if (eventsBySeverity.high > 5) {
      threatLevel = 'high';
    } else if (eventsBySeverity.medium > 10) {
      threatLevel = 'medium';
    }
    
    return {
      totalEvents: this.events.size,
      eventsByType,
      eventsBySeverity,
      eventsBySource,
      activeAlerts,
      resolvedEvents,
      averageResolutionTime,
      threatLevel
    };
  }
  
  /**
   * Obtener eventos de seguridad
   */
  getSecurityEvents(
    filters?: {
      type?: string;
      severity?: string;
      source?: string;
      resolved?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): SecurityEvent[] {
    let events = Array.from(this.events.values());
    
    // Aplicar filtros
    if (filters) {
      if (filters.type) {
        events = events.filter(event => event.type === filters.type);
      }
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity);
      }
      if (filters.source) {
        events = events.filter(event => event.source === filters.source);
      }
      if (filters.resolved !== undefined) {
        events = events.filter(event => event.resolved === filters.resolved);
      }
      if (filters.startDate) {
        events = events.filter(event => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(event => event.timestamp <= filters.endDate!);
      }
    }
    
    // Ordenar por timestamp (más reciente primero)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return events.slice(0, limit);
  }
  
  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }
  
  /**
   * Limpiar eventos antiguos
   */
  private cleanupOldEvents(): void {
    const now = new Date();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
    
    const expiredEvents: string[] = [];
    
    this.events.forEach((event, eventId) => {
      if (now.getTime() - event.timestamp.getTime() > maxAge) {
        expiredEvents.push(eventId);
      }
    });
    
    expiredEvents.forEach(eventId => {
      this.events.delete(eventId);
    });
    
    if (expiredEvents.length > 0) {
      console.log(`[SECURITY_MONITORING] Cleaned up ${expiredEvents.length} old events`);
    }
  }
  
  /**
   * Inicializar umbrales de alerta
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds.set('auth', 5); // 5 intentos de auth por minuto
    this.alertThresholds.set('xss', 3); // 3 intentos de XSS por minuto
    this.alertThresholds.set('csrf', 3); // 3 intentos de CSRF por minuto
    this.alertThresholds.set('injection', 2); // 2 intentos de inyección por minuto
    this.alertThresholds.set('rate_limit', 10); // 10 excesos de rate limit por minuto
  }
  
  /**
   * Inicializar patrones de anomalía
   */
  private initializeAnomalyPatterns(): void {
    // Patrones predefinidos para detección de anomalías
    const patterns = [
      'auth:login:high',
      'auth:login:critical',
      'xss:input:high',
      'xss:input:critical',
      'csrf:request:high',
      'injection:sql:high',
      'injection:sql:critical'
    ];
    
    patterns.forEach(pattern => {
      this.anomalyPatterns.set(pattern, {
        pattern,
        threshold: this.alertThresholds.get(pattern.split(':')[0]) || 10,
        timeWindow: 5 * 60 * 1000,
        currentCount: 0,
        lastOccurrence: new Date(),
        isAnomaly: false
      });
    });
  }
  
  /**
   * Generar ID único para evento
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Generar ID único para alerta
   */
  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Exportar eventos para análisis
   */
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    const events = Array.from(this.events.values());
    
    if (format === 'csv') {
      const headers = ['ID', 'Type', 'Severity', 'Source', 'Timestamp', 'IP', 'User', 'Resolved'];
      const rows = events.map(event => [
        event.id,
        event.type,
        event.severity,
        event.source,
        event.timestamp.toISOString(),
        event.ipAddress || '',
        event.userId || '',
        event.resolved ? 'Yes' : 'No'
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
      return JSON.stringify(events, null, 2);
    }
  }
  
  /**
   * Generar reporte de seguridad
   */
  generateSecurityReport(): {
    summary: SecurityMetrics;
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
    recommendations: string[];
  } {
    const metrics = this.getSecurityMetrics();
    const recentEvents = this.getSecurityEvents({}, 20);
    const activeAlerts = this.getActiveAlerts();
    
    const recommendations: string[] = [];
    
    // Generar recomendaciones basadas en métricas
    if (metrics.eventsBySeverity.critical > 0) {
      recommendations.push('Revisar inmediatamente eventos críticos de seguridad');
    }
    
    if (metrics.eventsByType.auth > 10) {
      recommendations.push('Reforzar sistema de autenticación y rate limiting');
    }
    
    if (metrics.eventsByType.xss > 5) {
      recommendations.push('Revisar validación de entrada y sanitización XSS');
    }
    
    if (metrics.activeAlerts > 5) {
      recommendations.push('Revisar y resolver alertas de seguridad pendientes');
    }
    
    if (metrics.threatLevel === 'high' || metrics.threatLevel === 'critical') {
      recommendations.push('Implementar medidas de seguridad adicionales');
    }
    
    return {
      summary: metrics,
      recentEvents,
      activeAlerts,
      recommendations
    };
  }
}

/**
 * Instancia global del servicio de monitoreo de seguridad
 */
export const securityMonitoring = SecurityMonitoringService.getInstance();

/**
 * Helper para registrar eventos de seguridad
 */
export const logSecurityEvent = (
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  source: string,
  details: any,
  options?: {
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    requestId?: string;
  }
): string => {
  return securityMonitoring.logSecurityEvent({
    type,
    severity,
    source,
    details,
    ...options
  });
};

/**
 * Helper para registrar eventos de autenticación
 */
export const logAuthEvent = (
  severity: SecurityEvent['severity'],
  source: string,
  details: any,
  options?: {
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    requestId?: string;
  }
): string => {
  return logSecurityEvent('auth', severity, source, details, options);
};

/**
 * Helper para registrar eventos XSS
 */
export const logXSSEvent = (
  severity: SecurityEvent['severity'],
  source: string,
  details: any,
  options?: {
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    requestId?: string;
  }
): string => {
  return logSecurityEvent('xss', severity, source, details, options);
};

/**
 * Helper para registrar eventos CSRF
 */
export const logCSRFEvent = (
  severity: SecurityEvent['severity'],
  source: string,
  details: any,
  options?: {
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    requestId?: string;
  }
): string => {
  return logSecurityEvent('csrf', severity, source, details, options);
};
