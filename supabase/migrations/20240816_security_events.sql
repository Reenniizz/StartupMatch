-- Security Events Table Migration
-- Almacena todos los eventos de seguridad para auditoría y monitoreo

CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  endpoint TEXT,
  http_method TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
  description TEXT,
  geolocation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas de seguridad
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_composite ON security_events(event_type, ip_address, created_at);

-- Índice para consultas de análisis de amenazas
CREATE INDEX IF NOT EXISTS idx_security_events_threat_analysis 
  ON security_events(ip_address, event_type, created_at) 
  WHERE severity IN ('HIGH', 'CRITICAL');

-- RLS Policies para security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los eventos de seguridad
CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (
    auth.jwt() ->> 'user_role' = 'admin'
    OR 
    auth.jwt() ->> 'user_role' = 'security_admin'
  );

-- Los usuarios pueden ver solo sus propios eventos (no críticos)
CREATE POLICY "Users can view their own non-critical security events"
  ON security_events FOR SELECT
  USING (
    user_id = auth.uid() 
    AND severity NOT IN ('CRITICAL', 'HIGH')
  );

-- Solo el sistema puede insertar eventos de seguridad
CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (true); -- Will be restricted by service key access

-- Función para limpiar eventos antiguos (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  -- Mantener eventos críticos por 7 años, otros por 2 años
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND severity NOT IN ('HIGH', 'CRITICAL');
    
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para detectar patrones sospechosos automáticamente
CREATE OR REPLACE FUNCTION detect_suspicious_patterns()
RETURNS TRIGGER AS $$
DECLARE
  failed_attempts INTEGER;
  recent_ips INTEGER;
BEGIN
  -- Detectar intentos de fuerza bruta
  IF NEW.event_type = 'AUTH_FAILED' THEN
    SELECT COUNT(*) INTO failed_attempts
    FROM security_events 
    WHERE ip_address = NEW.ip_address
      AND event_type = 'AUTH_FAILED'
      AND created_at > NOW() - INTERVAL '15 minutes';
      
    -- Si hay más de 5 intentos fallidos, crear evento de actividad sospechosa
    IF failed_attempts >= 5 THEN
      INSERT INTO security_events (
        event_type, ip_address, user_agent, severity, description,
        metadata, created_at
      ) VALUES (
        'SUSPICIOUS_ACTIVITY',
        NEW.ip_address,
        NEW.user_agent,
        'HIGH',
        'Brute force attack detected',
        jsonb_build_object('failed_attempts', failed_attempts),
        NOW()
      );
    END IF;
  END IF;
  
  -- Detectar múltiples IPs para un usuario
  IF NEW.event_type = 'AUTH_SUCCESS' AND NEW.user_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT ip_address) INTO recent_ips
    FROM security_events 
    WHERE user_id = NEW.user_id
      AND event_type = 'AUTH_SUCCESS'
      AND created_at > NOW() - INTERVAL '24 hours';
      
    -- Si el usuario se conecta desde más de 5 IPs diferentes en 24h
    IF recent_ips > 5 THEN
      INSERT INTO security_events (
        event_type, user_id, ip_address, user_agent, severity, description,
        metadata, created_at
      ) VALUES (
        'SUSPICIOUS_ACTIVITY',
        NEW.user_id,
        NEW.ip_address,
        NEW.user_agent,
        'MEDIUM',
        'Multiple IP addresses detected for user',
        jsonb_build_object('ip_count', recent_ips),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar el trigger
DROP TRIGGER IF EXISTS trigger_detect_suspicious_patterns ON security_events;
CREATE TRIGGER trigger_detect_suspicious_patterns
  AFTER INSERT ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_patterns();

-- Vista para métricas de seguridad
CREATE OR REPLACE VIEW security_metrics AS
WITH event_counts AS (
  SELECT 
    event_type,
    severity,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as event_count
  FROM security_events 
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY event_type, severity, DATE_TRUNC('hour', created_at)
),
top_ips AS (
  SELECT 
    ip_address,
    COUNT(*) as event_count,
    COUNT(DISTINCT event_type) as event_types
  FROM security_events 
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND severity IN ('HIGH', 'CRITICAL')
  GROUP BY ip_address
  ORDER BY event_count DESC
  LIMIT 10
)
SELECT 
  'event_summary' as metric_type,
  jsonb_build_object(
    'total_events', (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'),
    'critical_events', (SELECT COUNT(*) FROM security_events WHERE severity = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours'),
    'high_events', (SELECT COUNT(*) FROM security_events WHERE severity = 'HIGH' AND created_at > NOW() - INTERVAL '24 hours'),
    'auth_failures', (SELECT COUNT(*) FROM security_events WHERE event_type = 'AUTH_FAILED' AND created_at > NOW() - INTERVAL '24 hours'),
    'suspicious_activity', (SELECT COUNT(*) FROM security_events WHERE event_type = 'SUSPICIOUS_ACTIVITY' AND created_at > NOW() - INTERVAL '24 hours'),
    'top_risk_ips', (SELECT jsonb_agg(row_to_json(top_ips)) FROM top_ips)
  ) as metrics,
  NOW() as generated_at

UNION ALL

SELECT 
  'hourly_breakdown' as metric_type,
  jsonb_agg(
    jsonb_build_object(
      'hour', hour,
      'event_type', event_type,
      'severity', severity,
      'count', event_count
    )
  ) as metrics,
  NOW() as generated_at
FROM event_counts;

-- Función para obtener métricas de seguridad
CREATE OR REPLACE FUNCTION get_security_dashboard(timeframe TEXT DEFAULT '24h')
RETURNS TABLE(
  total_events BIGINT,
  auth_failures BIGINT,
  suspicious_activities BIGINT,
  critical_events BIGINT,
  top_risk_ips JSONB
) AS $$
DECLARE
  interval_period INTERVAL;
BEGIN
  -- Convertir timeframe a intervalo
  CASE timeframe
    WHEN '1h' THEN interval_period := INTERVAL '1 hour';
    WHEN '24h' THEN interval_period := INTERVAL '24 hours';
    WHEN '7d' THEN interval_period := INTERVAL '7 days';
    ELSE interval_period := INTERVAL '24 hours';
  END CASE;

  RETURN QUERY
  WITH metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE true) as total,
      COUNT(*) FILTER (WHERE event_type = 'AUTH_FAILED') as auth_fails,
      COUNT(*) FILTER (WHERE event_type = 'SUSPICIOUS_ACTIVITY') as suspicious,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical,
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'ip', ip_address,
          'events', COUNT(*) FILTER (WHERE severity IN ('HIGH', 'CRITICAL'))
        )
      ) FILTER (WHERE severity IN ('HIGH', 'CRITICAL')) as risk_ips
    FROM security_events 
    WHERE created_at > NOW() - interval_period
    GROUP BY ip_address
  )
  SELECT 
    SUM(total)::BIGINT,
    SUM(auth_fails)::BIGINT,
    SUM(suspicious)::BIGINT,
    SUM(critical)::BIGINT,
    jsonb_agg(risk_ips) as top_ips
  FROM metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
