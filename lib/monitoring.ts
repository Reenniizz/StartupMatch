// lib/monitoring.ts - Sistema de monitoreo y métricas avanzado
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  timestamp: number;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  
  // Performance monitoring
  startTimer(name: string): () => void {
    const startTime = performance.now();
    const startTimestamp = Date.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        timestamp: startTimestamp,
        tags: { unit: 'ms' }
      });
      
      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${name}`, { 
          duration: `${duration.toFixed(2)}ms` 
        });
      }
    };
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    logger.debug('Metric recorded', metric);
  }

  // Database monitoring
  async monitorDatabase(): Promise<HealthCheck> {
    const timer = this.startTimer('database_health_check');
    
    try {
      // This will be implemented when we add Supabase client
      const startTime = performance.now();
      
      // Simulated health check - replace with actual Supabase ping
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const latency = performance.now() - startTime;
      timer();
      
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'healthy',
        latency,
        timestamp: Date.now()
      };
      
      this.healthChecks.set('database', healthCheck);
      return healthCheck;
      
    } catch (error) {
      timer();
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };
      
      this.healthChecks.set('database', healthCheck);
      logger.error('Database health check failed', error);
      return healthCheck;
    }
  }

  // API endpoint monitoring
  monitorApiEndpoint(endpoint: string, method: string, statusCode: number, duration: number) {
    this.recordMetric({
      name: 'api_request_duration',
      value: duration,
      timestamp: Date.now(),
      tags: {
        endpoint,
        method,
        status: statusCode.toString(),
        status_class: this.getStatusClass(statusCode)
      }
    });

    // Alert on errors
    if (statusCode >= 500) {
      logger.error(`API Error: ${method} ${endpoint}`, {
        statusCode,
        duration,
        endpoint,
        method
      });
    } else if (statusCode >= 400) {
      logger.warn(`API Client Error: ${method} ${endpoint}`, {
        statusCode,
        duration,
        endpoint,
        method
      });
    }
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }

  // Memory monitoring
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const memoryMetrics = {
        rss: usage.rss / 1024 / 1024, // MB
        heapTotal: usage.heapTotal / 1024 / 1024,
        heapUsed: usage.heapUsed / 1024 / 1024,
        external: usage.external / 1024 / 1024
      };

      // Log memory warnings
      if (memoryMetrics.heapUsed > 500) {
        logger.warn('High memory usage detected', memoryMetrics);
      }

      return memoryMetrics;
    }
    return null;
  }

  // Get system status
  getSystemStatus() {
    const memoryUsage = this.getMemoryUsage();
    const recentMetrics = this.metrics.slice(-100);
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length 
      : 0;

    return {
      timestamp: Date.now(),
      status: this.getOverallStatus(),
      healthChecks: Array.from(this.healthChecks.values()),
      metrics: {
        avgResponseTime: avgResponseTime.toFixed(2),
        totalRequests: recentMetrics.length,
        memoryUsage
      }
    };
  }

  private getOverallStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const checks = Array.from(this.healthChecks.values());
    if (checks.length === 0) return 'healthy';
    
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  // Error rate monitoring
  trackErrorRate(endpoint: string, isError: boolean) {
    this.recordMetric({
      name: 'error_rate',
      value: isError ? 1 : 0,
      timestamp: Date.now(),
      tags: { endpoint }
    });
  }

  // Real-time metrics for dashboard
  getRealtimeMetrics() {
    const last5Minutes = Date.now() - (5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    
    const errorCount = recentMetrics
      .filter(m => m.name === 'error_rate' && m.value === 1).length;
    
    const requestCount = recentMetrics
      .filter(m => m.name === 'api_request_duration').length;
      
    const avgLatency = recentMetrics
      .filter(m => m.name === 'api_request_duration')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);

    return {
      timestamp: Date.now(),
      window: '5m',
      requestCount,
      errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) : '0.00',
      avgLatency: avgLatency.toFixed(2)
    };
  }
}

// Export singleton
export const monitoring = new MonitoringService();

// Middleware helper for automatic monitoring
export function withMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const timer = monitoring.startTimer(name);
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => timer()) as any;
      }
      
      timer();
      return result;
    } catch (error) {
      timer();
      monitoring.trackErrorRate(name, true);
      throw error;
    }
  }) as T;
}
