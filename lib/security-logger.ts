/**
 * Security Event Logging System
 * Sistema robusto de logging de eventos de seguridad
 */

import { createClient } from '@supabase/supabase-js';

// ===========================================
// TIPOS Y INTERFACES
// ===========================================

export type SecurityEventType = 
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILED' 
  | 'AUTH_LOGOUT'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DELETED'
  | 'GDPR_REQUEST'
  | 'SECURITY_BREACH_ATTEMPT'
  | 'UNAUTHORIZED_API_ACCESS';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  severity: SecuritySeverity;
  description?: string;
  geolocation?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export interface ThreatDetectionResult {
  isThreat: boolean;
  riskScore: number;
  reasons: string[];
  recommendedAction: 'ALLOW' | 'WARN' | 'BLOCK' | 'LOCKOUT';
}

// ===========================================
// CONFIGURACIÓN
// ===========================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===========================================
// SECURITY EVENT LOGGER
// ===========================================

export class SecurityLogger {
  private static readonly MAX_METADATA_SIZE = 10000; // 10KB max
  private static readonly ALERT_WEBHOOKS = [
    process.env.SECURITY_SLACK_WEBHOOK,
    process.env.SECURITY_TEAMS_WEBHOOK,
    process.env.SECURITY_DISCORD_WEBHOOK,
  ].filter(Boolean);

  /**
   * Log security event to database and monitoring systems
   */
  static async logEvent(event: SecurityEvent): Promise<void> {
    try {
      // Sanitize and validate event data
      const sanitizedEvent = this.sanitizeEvent(event);
      
      // Store in database for audit trail
      await this.storeEventInDatabase(sanitizedEvent);
      
      // Send alerts for high-severity events
      if (['HIGH', 'CRITICAL'].includes(event.severity)) {
        await this.sendSecurityAlert(sanitizedEvent);
      }
      
      // Log to application logs with structured format
      this.logToConsole(sanitizedEvent);
      
      // Update security metrics
      await this.updateSecurityMetrics(sanitizedEvent);
      
    } catch (error) {
      console.error('[SECURITY_LOGGER_ERROR]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.type,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log authentication success with context
   */
  static async logAuthSuccess(
    userId: string,
    ip: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: 'AUTH_SUCCESS',
      userId,
      ip,
      userAgent,
      metadata: {
        ...metadata,
        loginMethod: metadata?.loginMethod || 'password',
        newSession: metadata?.newSession || false,
      },
      timestamp: new Date().toISOString(),
      severity: 'LOW',
      description: 'User successfully authenticated',
    });
  }

  /**
   * Log authentication failure with attempt tracking
   */
  static async logAuthFailure(
    email: string | undefined,
    ip: string,
    userAgent: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: 'AUTH_FAILED',
      ip,
      userAgent,
      metadata: {
        ...metadata,
        email: email ? this.hashSensitiveData(email) : 'unknown',
        reason,
        attemptNumber: metadata?.attemptNumber || 1,
      },
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
      description: `Authentication failed: ${reason}`,
    });
  }

  /**
   * Log permission denied events
   */
  static async logPermissionDenied(
    userId: string,
    action: string,
    resource: string,
    ip: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: 'PERMISSION_DENIED',
      userId,
      ip,
      userAgent,
      metadata: {
        ...metadata,
        action,
        resource,
        requiredRole: metadata?.requiredRole,
        userRole: metadata?.userRole,
      },
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
      description: `Permission denied for action '${action}' on '${resource}'`,
    });
  }

  /**
   * Log suspicious activity with threat analysis
   */
  static async logSuspiciousActivity(
    userId: string | undefined,
    ip: string,
    userAgent: string,
    activityType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const threatAnalysis = await this.analyzeThreat(ip, userId, activityType, metadata);
    
    await this.logEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      ip,
      userAgent,
      metadata: {
        ...metadata,
        activityType,
        threatAnalysis,
        riskScore: threatAnalysis.riskScore,
      },
      timestamp: new Date().toISOString(),
      severity: threatAnalysis.riskScore > 7 ? 'CRITICAL' : 'HIGH',
      description: `Suspicious activity detected: ${activityType}`,
    });
  }

  /**
   * Log rate limit exceeded events
   */
  static async logRateLimitExceeded(
    identifier: string,
    endpoint: string,
    limit: number,
    ip: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      userAgent,
      endpoint,
      metadata: {
        ...metadata,
        identifier,
        limit,
        timeWindow: metadata?.timeWindow || '1 minute',
      },
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
      description: `Rate limit exceeded for ${endpoint}`,
    });
  }

  // ===========================================
  // THREAT DETECTION AND ANALYSIS
  // ===========================================

  /**
   * Analyze potential threats based on activity patterns
   */
  private static async analyzeThreat(
    ip: string,
    userId?: string,
    activityType?: string,
    metadata?: Record<string, any>
  ): Promise<ThreatDetectionResult> {
    let riskScore = 0;
    const reasons: string[] = [];

    try {
      // Check for multiple failed login attempts
      const recentFailures = await this.getRecentEventCount('AUTH_FAILED', ip, 15 * 60 * 1000);
      if (recentFailures > 3) {
        riskScore += 3;
        reasons.push(`${recentFailures} failed login attempts in 15 minutes`);
      }

      // Check for unusual IP patterns
      if (userId) {
        const userRecentIPs = await this.getUserRecentIPs(userId, 24 * 60 * 60 * 1000);
        if (userRecentIPs.length > 5) {
          riskScore += 2;
          reasons.push(`User accessed from ${userRecentIPs.length} different IPs in 24h`);
        }
      }

      // Check for rapid sequential requests
      const recentRequests = await this.getRecentEventCount('DATA_ACCESS', ip, 5 * 60 * 1000);
      if (recentRequests > 100) {
        riskScore += 4;
        reasons.push(`${recentRequests} requests in 5 minutes (potential bot)`);
      }

      // Check for access patterns outside normal hours
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        riskScore += 1;
        reasons.push('Access during unusual hours');
      }

      // Determine recommended action based on risk score
      let recommendedAction: ThreatDetectionResult['recommendedAction'] = 'ALLOW';
      if (riskScore >= 8) recommendedAction = 'LOCKOUT';
      else if (riskScore >= 6) recommendedAction = 'BLOCK';
      else if (riskScore >= 3) recommendedAction = 'WARN';

      return {
        isThreat: riskScore >= 3,
        riskScore,
        reasons,
        recommendedAction,
      };

    } catch (error) {
      console.error('[THREAT_ANALYSIS_ERROR]', error);
      return {
        isThreat: false,
        riskScore: 0,
        reasons: ['Analysis failed'],
        recommendedAction: 'ALLOW',
      };
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  /**
   * Sanitize event data before storage
   */
  private static sanitizeEvent(event: SecurityEvent): SecurityEvent {
    // Remove sensitive data from metadata
    const sanitizedMetadata = event.metadata ? { ...event.metadata } : {};
    
    // Remove or hash sensitive fields
    if (sanitizedMetadata.password) delete sanitizedMetadata.password;
    if (sanitizedMetadata.token) delete sanitizedMetadata.token;
    if (sanitizedMetadata.apiKey) delete sanitizedMetadata.apiKey;
    
    // Truncate large metadata to prevent DoS
    const metadataString = JSON.stringify(sanitizedMetadata);
    if (metadataString.length > this.MAX_METADATA_SIZE) {
      sanitizedMetadata.truncated = true;
      sanitizedMetadata.originalSize = metadataString.length;
    }

    return {
      ...event,
      metadata: sanitizedMetadata,
      userAgent: event.userAgent.substring(0, 500), // Limit user agent length
      description: event.description?.substring(0, 1000), // Limit description
    };
  }

  /**
   * Store security event in database
   */
  private static async storeEventInDatabase(event: SecurityEvent): Promise<void> {
    await supabase.from('security_events').insert({
      event_type: event.type,
      user_id: event.userId,
      session_id: event.sessionId,
      ip_address: event.ip,
      user_agent: event.userAgent,
      endpoint: event.endpoint,
      http_method: event.method,
      metadata: event.metadata,
      severity: event.severity,
      description: event.description,
      geolocation: event.geolocation,
      created_at: event.timestamp,
    });
  }

  /**
   * Send security alerts to monitoring systems
   */
  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    const alertMessage = {
      text: `🚨 Security Alert: ${event.type}`,
      severity: event.severity,
      timestamp: event.timestamp,
      details: {
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        description: event.description,
        endpoint: event.endpoint,
      },
    };

    // Send to all configured webhooks
    const promises = this.ALERT_WEBHOOKS.map(webhook => {
      if (!webhook) return Promise.resolve();
      
      return fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertMessage),
      }).catch(error => console.error('Webhook alert failed:', error));
    });

    await Promise.allSettled(promises);
  }

  /**
   * Log to console with structured format
   */
  private static logToConsole(event: SecurityEvent): void {
    const logLevel = event.severity === 'CRITICAL' ? 'error' : 
                    event.severity === 'HIGH' ? 'warn' : 'info';
    
    console[logLevel](`[SECURITY_EVENT:${event.type}]`, {
      userId: event.userId,
      ip: event.ip,
      severity: event.severity,
      timestamp: event.timestamp,
      description: event.description,
      metadata: event.metadata,
    });
  }

  /**
   * Update security metrics for monitoring
   */
  private static async updateSecurityMetrics(event: SecurityEvent): Promise<void> {
    // Increment counters for different event types
    const metrics = {
      [`security_events_total`]: 1,
      [`security_events_${event.type.toLowerCase()}_total`]: 1,
      [`security_events_severity_${event.severity.toLowerCase()}_total`]: 1,
    };

    // Store metrics (implement based on your monitoring system)
    // For now, just log the metrics
    console.log('[SECURITY_METRICS]', metrics);
  }

  /**
   * Get count of recent events by type and IP
   */
  private static async getRecentEventCount(
    eventType: SecurityEventType,
    ip: string,
    timeWindowMs: number
  ): Promise<number> {
    const since = new Date(Date.now() - timeWindowMs).toISOString();
    
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType)
      .eq('ip_address', ip)
      .gte('created_at', since);
    
    return count || 0;
  }

  /**
   * Get recent IP addresses for a user
   */
  private static async getUserRecentIPs(userId: string, timeWindowMs: number): Promise<string[]> {
    const since = new Date(Date.now() - timeWindowMs).toISOString();
    
    const { data } = await supabase
      .from('security_events')
      .select('ip_address')
      .eq('user_id', userId)
      .gte('created_at', since);
    
    const ips = data?.map(event => event.ip_address) || [];
    const uniqueIPs = Array.from(new Set(ips));
    return uniqueIPs;
  }

  /**
   * Hash sensitive data for logging
   */
  private static hashSensitiveData(data: string): string {
    // Simple hash for logging purposes (not cryptographic)
    return `***${data.slice(-4)}`;
  }
}

// ===========================================
// SECURITY METRICS COLLECTOR
// ===========================================

export class SecurityMetrics {
  /**
   * Get security dashboard metrics
   */
  static async getDashboardMetrics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<any> {
    const timeframMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const since = new Date(Date.now() - timeframMs).toISOString();

    const [
      totalEvents,
      authFailures,
      suspiciousActivity,
      rateLimitExceeded,
      severityBreakdown
    ] = await Promise.all([
      this.getEventCount(since),
      this.getEventCount(since, 'AUTH_FAILED'),
      this.getEventCount(since, 'SUSPICIOUS_ACTIVITY'),
      this.getEventCount(since, 'RATE_LIMIT_EXCEEDED'),
      this.getSeverityBreakdown(since),
    ]);

    return {
      timeframe,
      totalEvents,
      authFailures,
      suspiciousActivity,
      rateLimitExceeded,
      severityBreakdown,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static async getEventCount(since: string, eventType?: SecurityEventType): Promise<number> {
    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { count } = await query;
    return count || 0;
  }

  private static async getSeverityBreakdown(since: string): Promise<Record<SecuritySeverity, number>> {
    const { data } = await supabase
      .from('security_events')
      .select('severity')
      .gte('created_at', since);

    const breakdown: Record<SecuritySeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    data?.forEach(event => {
      breakdown[event.severity as SecuritySeverity]++;
    });

    return breakdown;
  }
}

export default SecurityLogger;
