-- Sistema Completo de Matches y Conexiones - StartupMatch
-- Compatible con esquema existente basado en docs/database/
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. NUEVAS TABLAS PARA SISTEMA DE CONEXIONES
-- ============================================

-- Tabla principal de conexiones entre usuarios
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  connection_type VARCHAR(20) DEFAULT 'general' CHECK (connection_type IN ('general', 'business', 'mentor', 'investor')),
  message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  responded_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_connection UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_connection CHECK (requester_id != addressee_id)
);

-- Tabla para match scoring y compatibilidad
CREATE TABLE IF NOT EXISTS match_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  skill_match_score INTEGER DEFAULT 0,
  location_match_score INTEGER DEFAULT 0,
  industry_match_score INTEGER DEFAULT 0,
  experience_match_score INTEGER DEFAULT 0,
  objective_match_score INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_match_score UNIQUE(user_id, matched_user_id),
  CONSTRAINT no_self_match CHECK (user_id != matched_user_id)
);

-- Tabla para tracking de interacciones (likes, views, etc.)
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('view', 'like', 'dislike', 'bookmark', 'block')),
  created_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_user_interaction UNIQUE(user_id, target_user_id, interaction_type)
);

-- Tabla para notificaciones de conexiones
CREATE TABLE IF NOT EXISTS connection_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES user_connections(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('connection_request', 'connection_accepted', 'connection_rejected')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para user_connections
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee ON user_connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_connections_updated ON user_connections(updated_at DESC);

-- Índices para match_scores
CREATE INDEX IF NOT EXISTS idx_match_scores_user ON match_scores(user_id, compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_compatibility ON match_scores(compatibility_score DESC, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_calculated ON match_scores(calculated_at DESC);

-- Índices para user_interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target ON user_interactions(target_user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type, created_at DESC);

-- Índices adicionales en user_skills para matching
CREATE INDEX IF NOT EXISTS idx_user_skills_name_level ON user_skills(skill_name, skill_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON user_skills(skill_category);

-- Índices en user_profiles para matching
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry_location ON user_profiles(industry, location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_experience ON user_profiles(role, experience_years);
CREATE INDEX IF NOT EXISTS idx_user_profiles_search ON user_profiles USING gin(to_tsvector('spanish', first_name || ' ' || last_name || ' ' || COALESCE(bio, '')));

-- ============================================
-- 3. FUNCIONES PARA MATCHING Y CONEXIONES
-- ============================================

-- Función para calcular compatibilidad entre usuarios
CREATE OR REPLACE FUNCTION calculate_user_compatibility(
    user1_id UUID,
    user2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    compatibility_score INTEGER DEFAULT 0;
    skill_score INTEGER DEFAULT 0;
    location_score INTEGER DEFAULT 0;
    industry_score INTEGER DEFAULT 0;
    experience_score INTEGER DEFAULT 0;
    objective_score INTEGER DEFAULT 0;
    
    user1_profile RECORD;
    user2_profile RECORD;
BEGIN
    -- Obtener perfiles de ambos usuarios
    SELECT * INTO user1_profile FROM user_profiles WHERE user_id = user1_id;
    SELECT * INTO user2_profile FROM user_profiles WHERE user_id = user2_id;
    
    IF user1_profile IS NULL OR user2_profile IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calcular score por skills comunes (30% del total)
    SELECT COUNT(*) * 10 INTO skill_score
    FROM user_skills us1
    JOIN user_skills us2 ON us1.skill_name = us2.skill_name
    WHERE us1.user_id = user1_id AND us2.user_id = user2_id
    AND ABS(us1.skill_level - us2.skill_level) <= 2;
    
    skill_score = LEAST(skill_score, 30);
    
    -- Calcular score por ubicación (20% del total)
    IF user1_profile.location = user2_profile.location THEN
        location_score = 20;
    ELSIF user1_profile.location ILIKE '%' || split_part(user2_profile.location, ',', -1) || '%' THEN
        location_score = 10; -- Mismo país/región
    END IF;
    
    -- Calcular score por industria (25% del total)
    IF user1_profile.industry = user2_profile.industry THEN
        industry_score = 25;
    END IF;
    
    -- Calcular score por experiencia compatible (15% del total)
    IF ABS(user1_profile.experience_years - user2_profile.experience_years) <= 2 THEN
        experience_score = 15;
    ELSIF ABS(user1_profile.experience_years - user2_profile.experience_years) <= 5 THEN
        experience_score = 8;
    END IF;
    
    -- Calcular score por objetivos comunes (10% del total)
    SELECT COUNT(*) * 5 INTO objective_score
    FROM user_objectives uo1
    JOIN user_objectives uo2 ON uo1.objective_type = uo2.objective_type
    WHERE uo1.user_id = user1_id AND uo2.user_id = user2_id;
    
    objective_score = LEAST(objective_score, 10);
    
    -- Sumar todos los scores
    compatibility_score = skill_score + location_score + industry_score + experience_score + objective_score;
    
    RETURN LEAST(compatibility_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener matches potenciales para un usuario
CREATE OR REPLACE FUNCTION get_potential_matches(
    for_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    min_compatibility INTEGER DEFAULT 40
)
RETURNS TABLE (
    matched_user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    bio TEXT,
    company VARCHAR,
    role VARCHAR,
    location VARCHAR,
    industry VARCHAR,
    avatar_url TEXT,
    compatibility_score INTEGER,
    common_skills INTEGER,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as matched_user_id,
        up.username,
        up.first_name,
        up.last_name,
        up.bio,
        up.company,
        up.role,
        up.location,
        up.industry,
        up.avatar_url,
        COALESCE(ms.compatibility_score, calculate_user_compatibility(for_user_id, up.user_id)) as compatibility_score,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM user_skills us1 
             JOIN user_skills us2 ON us1.skill_name = us2.skill_name 
             WHERE us1.user_id = for_user_id AND us2.user_id = up.user_id),
            0
        ) as common_skills,
        (up.last_active_at > now() - INTERVAL '15 minutes') as is_online
    FROM user_profiles up
    LEFT JOIN match_scores ms ON ms.user_id = for_user_id AND ms.matched_user_id = up.user_id
    WHERE 
        up.user_id != for_user_id
        AND up.profile_visibility IN ('public', 'connections')
        AND up.user_id NOT IN (
            -- Excluir usuarios ya conectados
            SELECT CASE 
                WHEN uc.requester_id = for_user_id THEN uc.addressee_id 
                ELSE uc.requester_id 
            END
            FROM user_connections uc 
            WHERE (uc.requester_id = for_user_id OR uc.addressee_id = for_user_id)
            AND uc.status IN ('accepted', 'pending', 'blocked')
        )
        AND up.user_id NOT IN (
            -- Excluir usuarios con interacciones negativas
            SELECT ui.target_user_id 
            FROM user_interactions ui 
            WHERE ui.user_id = for_user_id 
            AND ui.interaction_type IN ('dislike', 'block')
        )
    ORDER BY 
        COALESCE(ms.compatibility_score, calculate_user_compatibility(for_user_id, up.user_id)) DESC,
        common_skills DESC,
        up.last_active_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar solicitud de conexión
CREATE OR REPLACE FUNCTION send_connection_request(
    requester_id UUID,
    addressee_id UUID,
    connection_type VARCHAR DEFAULT 'general',
    message_text TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    existing_connection RECORD;
    new_connection_id UUID;
BEGIN
    -- Verificar que no sea una auto-conexión
    IF requester_id = addressee_id THEN
        RETURN json_build_object('success', false, 'error', 'No puedes conectarte contigo mismo');
    END IF;
    
    -- Verificar si ya existe alguna conexión
    SELECT * INTO existing_connection 
    FROM user_connections 
    WHERE (requester_id = send_connection_request.requester_id AND addressee_id = send_connection_request.addressee_id)
       OR (requester_id = send_connection_request.addressee_id AND addressee_id = send_connection_request.requester_id);
    
    IF existing_connection IS NOT NULL THEN
        IF existing_connection.status = 'accepted' THEN
            RETURN json_build_object('success', false, 'error', 'Ya están conectados');
        ELSIF existing_connection.status = 'pending' THEN
            RETURN json_build_object('success', false, 'error', 'Solicitud pendiente');
        ELSIF existing_connection.status = 'blocked' THEN
            RETURN json_build_object('success', false, 'error', 'Conexión bloqueada');
        END IF;
    END IF;
    
    -- Crear nueva solicitud de conexión
    INSERT INTO user_connections (requester_id, addressee_id, connection_type, message, status)
    VALUES (send_connection_request.requester_id, send_connection_request.addressee_id, 
            send_connection_request.connection_type, message_text, 'pending')
    RETURNING id INTO new_connection_id;
    
    -- Crear notificación
    INSERT INTO connection_notifications (user_id, connection_id, notification_type)
    VALUES (send_connection_request.addressee_id, new_connection_id, 'connection_request');
    
    -- Registrar interacción
    INSERT INTO user_interactions (user_id, target_user_id, interaction_type)
    VALUES (send_connection_request.requester_id, send_connection_request.addressee_id, 'like')
    ON CONFLICT (user_id, target_user_id, interaction_type) DO NOTHING;
    
    RETURN json_build_object('success', true, 'connection_id', new_connection_id);
END;
$$ LANGUAGE plpgsql;

-- Función para responder a solicitud de conexión
CREATE OR REPLACE FUNCTION respond_connection_request(
    connection_id UUID,
    responding_user_id UUID,
    response VARCHAR -- 'accepted' or 'rejected'
)
RETURNS JSON AS $$
DECLARE
    connection RECORD;
    conversation_id UUID;
BEGIN
    -- Obtener la conexión
    SELECT * INTO connection 
    FROM user_connections 
    WHERE id = connection_id AND addressee_id = responding_user_id AND status = 'pending';
    
    IF connection IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Solicitud no encontrada o ya procesada');
    END IF;
    
    -- Actualizar estado de conexión
    UPDATE user_connections 
    SET status = response, responded_at = now(), updated_at = now()
    WHERE id = connection_id;
    
    -- Crear notificación para el solicitante
    INSERT INTO connection_notifications (user_id, connection_id, notification_type)
    VALUES (connection.requester_id, connection_id, 
            CASE WHEN response = 'accepted' THEN 'connection_accepted' ELSE 'connection_rejected' END);
    
    -- Si se acepta, crear conversación
    IF response = 'accepted' THEN
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (connection.requester_id, connection.addressee_id)
        RETURNING id INTO conversation_id;
        
        RETURN json_build_object('success', true, 'status', 'accepted', 'conversation_id', conversation_id);
    END IF;
    
    RETURN json_build_object('success', true, 'status', response);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener conexiones del usuario
CREATE OR REPLACE FUNCTION get_user_connections(
    for_user_id UUID,
    connection_status VARCHAR DEFAULT 'accepted'
)
RETURNS TABLE (
    connection_id UUID,
    connected_user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar_url TEXT,
    company VARCHAR,
    role VARCHAR,
    connection_type VARCHAR,
    connected_at TIMESTAMP,
    last_message TEXT,
    last_message_at TIMESTAMP,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as connection_id,
        CASE 
            WHEN uc.requester_id = for_user_id THEN uc.addressee_id 
            ELSE uc.requester_id 
        END as connected_user_id,
        up.username,
        up.first_name,
        up.last_name,
        up.avatar_url,
        up.company,
        up.role,
        uc.connection_type,
        COALESCE(uc.responded_at, uc.created_at) as connected_at,
        c.last_message,
        c.last_message_at,
        (up.last_active_at > now() - INTERVAL '15 minutes') as is_online
    FROM user_connections uc
    JOIN user_profiles up ON up.user_id = CASE 
        WHEN uc.requester_id = for_user_id THEN uc.addressee_id 
        ELSE uc.requester_id 
    END
    LEFT JOIN conversations c ON 
        (c.user1_id = for_user_id AND c.user2_id = up.user_id) OR 
        (c.user2_id = for_user_id AND c.user1_id = up.user_id)
    WHERE 
        (uc.requester_id = for_user_id OR uc.addressee_id = for_user_id)
        AND uc.status = connection_status
    ORDER BY 
        COALESCE(c.last_message_at, uc.updated_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGERS Y ACTUALIZACIONES AUTOMÁTICAS
-- ============================================

-- Trigger para actualizar updated_at en user_connections
CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_connections_timestamp ON user_connections;
CREATE TRIGGER trigger_update_user_connections_timestamp
    BEFORE UPDATE ON user_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_timestamp();

-- Trigger para crear conversación automáticamente cuando se acepta conexión
CREATE OR REPLACE FUNCTION create_conversation_on_accept()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (NEW.requester_id, NEW.addressee_id)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_conversation_on_accept ON user_connections;
CREATE TRIGGER trigger_create_conversation_on_accept
    AFTER UPDATE ON user_connections
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_on_accept();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_notifications ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view their connections" ON user_connections;
DROP POLICY IF EXISTS "Users can create connection requests" ON user_connections;
DROP POLICY IF EXISTS "Users can update their connections" ON user_connections;

DROP POLICY IF EXISTS "Users can view their match scores" ON match_scores;
DROP POLICY IF EXISTS "System can manage match scores" ON match_scores;

DROP POLICY IF EXISTS "Users can manage their interactions" ON user_interactions;

DROP POLICY IF EXISTS "Users can view their notifications" ON connection_notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON connection_notifications;

-- Crear políticas para user_connections
CREATE POLICY "Users can view their connections" ON user_connections
FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests" ON user_connections
FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their connections" ON user_connections
FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Políticas para match_scores
CREATE POLICY "Users can view their match scores" ON match_scores
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage match scores" ON match_scores
FOR ALL USING (true); -- Solo para funciones del sistema

-- Políticas para user_interactions
CREATE POLICY "Users can manage their interactions" ON user_interactions
FOR ALL USING (auth.uid() = user_id);

-- Políticas para connection_notifications
CREATE POLICY "Users can view their notifications" ON connection_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON connection_notifications
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. VISTAS PARA FACILITAR CONSULTAS
-- ============================================

-- Vista para conexiones activas con detalles
DROP VIEW IF EXISTS active_connections;
CREATE VIEW active_connections AS
SELECT 
    uc.id as connection_id,
    uc.requester_id,
    uc.addressee_id,
    req.username as requester_username,
    req.first_name as requester_first_name,
    req.last_name as requester_last_name,
    addr.username as addressee_username,
    addr.first_name as addressee_first_name,
    addr.last_name as addressee_last_name,
    uc.connection_type,
    uc.created_at as connection_created_at,
    uc.responded_at,
    c.id as conversation_id,
    c.last_message,
    c.last_message_at
FROM user_connections uc
JOIN user_profiles req ON uc.requester_id = req.user_id
JOIN user_profiles addr ON uc.addressee_id = addr.user_id
LEFT JOIN conversations c ON 
    (c.user1_id = uc.requester_id AND c.user2_id = uc.addressee_id) OR
    (c.user1_id = uc.addressee_id AND c.user2_id = uc.requester_id)
WHERE uc.status = 'accepted';

-- ============================================
-- MENSAJE FINAL
-- ============================================

SELECT '✅ Sistema de matches y conexiones implementado exitosamente!' as resultado,
       '🔗 Tablas: user_connections, match_scores, user_interactions, connection_notifications' as tablas,
       '📊 Funciones: calculate_user_compatibility, get_potential_matches, send_connection_request, respond_connection_request' as funciones,
       '🔒 RLS habilitado en todas las tablas nuevas' as seguridad;
