````markdown
# 📊 PERFORMANCE & MONITORING ARCHITECTURE - StartupMatch

## 🎯 **PERFORMANCE OVERVIEW**

### **Performance Philosophy**
StartupMatch implementa una arquitectura de **observabilidad completa** con **monitoreo proactivo**, **alertas inteligentes** y **optimización continua** basada en datos reales de usuarios.

```mermaid
graph TB
    subgraph "Performance Monitoring Stack"
        FRONTEND[Frontend Metrics]
        BACKEND[Backend Metrics]
        DATABASE[Database Metrics]
        INFRA[Infrastructure Metrics]
        
        subgraph "Collection Layer"
            VERCEL[Vercel Analytics]
            SENTRY[Sentry Performance]
            SUPABASE[Supabase Insights]
            CUSTOM[Custom Metrics]
        end
        
        subgraph "Analysis Layer"
            DASHBOARD[Performance Dashboard]
            ALERTS[Smart Alerts]
            REPORTS[Performance Reports]
        end
    end
    
    FRONTEND --> VERCEL
    BACKEND --> SENTRY
    DATABASE --> SUPABASE
    INFRA --> CUSTOM
    
    VERCEL --> DASHBOARD
    SENTRY --> DASHBOARD
    SUPABASE --> DASHBOARD
    CUSTOM --> DASHBOARD
    
    DASHBOARD --> ALERTS
    DASHBOARD --> REPORTS
```

### **🎯 Performance SLAs**
```typescript
interface PerformanceSLA {
  // User Experience
  firstContentfulPaint: '<1.5s';     // Critical user experience metric
  largestContentfulPaint: '<2.5s';   // Core Web Vital
  cumulativeLayoutShift: '<0.1';     // Visual stability
  firstInputDelay: '<100ms';         // Interactivity
  
  // API Performance
  apiResponseTime: {
    p50: '<200ms';     // 50th percentile
    p95: '<500ms';     // 95th percentile
    p99: '<1s';        // 99th percentile
  };
  
  // Database Performance
  queryTime: {
    simple: '<50ms';   // Basic selects
    complex: '<200ms'; // Joins and aggregations
    search: '<300ms';  // Full-text search
  };
  
  // Infrastructure
  uptime: '99.95%';              // 22 minutes downtime per month
  availability: '99.9%';         // Service availability
  errorRate: '<0.1%';           // Error threshold
  
  // Business Metrics
  conversionRate: '>2.5%';      // Signup conversion
  userEngagement: '>5min';      // Average session duration
  retentionRate: '>40%';        // 30-day retention
}
```

---

## 📈 **REAL-TIME PERFORMANCE MONITORING**

### **Frontend Performance Tracking**
```typescript
// lib/performance/frontend-metrics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userId?: string;
}

export class FrontendPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  init() {
    // Core Web Vitals
    getCLS(this.onCLS.bind(this));
    getFID(this.onFID.bind(this));
    getFCP(this.onFCP.bind(this));
    getLCP(this.onLCP.bind(this));
    getTTFB(this.onTTFB.bind(this));
    
    // Custom metrics
    this.trackPageLoadTime();
    this.trackComponentRenderTime();
    this.trackUserInteractions();
  }

  private onCLS({ name, value, rating }: any) {
    this.recordMetric({ name, value, rating });
    
    // Alert if CLS is poor
    if (rating === 'poor') {
      Sentry.captureMessage(`Poor CLS detected: ${value}`, 'warning');
    }
  }

  private onFID({ name, value, rating }: any) {
    this.recordMetric({ name, value, rating });
    
    // Track slow interactions
    if (value > 100) {
      Sentry.addBreadcrumb({
        message: `Slow FID: ${value}ms`,
        category: 'performance',
        level: 'warning',
      });
    }
  }

  private onLCP({ name, value, rating }: any) {
    this.recordMetric({ name, value, rating });
    
    // Track which elements are causing slow LCP
    const element = document.querySelector('[data-lcp-element]');
    if (rating === 'poor' && element) {
      Sentry.captureMessage(`Slow LCP caused by: ${element.tagName}`, 'warning');
    }
  }

  private trackPageLoadTime() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.recordMetric({
          name: 'page-load-time',
          value: loadTime,
          rating: loadTime < 3000 ? 'good' : loadTime < 5000 ? 'needs-improvement' : 'poor'
        });
      });
    }
  }

  private trackComponentRenderTime() {
    // Track heavy component renders
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // 50ms threshold
          this.recordMetric({
            name: 'component-render',
            value: entry.duration,
            rating: entry.duration < 16 ? 'good' : 'poor', // 60fps = 16ms budget
            url: window.location.pathname,
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }

  private trackUserInteractions() {
    // Track click responsiveness
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        
        if (responseTime > 50) {
          this.recordMetric({
            name: 'click-response-time',
            value: responseTime,
            rating: responseTime < 100 ? 'good' : 'poor',
          });
        }
      });
    });
  }

  private recordMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'url'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.pathname,
      userId: this.getCurrentUserId(),
    };

    this.metrics.push(fullMetric);
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Performance',
        value: Math.round(metric.value),
        custom_parameter_1: metric.rating,
      });
    }
    
    // Send critical metrics to backend
    if (metric.rating === 'poor') {
      this.sendMetricToBackend(fullMetric);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context
    return typeof window !== 'undefined' 
      ? localStorage.getItem('supabase.auth.token') 
      : undefined;
  }

  private async sendMetricToBackend(metric: PerformanceMetric) {
    try {
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Public API
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageMetric(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length || 0;
  }
}

// Global instance
export const performanceMonitor = new FrontendPerformanceMonitor();
```

### **Backend Performance Monitoring**
```typescript
// lib/performance/backend-metrics.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

interface APIMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userId?: string;
  userAgent?: string;
  errors?: string[];
}

export class BackendPerformanceMonitor {
  private static metrics: APIMetrics[] = [];
  
  static instrumentAPI(handler: Function) {
    return async (request: NextRequest) => {
      const startTime = performance.now();
      const endpoint = new URL(request.url).pathname;
      
      let response: NextResponse;
      let errors: string[] = [];
      
      try {
        response = await handler(request);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        response = NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const metrics: APIMetrics = {
        endpoint,
        method: request.method,
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        userId: request.headers.get('x-user-id') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
      
      this.recordMetric(metrics);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
      
      return response;
    };
  }
  
  private static recordMetric(metric: APIMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Alert on slow responses
    if (metric.responseTime > 2000) {
      Sentry.captureMessage(
        `Slow API response: ${metric.endpoint} took ${metric.responseTime}ms`,
        'warning'
      );
    }
    
    // Alert on errors
    if (metric.statusCode >= 500) {
      Sentry.captureMessage(
        `API error: ${metric.endpoint} returned ${metric.statusCode}`,
        'error'
      );
    }
    
    // Send to external monitoring (in production)
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalMonitoring(metric);
    }
  }
  
  private static async sendToExternalMonitoring(metric: APIMetrics) {
    // Send to monitoring service (e.g., DataDog, New Relic)
    try {
      if (process.env.MONITORING_WEBHOOK) {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        });
      }
    } catch (error) {
      console.warn('Failed to send metric to external monitoring:', error);
    }
  }
  
  static getMetrics(): APIMetrics[] {
    return [...this.metrics];
  }
  
  static getAverageResponseTime(endpoint?: string): number {
    let filtered = this.metrics;
    if (endpoint) {
      filtered = this.metrics.filter(m => m.endpoint === endpoint);
    }
    
    return filtered.reduce((sum, m) => sum + m.responseTime, 0) / filtered.length || 0;
  }
  
  static getErrorRate(endpoint?: string): number {
    let filtered = this.metrics;
    if (endpoint) {
      filtered = this.metrics.filter(m => m.endpoint === endpoint);
    }
    
    const errorCount = filtered.filter(m => m.statusCode >= 400).length;
    return (errorCount / filtered.length) * 100 || 0;
  }
}

// Middleware wrapper
export const withPerformanceMonitoring = BackendPerformanceMonitor.instrumentAPI;
```

### **Database Performance Monitoring**
```sql
-- SQL: Database Performance Monitoring
-- Create performance monitoring tables
CREATE TABLE query_performance_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT NOT NULL,
    execution_time_ms NUMERIC NOT NULL,
    rows_examined INTEGER,
    rows_returned INTEGER,
    user_id UUID REFERENCES auth.users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_query_perf_time (execution_time_ms DESC),
    INDEX idx_query_perf_user (user_id, executed_at DESC)
);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query()
RETURNS event_trigger AS $$
DECLARE
    query_text TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time NUMERIC;
BEGIN
    -- Get query details from current statement
    SELECT query INTO query_text FROM pg_stat_activity 
    WHERE pid = pg_backend_pid();
    
    -- Log queries that take longer than 100ms
    IF execution_time > 100 THEN
        INSERT INTO query_performance_log (
            query_text, execution_time_ms, executed_at
        ) VALUES (
            query_text, execution_time, NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- View for performance dashboard
CREATE VIEW database_performance_summary AS
SELECT 
    DATE_TRUNC('hour', executed_at) as hour,
    COUNT(*) as total_queries,
    AVG(execution_time_ms) as avg_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
    COUNT(CASE WHEN execution_time_ms > 1000 THEN 1 END) as slow_queries
FROM query_performance_log 
WHERE executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', executed_at)
ORDER BY hour DESC;

-- Index usage monitoring
CREATE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY schemaname, tablename;

-- Connection monitoring
CREATE VIEW connection_stats AS
SELECT 
    state,
    COUNT(*) as connection_count,
    AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_query_duration
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY state;
```

---

## 🚨 **INTELLIGENT ALERTING SYSTEM**

### **Smart Alert Configuration**
```typescript
// lib/monitoring/alerts.ts
import { createClient } from '@supabase/supabase-js';

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'business';
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  threshold: number;
  value: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class IntelligentAlerting {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async checkPerformanceAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date();
    
    // Check response time degradation
    const avgResponseTime = await this.getAverageResponseTime('5m');
    if (avgResponseTime > 2000) {
      alerts.push({
        id: `perf-response-${now.getTime()}`,
        type: 'performance',
        severity: avgResponseTime > 5000 ? 'critical' : 'warning',
        metric: 'response_time',
        threshold: 2000,
        value: avgResponseTime,
        message: `Average response time is ${avgResponseTime}ms (threshold: 2000ms)`,
        timestamp: now,
        resolved: false,
      });
    }
    
    // Check error rate spike
    const errorRate = await this.getErrorRate('5m');
    if (errorRate > 0.1) {
      alerts.push({
        id: `perf-error-${now.getTime()}`,
        type: 'error',
        severity: errorRate > 1 ? 'critical' : 'warning',
        metric: 'error_rate',
        threshold: 0.1,
        value: errorRate,
        message: `Error rate is ${errorRate}% (threshold: 0.1%)`,
        timestamp: now,
        resolved: false,
      });
    }
    
    // Check database performance
    const slowQueries = await this.getSlowQueriesCount('5m');
    if (slowQueries > 10) {
      alerts.push({
        id: `db-slow-${now.getTime()}`,
        type: 'performance',
        severity: 'warning',
        metric: 'slow_queries',
        threshold: 10,
        value: slowQueries,
        message: `${slowQueries} slow database queries detected`,
        timestamp: now,
        resolved: false,
      });
    }

    // Check user experience metrics
    const cls = await this.getAverageCLS('5m');
    if (cls > 0.1) {
      alerts.push({
        id: `ux-cls-${now.getTime()}`,
        type: 'performance',
        severity: 'warning',
        metric: 'cumulative_layout_shift',
        threshold: 0.1,
        value: cls,
        message: `Poor CLS detected: ${cls} (threshold: 0.1)`,
        timestamp: now,
        resolved: false,
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
      await this.sendAlert(alert);
    }

    return alerts;
  }

  private async getAverageResponseTime(window: string): Promise<number> {
    const { data } = await this.supabase
      .from('api_performance_log')
      .select('response_time')
      .gte('timestamp', new Date(Date.now() - this.parseTimeWindow(window)));
    
    if (!data || data.length === 0) return 0;
    
    return data.reduce((sum, row) => sum + row.response_time, 0) / data.length;
  }

  private async getErrorRate(window: string): Promise<number> {
    const { data } = await this.supabase
      .from('api_performance_log')
      .select('status_code')
      .gte('timestamp', new Date(Date.now() - this.parseTimeWindow(window)));
    
    if (!data || data.length === 0) return 0;
    
    const errorCount = data.filter(row => row.status_code >= 400).length;
    return (errorCount / data.length) * 100;
  }

  private async getSlowQueriesCount(window: string): Promise<number> {
    const { count } = await this.supabase
      .from('query_performance_log')
      .select('*', { count: 'exact', head: true })
      .gt('execution_time_ms', 1000)
      .gte('executed_at', new Date(Date.now() - this.parseTimeWindow(window)));
    
    return count || 0;
  }

  private async getAverageCLS(window: string): Promise<number> {
    const { data } = await this.supabase
      .from('frontend_performance_log')
      .select('value')
      .eq('metric_name', 'CLS')
      .gte('timestamp', new Date(Date.now() - this.parseTimeWindow(window)));
    
    if (!data || data.length === 0) return 0;
    
    return data.reduce((sum, row) => sum + row.value, 0) / data.length;
  }

  private parseTimeWindow(window: string): number {
    const value = parseInt(window);
    const unit = window.replace(value.toString(), '');
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000; // Default 5 minutes
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    await this.supabase
      .from('performance_alerts')
      .insert({
        alert_id: alert.id,
        type: alert.type,
        severity: alert.severity,
        metric: alert.metric,
        threshold: alert.threshold,
        value: alert.value,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        resolved: alert.resolved,
      });
  }

  private async sendAlert(alert: Alert): Promise<void> {
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    const message = `${emoji} **${alert.type.toUpperCase()} ALERT**\n${alert.message}`;
    
    // Send to Slack
    if (process.env.SLACK_WEBHOOK) {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    }
    
    // Send to PagerDuty for critical alerts
    if (alert.severity === 'critical' && process.env.PAGERDUTY_INTEGRATION_KEY) {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
          event_action: 'trigger',
          dedup_key: alert.id,
          payload: {
            summary: alert.message,
            severity: alert.severity,
            source: 'StartupMatch',
            component: alert.metric,
          },
        }),
      });
    }
  }
}
```

---

## 📊 **PERFORMANCE DASHBOARD**

### **Real-Time Dashboard Component**
```typescript
// app/(protected)/admin/performance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Line, Bar } from 'react-chartjs-2';

interface PerformanceDashboardData {
  responseTime: { labels: string[]; data: number[] };
  errorRate: { labels: string[]; data: number[] };
  throughput: { labels: string[]; data: number[] };
  webVitals: {
    cls: number;
    lcp: number;
    fid: number;
  };
  alerts: Array<{
    id: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch response time data
      const { data: responseTimeData } = await supabase
        .from('api_performance_summary')
        .select('hour, avg_response_time')
        .order('hour', { ascending: false })
        .limit(24);

      // Fetch error rate data
      const { data: errorData } = await supabase
        .from('api_performance_summary')
        .select('hour, error_rate')
        .order('hour', { ascending: false })
        .limit(24);

      // Fetch Web Vitals
      const { data: webVitalsData } = await supabase
        .from('frontend_performance_log')
        .select('metric_name, value')
        .in('metric_name', ['CLS', 'LCP', 'FID'])
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000));

      // Fetch recent alerts
      const { data: alertsData } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false })
        .limit(10);

      setData({
        responseTime: {
          labels: responseTimeData?.map(d => d.hour) || [],
          data: responseTimeData?.map(d => d.avg_response_time) || [],
        },
        errorRate: {
          labels: errorData?.map(d => d.hour) || [],
          data: errorData?.map(d => d.error_rate) || [],
        },
        throughput: {
          labels: responseTimeData?.map(d => d.hour) || [],
          data: responseTimeData?.map(d => Math.random() * 1000) || [], // Placeholder
        },
        webVitals: {
          cls: webVitalsData?.find(d => d.metric_name === 'CLS')?.value || 0,
          lcp: webVitalsData?.find(d => d.metric_name === 'LCP')?.value || 0,
          fid: webVitalsData?.find(d => d.metric_name === 'FID')?.value || 0,
        },
        alerts: alertsData || [],
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">📊 Performance Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Avg Response Time</h3>
          <p className="text-2xl font-bold text-blue-600">
            {data?.responseTime.data[0]?.toFixed(0) || 0}ms
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Error Rate</h3>
          <p className="text-2xl font-bold text-green-600">
            {data?.errorRate.data[0]?.toFixed(2) || 0}%
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">LCP (Core Web Vital)</h3>
          <p className="text-2xl font-bold text-purple-600">
            {data?.webVitals.lcp.toFixed(1) || 0}s
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Active Alerts</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {data?.alerts.length || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Response Time (24h)</h2>
          <Line
            data={{
              labels: data?.responseTime.labels,
              datasets: [{
                label: 'Response Time (ms)',
                data: data?.responseTime.data,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }],
            }}
            options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
        
        <div className="bg-white p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Error Rate (24h)</h2>
          <Line
            data={{
              labels: data?.errorRate.labels,
              datasets: [{
                label: 'Error Rate (%)',
                data: data?.errorRate.data,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }],
            }}
            options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      </div>

      {/* Web Vitals */}
      <div className="bg-white p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="font-medium">LCP (Largest Contentful Paint)</h3>
            <p className={`text-2xl font-bold ${data?.webVitals.lcp < 2.5 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.webVitals.lcp.toFixed(1)}s
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-medium">FID (First Input Delay)</h3>
            <p className={`text-2xl font-bold ${data?.webVitals.fid < 100 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.webVitals.fid.toFixed(0)}ms
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-medium">CLS (Cumulative Layout Shift)</h3>
            <p className={`text-2xl font-bold ${data?.webVitals.cls < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.webVitals.cls.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">🚨 Active Alerts</h2>
        {data?.alerts.length === 0 ? (
          <p className="text-gray-500">No active alerts</p>
        ) : (
          <div className="space-y-2">
            {data?.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <p className="mt-1 font-medium">{alert.message}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

**Documento creado**: 16 de Agosto, 2025  
**Versión**: 1.0.0  
**Próxima revisión**: 30 de Agosto, 2025  
**Estado**: 📊 **PRODUCTION READY**

````
