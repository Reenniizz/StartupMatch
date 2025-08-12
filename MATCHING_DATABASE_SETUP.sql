-- ==============================================
-- StartupMatch - Sistema de Matching Database
-- ==============================================

-- Tabla para almacenar interacciones de matching (like/pass)
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(user_id, target_user_id)
);

-- Tabla para matches mutuos (cuando ambos se dan like)
CREATE TABLE IF NOT EXISTS mutual_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 100),
    match_status VARCHAR(20) DEFAULT 'active' CHECK (match_status IN ('active', 'blocked', 'archived')),
    
    -- Asegurar que user1_id < user2_id para evitar duplicados
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Tabla para cache de compatibilidad calculada (optimización)
CREATE TABLE IF NOT EXISTS compatibility_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
    calculation_details JSONB, -- Desglose de cómo se calculó el score
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Asegurar que user1_id < user2_id
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target_user_id ON user_interactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_mutual_matches_user1 ON mutual_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_user2 ON mutual_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_status ON mutual_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_mutual_matches_score ON mutual_matches(compatibility_score DESC);

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

-- Trigger para crear matches automáticamente
CREATE TRIGGER trigger_create_mutual_match
    AFTER INSERT ON user_interactions
    FOR EACH ROW EXECUTE FUNCTION create_mutual_match();

-- Vista para obtener matches de un usuario fácilmente
CREATE OR REPLACE VIEW user_matches AS
SELECT 
    mm.id as match_id,
    mm.user1_id,
    mm.user2_id,
    mm.matched_at,
    mm.compatibility_score,
    mm.match_status,
    -- Perfil del otro usuario para user1
    CASE WHEN mm.user1_id = mm.user1_id THEN mm.user2_id ELSE mm.user1_id END as other_user_id,
    up.username as other_username,
    up.first_name as other_first_name,
    up.last_name as other_last_name,
    up.bio as other_bio,
    up.role as other_role,
    up.company as other_company,
    up.location as other_location
FROM mutual_matches mm
JOIN user_profiles up ON up.id = CASE WHEN mm.user1_id = mm.user1_id THEN mm.user2_id ELSE mm.user1_id END
WHERE mm.match_status = 'active';

-- Función para obtener usuarios potenciales para matching
CREATE OR REPLACE FUNCTION get_potential_matches(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 10,
    min_compatibility INTEGER DEFAULT 50
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
    estimated_compatibility INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.first_name,
        up.last_name,
        up.bio,
        up.role,
        up.company,
        up.industry,
        up.location,
        up.experience_years,
        COALESCE(cc.compatibility_score, 60) as estimated_compatibility
    FROM user_profiles up
    LEFT JOIN compatibility_cache cc ON (
        cc.user1_id = LEAST(target_user_id, up.id) AND
        cc.user2_id = GREATEST(target_user_id, up.id) AND
        cc.expires_at > NOW()
    )
    WHERE up.id != target_user_id
    AND up.profile_visibility = 'public'
    -- Excluir usuarios ya evaluados
    AND NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = target_user_id AND ui.target_user_id = up.id
    )
    -- Excluir usuarios que ya tienen match mutuo
    AND NOT EXISTS (
        SELECT 1 FROM mutual_matches mm 
        WHERE (mm.user1_id = LEAST(target_user_id, up.id) AND mm.user2_id = GREATEST(target_user_id, up.id))
    )
    ORDER BY COALESCE(cc.compatibility_score, 60) DESC, up.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_interactions IS 'Almacena las interacciones like/pass entre usuarios';
COMMENT ON TABLE mutual_matches IS 'Almacena matches mutuos cuando ambos usuarios se dan like';
COMMENT ON TABLE compatibility_cache IS 'Cache de scores de compatibilidad para optimizar performance';
COMMENT ON FUNCTION get_potential_matches IS 'Obtiene usuarios potenciales para matching, excluyendo ya evaluados';
