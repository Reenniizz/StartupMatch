// app/api/metrics/route.ts - Dashboard de métricas para administradores
import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring';
import { rateLimiter } from '@/lib/rate-limiting';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const timer = monitoring.startTimer('metrics_dashboard');
  
  try {
    // Check if user is admin (basic check for now)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    logger.info('Metrics dashboard accessed');
    
    // Get comprehensive system metrics
    const systemStatus = monitoring.getSystemStatus();
    const realtimeMetrics = monitoring.getRealtimeMetrics();
    const rateLimitStats = rateLimiter.getStats();
    const memoryUsage = monitoring.getMemoryUsage();
    
    // Database statistics
    const dbStats = await getDatabaseStats();
    
    // Application statistics  
    const appStats = await getApplicationStats();
    
    const metricsData = {
      timestamp: new Date().toISOString(),
      overview: {
        status: systemStatus.status,
        uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      },
      performance: {
        memory: memoryUsage,
        realtime: realtimeMetrics,
        system: systemStatus.metrics
      },
      security: {
        rateLimiting: rateLimitStats,
        authEnabled: true,
        securityHeaders: true,
        cspEnabled: true
      },
      database: dbStats,
      application: appStats,
      monitoring: {
        healthChecks: systemStatus.healthChecks,
        lastUpdated: new Date().toISOString()
      }
    };
    
    timer();
    
    return NextResponse.json(metricsData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Dashboard': 'true'
      }
    });
    
  } catch (error) {
    timer();
    logger.error('Metrics dashboard error', error as Error);
    
    return NextResponse.json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getDatabaseStats() {
  try {
    // Get table counts and basic statistics
    const [profiles, projects, connections, messages, conversations] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('connection_requests').select('id', { count: 'exact', head: true }),
      supabase.from('private_messages').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id', { count: 'exact', head: true })
    ]);
    
    return {
      status: 'healthy',
      tables: {
        user_profiles: profiles.count || 0,
        projects: projects.count || 0,
        connection_requests: connections.count || 0,
        private_messages: messages.count || 0,
        conversations: conversations.count || 0
      },
      totalRecords: (profiles.count || 0) + (projects.count || 0) + 
                   (connections.count || 0) + (messages.count || 0) + 
                   (conversations.count || 0),
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('Database stats error', error as Error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
      lastChecked: new Date().toISOString()
    };
  }
}

async function getApplicationStats() {
  try {
    // Application-specific metrics
    const stats = {
      features: {
        authentication: { enabled: true, provider: 'supabase' },
        realTimeMessaging: { enabled: true, provider: 'supabase' },
        fileUpload: { enabled: true, provider: 'supabase-storage' },
        notifications: { enabled: true, type: 'push' },
        matching: { enabled: true, algorithm: 'skills-based' },
        groups: { enabled: true, type: 'collaborative' }
      },
      infrastructure: {
        hosting: 'vercel',
        database: 'supabase-postgresql',
        storage: 'supabase-storage',
        cdn: 'vercel-edge-network',
        monitoring: 'custom-implementation'
      },
      security: {
        rls: { enabled: true, policies: 'comprehensive' },
        authentication: { method: 'jwt', provider: 'supabase' },
        authorization: { rbac: true, middleware: true },
        rateLimit: { enabled: true, strategy: 'sliding-window' },
        headers: { csp: true, cors: true, security: true }
      },
      codebase: {
        framework: 'next.js-15',
        language: 'typescript',
        styling: 'tailwindcss',
        stateManagement: 'react-hooks',
        testing: 'planned',
        documentation: 'comprehensive'
      }
    };
    
    return stats;
    
  } catch (error) {
    logger.error('Application stats error', error as Error);
    return {
      error: error instanceof Error ? error.message : 'Unknown application error'
    };
  }
}

// POST endpoint para admin actions
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { action } = await request.json();
    
    switch (action) {
      case 'clear-rate-limits':
        rateLimiter.clear();
        logger.info('Rate limits cleared by admin');
        return NextResponse.json({ success: true, message: 'Rate limits cleared' });
        
      case 'trigger-health-check':
        await monitoring.monitorDatabase();
        logger.info('Health check triggered by admin');
        return NextResponse.json({ success: true, message: 'Health check triggered' });
        
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    logger.error('Admin action error', error as Error);
    return NextResponse.json({
      error: 'Failed to execute admin action',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
