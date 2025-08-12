-- ==============================================
-- StartupMatch - Sistema de Matching Database
-- Compatible con el esquema existente
-- ==============================================

-- Tabla para almacenar interacciones de matching (like/pass)
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados y auto-interacciones
    UNIQUE(user_id, target_user_id),
    CHECK (user_id != target_user_id)
);

-- Tabla para matches mutuos (cuando ambos se dan like)
CREATE TABLE IF NOT EXISTS mutual_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 100),
    match_status VARCHAR(20) DEFAULT 'active' CHECK (match_status IN ('active', 'blocked', 'archived')),
    
    -- Asegurar que user1_id < user2_id para evitar duplicados
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Tabla para solicitudes de conexión (compatible con conversations existente)
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    message TEXT, -- Mensaje opcional al enviar solicitud
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Evitar solicitudes duplicadas y auto-solicitudes
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Tabla para cache de compatibilidad calculada (optimización)
CREATE TABLE IF NOT EXISTS compatibility_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
    calculation_details JSONB, -- Desglose de cómo se calculó el score
    calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Asegurar que user1_id < user2_id
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_cache ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can create their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can view their matches" ON mutual_matches;
DROP POLICY IF EXISTS "Users can view their connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update connection requests they received" ON connection_requests;
DROP POLICY IF EXISTS "Users can view their compatibility scores" ON compatibility_cache;

-- Políticas RLS para user_interactions
CREATE POLICY "Users can view their own interactions" 
ON user_interactions FOR SELECT
USING (user_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "Users can create their own interactions" 
ON user_interactions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para mutual_matches
CREATE POLICY "Users can view their matches" 
ON mutual_matches FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Políticas RLS para connection_requests
CREATE POLICY "Users can view their connection requests" 
ON connection_requests FOR SELECT
USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create connection requests" 
ON connection_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update connection requests they received" 
ON connection_requests FOR UPDATE
USING (addressee_id = auth.uid());

-- Políticas RLS para compatibility_cache
CREATE POLICY "Users can view their compatibility scores" 
ON compatibility_cache FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_mutual_matches_user1 ON mutual_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_user2 ON mutual_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_status ON mutual_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_score ON mutual_matches(compatibility_score DESC);

CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_addressee ON connection_requests(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_pending ON connection_requests(addressee_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_compatibility_cache_users ON compatibility_cache(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_cache_expires ON compatibility_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_compatibility_cache_score ON compatibility_cache(compatibility_score DESC);

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM compatibility_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para crear match mutuo automáticamente
CREATE OR REPLACE FUNCTION create_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si es un 'like' y ya existe un like recíproco
    IF NEW.interaction_type = 'like' THEN
        -- Verificar si existe like recíproco
        IF EXISTS (
            SELECT 1 FROM user_interactions 
            WHERE user_id = NEW.target_user_id 
            AND target_user_id = NEW.user_id 
            AND interaction_type = 'like'
        ) THEN
            -- Crear match mutuo (con IDs ordenados)
            INSERT INTO mutual_matches (user1_id, user2_id, compatibility_score)
            VALUES (
                LEAST(NEW.user_id, NEW.target_user_id),
                GREATEST(NEW.user_id, NEW.target_user_id),
                -- Obtener score del cache si existe
                COALESCE(
                    (SELECT compatibility_score FROM compatibility_cache 
                     WHERE user1_id = LEAST(NEW.user_id, NEW.target_user_id)
                     AND user2_id = GREATEST(NEW.user_id, NEW.target_user_id)
                     AND expires_at > NOW()),
                    75 -- Score por defecto
                )
            )
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear conversación automáticamente cuando se acepta conexión
CREATE OR REPLACE FUNCTION create_conversation_on_connection()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo cuando se acepta una solicitud de conexión
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        -- Crear conversación con IDs ordenados para evitar duplicados
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (
            LEAST(NEW.requester_id, NEW.addressee_id),
            GREATEST(NEW.requester_id, NEW.addressee_id)
        )
        ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear matches automáticamente
DROP TRIGGER IF EXISTS trigger_create_mutual_match ON user_interactions;
CREATE TRIGGER trigger_create_mutual_match
    AFTER INSERT ON user_interactions
    FOR EACH ROW EXECUTE FUNCTION create_mutual_match();

-- Trigger para crear conversaciones automáticamente
DROP TRIGGER IF EXISTS trigger_create_conversation ON connection_requests;
CREATE TRIGGER trigger_create_conversation
    AFTER UPDATE ON connection_requests
    FOR EACH ROW EXECUTE FUNCTION create_conversation_on_connection();

-- Función para calcular compatibilidad básica
CREATE OR REPLACE FUNCTION calculate_compatibility(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    profile1 RECORD;
    profile2 RECORD;
    common_skills INTEGER;
    common_objectives INTEGER;
    location_match BOOLEAN := FALSE;
    industry_match BOOLEAN := FALSE;
BEGIN
    -- Obtener perfiles
    SELECT * INTO profile1 FROM user_profiles WHERE user_profiles.user_id = p_user1_id;
    SELECT * INTO profile2 FROM user_profiles WHERE user_profiles.user_id = p_user2_id;
    
    IF profile1 IS NULL OR profile2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Puntos por industria similar (20 puntos max)
    IF profile1.industry = profile2.industry THEN
        score := score + 20;
        industry_match := TRUE;
    END IF;
    
    -- Puntos por ubicación similar (15 puntos max)
    IF profile1.location = profile2.location THEN
        score := score + 15;
        location_match := TRUE;
    END IF;
    
    -- Puntos por experiencia complementaria (15 puntos max)
    IF ABS(profile1.experience_years - profile2.experience_years) BETWEEN 2 AND 5 THEN
        score := score + 15;
    ELSIF ABS(profile1.experience_years - profile2.experience_years) <= 1 THEN
        score := score + 10;
    END IF;
    
    -- Puntos por habilidades comunes (25 puntos max)
    SELECT COUNT(*) INTO common_skills
    FROM user_skills s1
    JOIN user_skills s2 ON s1.skill_name = s2.skill_name
    WHERE s1.user_id = p_user1_id 
    AND s2.user_id = p_user2_id;
    
    score := score + LEAST(common_skills * 5, 25);
    
    -- Puntos por objetivos comunes (15 puntos max)
    SELECT COUNT(*) INTO common_objectives
    FROM user_objectives o1
    JOIN user_objectives o2 ON o1.objective_type = o2.objective_type
    WHERE o1.user_id = p_user1_id 
    AND o2.user_id = p_user2_id;
    
    score := score + LEAST(common_objectives * 8, 15);
    
    -- Bonus por perfil completado (10 puntos max)
    IF profile1.profile_completed_at IS NOT NULL AND profile2.profile_completed_at IS NOT NULL THEN
        score := score + 10;
    END IF;
    
    -- Asegurar que el score esté en el rango 0-100
    RETURN LEAST(GREATEST(score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS get_potential_matches(uuid, integer, integer);

-- Función para obtener usuarios potenciales para matching
CREATE OR REPLACE FUNCTION get_potential_matches(
    p_target_user_id UUID,
    p_limit_count INTEGER DEFAULT 10,
    p_min_compatibility INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    bio TEXT,
    role VARCHAR,
    company VARCHAR,
    industry VARCHAR,
    location VARCHAR,
    experience_years INTEGER,
    avatar_url TEXT,
    estimated_compatibility INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.username,
        up.first_name,
        up.last_name,
        up.bio,
        up.role,
        up.company,
        up.industry,
        up.location,
        up.experience_years,
        up.avatar_url,
        COALESCE(cc.compatibility_score, calculate_compatibility(p_target_user_id, up.user_id)) as estimated_compatibility
    FROM user_profiles up
    LEFT JOIN compatibility_cache cc ON (
        cc.user1_id = LEAST(p_target_user_id, up.user_id) AND
        cc.user2_id = GREATEST(p_target_user_id, up.user_id) AND
        cc.expires_at > NOW()
    )
    WHERE up.user_id != p_target_user_id
    AND up.profile_visibility IN ('public', 'connections')
    -- Excluir usuarios ya evaluados
    AND NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = p_target_user_id AND ui.target_user_id = up.user_id
    )
    -- Excluir usuarios que ya tienen match mutuo
    AND NOT EXISTS (
        SELECT 1 FROM mutual_matches mm 
        WHERE (mm.user1_id = LEAST(p_target_user_id, up.user_id) AND mm.user2_id = GREATEST(p_target_user_id, up.user_id))
    )
    -- Excluir usuarios con solicitudes de conexión existentes
    AND NOT EXISTS (
        SELECT 1 FROM connection_requests cr 
        WHERE (cr.requester_id = p_target_user_id AND cr.addressee_id = up.user_id)
        OR (cr.requester_id = up.user_id AND cr.addressee_id = p_target_user_id)
    )
    AND COALESCE(cc.compatibility_score, calculate_compatibility(p_target_user_id, up.user_id)) >= p_min_compatibility
    ORDER BY estimated_compatibility DESC, up.created_at DESC
    LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql;

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS get_user_connections(uuid);

-- Función para obtener conexiones de un usuario
CREATE OR REPLACE FUNCTION get_user_connections(p_target_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    other_user_id UUID,
    other_user_name VARCHAR,
    other_user_avatar TEXT,
    other_user_role VARCHAR,
    other_user_company VARCHAR,
    connection_status VARCHAR,
    connected_at TIMESTAMP,
    is_requester BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as connection_id,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN cr.addressee_id
            ELSE cr.requester_id
        END as other_user_id,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN (up2.first_name || ' ' || up2.last_name)::VARCHAR
            ELSE (up1.first_name || ' ' || up1.last_name)::VARCHAR
        END as other_user_name,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.avatar_url
            ELSE up1.avatar_url
        END as other_user_avatar,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.role
            ELSE up1.role
        END as other_user_role,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.company
            ELSE up1.company
        END as other_user_company,
        cr.status::VARCHAR as connection_status,
        COALESCE(cr.responded_at, cr.created_at) as connected_at,
        (cr.requester_id = p_target_user_id) as is_requester
    FROM connection_requests cr
    LEFT JOIN user_profiles up1 ON cr.requester_id = up1.user_id
    LEFT JOIN user_profiles up2 ON cr.addressee_id = up2.user_id
    WHERE 
        (cr.requester_id = p_target_user_id OR cr.addressee_id = p_target_user_id)
        AND cr.status IN ('accepted', 'pending')
    ORDER BY 
        CASE WHEN cr.status = 'pending' THEN 0 ELSE 1 END,
        COALESCE(cr.responded_at, cr.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentarios de documentación
COMMENT ON TABLE user_interactions IS 'Almacena las interacciones like/pass entre usuarios para el sistema de matching';
COMMENT ON TABLE mutual_matches IS 'Almacena matches mutuos cuando ambos usuarios se dan like';
COMMENT ON TABLE connection_requests IS 'Almacena solicitudes de conexión entre usuarios';
COMMENT ON TABLE compatibility_cache IS 'Cache de scores de compatibilidad para optimizar performance';
COMMENT ON FUNCTION get_potential_matches IS 'Obtiene usuarios potenciales para matching, excluyendo ya evaluados';
COMMENT ON FUNCTION calculate_compatibility IS 'Calcula score de compatibilidad entre dos usuarios basado en perfiles';
COMMENT ON FUNCTION get_user_connections IS 'Obtiene las conexiones de un usuario con detalles';

SELECT '✅ Sistema de matching creado exitosamente. Tablas: user_interactions, mutual_matches, connection_requests, compatibility_cache' as resultado;
