-- ==============================================
-- NOTIFICACIONES PUSH - FASE 1: SOLO CRÍTICAS
-- Sistema simplificado para matches y mensajes únicamente
-- ==============================================

-- 1. TABLA DE SUSCRIPCIONES PUSH (sin cambios)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- 2. PREFERENCIAS SIMPLIFICADAS - SOLO FASE 1
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- FASE 1: Solo críticas
    new_matches BOOLEAN DEFAULT true,
    new_messages BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HISTORIAL SIMPLIFICADO
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
    
    -- Tipo: solo 'new_match' o 'new_message' en Fase 1
    type TEXT NOT NULL CHECK (type IN ('new_match', 'new_message', 'test')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Estados
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    clicked_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'clicked')),
    error_message TEXT
);

-- ========================================
-- 4. POLÍTICAS RLS SIMPLIFICADAS
-- ========================================

-- Habilitar RLS en las tablas
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Políticas para push_subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- Políticas para notification_preferences
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- Políticas para notification_history
DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
CREATE POLICY "Users can view their own notification history"
ON notification_history FOR SELECT
USING (auth.uid() = user_id);

-- ========================================
-- 5. ÍNDICES OPTIMIZADOS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active 
ON push_subscriptions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_date 
ON notification_history(user_id, sent_at DESC);

-- ========================================
-- 6. FUNCIÓN PARA PREFERENCIAS POR DEFECTO
-- ========================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS create_default_notification_preferences(UUID);

-- Crear nueva función
CREATE OR REPLACE FUNCTION create_default_notification_preferences(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification_preferences (
        user_id, 
        new_matches, 
        new_messages
    )
    VALUES (
        user_id_param, 
        true,  -- new_matches habilitado por defecto
        true   -- new_messages habilitado por defecto
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. FUNCIÓN PARA ESTADÍSTICAS BÁSICAS
-- ========================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS get_notification_stats(UUID);

-- Crear nueva función con tipo de retorno correcto
CREATE OR REPLACE FUNCTION get_notification_stats(user_id_param UUID)
RETURNS TABLE(
    total_sent BIGINT,
    total_clicked BIGINT,
    click_rate INTEGER,
    last_notification TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sent,
        COUNT(clicked_at) as total_clicked,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(clicked_at)::numeric / COUNT(*)::numeric) * 100)::integer
            ELSE 0
        END as click_rate,
        MAX(sent_at) as last_notification
    FROM notification_history 
    WHERE notification_history.user_id = user_id_param
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. FUNCIÓN DE LIMPIEZA (OPCIONAL)
-- ========================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS cleanup_inactive_subscriptions();

-- Crear nueva función
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

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
SELECT 'Configuración de Notificaciones Push Fase 1 completada exitosamente' as status;
