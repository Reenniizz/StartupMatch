-- ==============================================
-- SISTEMA DE NOTIFICACIONES PUSH - CONFIGURACIÓN DE BASE DE DATOS
-- Crear todas las tablas necesarias para el sistema de notificaciones
-- ==============================================

-- ========================================
-- 1. TABLA: push_subscriptions
-- Almacena las suscripciones de notificaciones push de cada usuario
-- ========================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL, -- URL del servidor push (Google, Mozilla, etc.)
    p256dh TEXT NOT NULL,   -- Clave pública para encriptar mensajes
    auth TEXT NOT NULL,     -- Token de autenticación
    user_agent TEXT,        -- Información del navegador/dispositivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true, -- Si la suscripción sigue activa
    
    -- Un usuario puede tener múltiples suscripciones (diferentes dispositivos)
    -- pero cada endpoint debe ser único por usuario
    UNIQUE(user_id, endpoint)
);

-- ========================================
-- 2. TABLA: notification_preferences  
-- Preferencias de notificaciones por usuario
-- ========================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    
    -- Tipos de notificaciones que el usuario quiere recibir
    new_matches BOOLEAN DEFAULT true,           -- Cuando hay nuevos matches
    new_messages BOOLEAN DEFAULT true,          -- Mensajes nuevos
    connection_requests BOOLEAN DEFAULT true,   -- Solicitudes de conexión
    connection_accepted BOOLEAN DEFAULT true,   -- Cuando aceptan tu solicitud
    weekly_summary BOOLEAN DEFAULT true,        -- Resumen semanal de actividad
    marketing BOOLEAN DEFAULT false,            -- Emails promocionales
    
    -- Configuración de horarios (para evitar spam nocturno)
    quiet_hours_start TIME DEFAULT '22:00',    -- No enviar después de esta hora
    quiet_hours_end TIME DEFAULT '08:00',      -- No enviar antes de esta hora
    timezone TEXT DEFAULT 'UTC',               -- Zona horaria del usuario
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. TABLA: notification_history
-- Historial de todas las notificaciones enviadas
-- ========================================
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información de la notificación
    type VARCHAR(50) NOT NULL,  -- 'new_match', 'new_message', 'connection_request', etc.
    title TEXT NOT NULL,        -- Título de la notificación
    body TEXT NOT NULL,         -- Contenido de la notificación
    data JSONB,                 -- Datos adicionales (URLs, IDs, etc.)
    
    -- Tracking y analytics
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,     -- Cuando se entregó
    clicked_at TIMESTAMP WITH TIME ZONE,       -- Cuando el usuario hizo clic
    status VARCHAR(20) DEFAULT 'sent',         -- 'sent', 'delivered', 'clicked', 'failed'
    
    -- Para debugging
    error_message TEXT,         -- Si falló, por qué
    push_endpoint TEXT,         -- A qué endpoint se envió
    
    -- Índices para consultas rápidas
    CONSTRAINT valid_status CHECK (status IN ('sent', 'delivered', 'clicked', 'failed'))
);

-- ========================================
-- 4. ÍNDICES para mejorar rendimiento
-- ========================================

-- Índice para buscar suscripciones activas por usuario
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active 
ON push_subscriptions(user_id, is_active);

-- Índice para buscar historial por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_notification_history_user_date 
ON notification_history(user_id, sent_at DESC);

-- Índice para buscar por tipo de notificación
CREATE INDEX IF NOT EXISTS idx_notification_history_type 
ON notification_history(type, sent_at DESC);

-- ========================================
-- 5. FUNCIONES para automatizar preferencias
-- ========================================

-- Función para crear preferencias por defecto cuando se registra un usuario
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear preferencias automáticamente
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ========================================
-- 6. FUNCIONES AUXILIARES
-- ========================================

-- Función para limpiar suscripciones inactivas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_inactive_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM push_subscriptions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de notificaciones
CREATE OR REPLACE FUNCTION get_notification_stats(user_id_param UUID)
RETURNS TABLE (
    total_sent INTEGER,
    total_clicked INTEGER,
    click_rate DECIMAL,
    last_notification TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sent,
        COUNT(clicked_at)::INTEGER as total_clicked,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(clicked_at)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as click_rate,
        MAX(sent_at) as last_notification
    FROM notification_history 
    WHERE user_id = user_id_param
    AND sent_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. RLS (Row Level Security) - SEGURIDAD
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: los usuarios solo pueden ver sus propios datos

-- Push subscriptions: solo el usuario puede ver/modificar sus suscripciones
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Notification preferences: solo el usuario puede ver/modificar sus preferencias
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Notification history: solo el usuario puede ver su historial
CREATE POLICY "Users can view their own notification history" ON notification_history
    FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 8. COMENTARIOS DE DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE push_subscriptions IS 'Almacena las suscripciones push de los usuarios para enviar notificaciones';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificaciones personalizadas por usuario';
COMMENT ON TABLE notification_history IS 'Historial completo de notificaciones enviadas para analytics';

COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL del servidor push proporcionada por el navegador';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Clave pública para encriptar el contenido de las notificaciones';
COMMENT ON COLUMN push_subscriptions.auth IS 'Token de autenticación para verificar el origen';

-- ========================================
-- 9. VERIFICACIÓN FINAL
-- ========================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'notification_preferences', 'notification_history')
ORDER BY tablename;

-- Mostrar mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA DE NOTIFICACIONES: Todas las tablas creadas exitosamente';
    RAISE NOTICE '📋 Tablas creadas: push_subscriptions, notification_preferences, notification_history';
    RAISE NOTICE '🔒 Seguridad: RLS habilitado en todas las tablas';
    RAISE NOTICE '⚡ Funciones: create_default_notification_preferences, cleanup_inactive_subscriptions, get_notification_stats';
END $$;
