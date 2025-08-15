// app/api/health/route.ts - Health check endpoint avanzado
import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';
import { rateLimiter } from '@/lib/rate-limiting';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for health checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const timer = monitoring.startTimer('health_check');
  const startTime = Date.now();
  
  try {
    logger.info('Health check started');
    
    // Check database connection
    const dbHealth = await checkDatabase();
    
    // Check system resources
    const systemHealth = await checkSystem();
    
    // Get monitoring stats
    const monitoringStats = monitoring.getSystemStatus();
    
    // Get rate limiting stats
    const rateLimitStats = rateLimiter.getStats();
    
    // Get realtime metrics
    const realtimeMetrics = monitoring.getRealtimeMetrics();
    
    // Determine overall health
    const isHealthy = dbHealth.status === 'healthy' && systemHealth.status === 'healthy';
    const status = isHealthy ? 'healthy' : 
                  (dbHealth.status === 'degraded' || systemHealth.status === 'degraded') ? 'degraded' : 
                  'unhealthy';
    
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbHealth,
        system: systemHealth
      },
      metrics: {
        monitoring: monitoringStats,
        rateLimiting: rateLimitStats,
        realtime: realtimeMetrics
      },
      services: {
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
          status: dbHealth.status
        },
        middleware: {
          status: 'active',
          features: ['auth', 'rate-limiting', 'security-headers', 'monitoring']
        }
      }
    };
    
    timer();
    
    const responseCode = status === 'healthy' ? 200 : 
                        status === 'degraded' ? 207 : 503;
    
    logger.info('Health check completed', {
      status,
      duration: Date.now() - startTime,
      responseCode
    });
    
    return NextResponse.json(healthData, { 
      status: responseCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
    
  } catch (error) {
    timer();
    logger.error('Health check failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: { status: 'unknown', error: 'Health check failed' },
        system: { status: 'unknown', error: 'Health check failed' }
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
  }
}

async function checkDatabase() {
  try {
    const start = performance.now();
    
    // Simple query to check database connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
      
    const latency = performance.now() - start;
    
    if (error) {
      logger.warn('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy' as const,
        latency: Math.round(latency),
        error: error.message,
        timestamp: Date.now()
      };
    }
    
    const status = latency > 1000 ? 'degraded' : 'healthy';
    
    return {
      status: status as 'healthy' | 'degraded',
      latency: Math.round(latency),
      timestamp: Date.now(),
      details: {
        queryExecuted: true,
        responseTime: `${Math.round(latency)}ms`
      }
    };
    
  } catch (error) {
    logger.error('Database health check error', error as Error);
    return {
      status: 'unhealthy' as const,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: Date.now()
    };
  }
}

async function checkSystem() {
  try {
    const memoryUsage = monitoring.getMemoryUsage();
    
    // Check memory usage thresholds
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];
    
    if (memoryUsage) {
      // Alert if heap usage > 80% of total
      const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (heapUsagePercent > 90) {
        status = 'unhealthy';
        issues.push(`Critical memory usage: ${heapUsagePercent.toFixed(1)}%`);
      } else if (heapUsagePercent > 80) {
        status = 'degraded';
        issues.push(`High memory usage: ${heapUsagePercent.toFixed(1)}%`);
      }
      
      // Check absolute memory usage
      if (memoryUsage.heapUsed > 1000) { // > 1GB
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
        issues.push(`High absolute memory usage: ${memoryUsage.heapUsed.toFixed(0)}MB`);
      }
    }
    
    return {
      status,
      timestamp: Date.now(),
      memoryUsage,
      issues: issues.length > 0 ? issues : undefined,
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    };
    
  } catch (error) {
    logger.error('System health check error', error as Error);
    return {
      status: 'unhealthy' as const,
      error: error instanceof Error ? error.message : 'Unknown system error',
      timestamp: Date.now()
    };
  }
}
