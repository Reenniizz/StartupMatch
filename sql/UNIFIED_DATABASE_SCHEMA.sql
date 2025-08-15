-- ============================================
-- STARTUPMATCH - ESQUEMA UNIFICADO v1.1 (SAFE)
-- Este archivo reemplaza los 22 archivos SQL fragmentados
-- Versión mejorada que maneja políticas existentes
-- ============================================

BEGIN;

-- ============================================
-- 1. LIMPIEZA INTELIGENTE: Eliminar políticas conflictivas de forma segura
-- ============================================

-- Función helper para eliminar políticas de forma segura
CREATE OR REPLACE FUNCTION drop_policy_if_exists(policy_name text, table_name text) 
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    RAISE NOTICE 'Policy % dropped from table %', policy_name, table_name;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy % not found on table % (skipping)', policy_name, table_name;
END;
$$ LANGUAGE plpgsql;

-- Deshabilitar RLS temporalmente para limpieza (si las tablas existen)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connection_requests') THEN
        ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled on connection_requests';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE projects DISABLE ROW LEVEL SECURITY;  
        RAISE NOTICE 'RLS disabled on projects';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled on user_profiles';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled on conversations';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'private_messages') THEN
        ALTER TABLE private_messages DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS disabled on private_messages';
    END IF;
END $$;

-- Eliminar TODAS las políticas existentes de forma segura
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar políticas de projects
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' LOOP
        PERFORM drop_policy_if_exists(r.policyname, 'projects');
    END LOOP;
    
    -- Eliminar políticas de connection_requests
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'connection_requests' LOOP
        PERFORM drop_policy_if_exists(r.policyname, 'connection_requests');
    END LOOP;
    
    -- Eliminar políticas de user_profiles  
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' LOOP
        PERFORM drop_policy_if_exists(r.policyname, 'user_profiles');
    END LOOP;
    
    -- Eliminar políticas de conversations
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' LOOP
        PERFORM drop_policy_if_exists(r.policyname, 'conversations');
    END LOOP;
    
    -- Eliminar políticas de private_messages
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'private_messages' LOOP
        PERFORM drop_policy_if_exists(r.policyname, 'private_messages');
    END LOOP;
    
    RAISE NOTICE '✅ All existing policies cleaned up safely';
END $$;

-- ============================================  
-- 2. TABLAS CORE - Estructura consolidada
-- ============================================

-- User Profiles (tabla principal de usuarios)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    
    -- Professional info
    role VARCHAR(100),
    company VARCHAR(200),
    industry VARCHAR(100),
    location VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    
    -- Contact & Social
    email VARCHAR(255),
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (profile_visibility IN ('public', 'connections_only', 'private')),
    show_email BOOLEAN DEFAULT false,
    allow_messages BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Projects (estructura simplificada y consolidada)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    title VARCHAR(200) NOT NULL,
    tagline VARCHAR(300),
    description TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(100),
    stage VARCHAR(50) DEFAULT 'idea'
        CHECK (stage IN ('idea', 'prototype', 'mvp', 'launch', 'growth', 'mature')),
    industry VARCHAR(100),
    
    -- Project details
    problem TEXT,
    solution TEXT,
    target_market TEXT,
    business_model TEXT,
    
    -- Requirements
    looking_for TEXT[],
    tech_stack TEXT[],
    team_size INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public'
        CHECK (visibility IN ('public', 'connections_only', 'private')),
    
    -- Media
    logo_url TEXT,
    cover_image_url TEXT,
    demo_url TEXT,
    
    -- Metrics (denormalized for performance)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Connection Requests (simplificado)
CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    
    -- Prevent duplicate requests and self-requests  
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id),
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Conversations (messaging system)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ensure user1_id < user2_id for consistency
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id),
    
    last_message_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Private Messages
CREATE TABLE IF NOT EXISTS private_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text'
        CHECK (message_type IN ('text', 'image', 'file', 'link')),
    
    read_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ÍNDICES OPTIMIZADOS - Performance crítica
-- ============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry ON user_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON user_profiles(profile_visibility) 
    WHERE profile_visibility = 'public';

-- Projects indexes  
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, visibility, created_at DESC)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects 
    USING gin(to_tsvector('spanish', title || ' ' || description));

-- Connection requests indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_addressee ON connection_requests(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_pending ON connection_requests(addressee_id, status)
    WHERE status = 'pending';

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON private_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_unread ON private_messages(sender_id, read_at)
    WHERE read_at IS NULL;

-- ============================================
-- 4. RLS POLÍTICAS - Seguridad simplificada pero efectiva
-- ============================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;  
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '🔒 RLS enabled on all core tables';

-- User Profiles: perfiles públicos visibles, usuarios pueden editar el suyo
CREATE POLICY "profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        profile_visibility = 'public' 
        OR id = auth.uid()
        OR (profile_visibility = 'connections_only' AND EXISTS (
            SELECT 1 FROM connection_requests cr
            WHERE (cr.requester_id = auth.uid() AND cr.addressee_id = id)
               OR (cr.requester_id = id AND cr.addressee_id = auth.uid())
            AND cr.status = 'accepted'
        ))
    );

CREATE POLICY "profiles_update_policy" ON user_profiles  
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

RAISE NOTICE '✅ User profiles policies created';

-- Projects: públicos visibles por todos, propietarios tienen control total
CREATE POLICY "projects_select_policy" ON projects
    FOR SELECT USING (
        (visibility = 'public' AND status = 'active')
        OR creator_id = auth.uid()
        OR (visibility = 'connections_only' AND EXISTS (
            SELECT 1 FROM connection_requests cr  
            WHERE (cr.requester_id = auth.uid() AND cr.addressee_id = creator_id)
               OR (cr.requester_id = creator_id AND cr.addressee_id = auth.uid())
            AND cr.status = 'accepted'
        ))
    );

CREATE POLICY "projects_insert_policy" ON projects
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "projects_update_policy" ON projects  
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "projects_delete_policy" ON projects
    FOR DELETE USING (creator_id = auth.uid());

RAISE NOTICE '✅ Projects policies created';

-- Connection Requests: usuarios pueden ver solicitudes que enviaron o recibieron
CREATE POLICY "connection_requests_select_policy" ON connection_requests
    FOR SELECT USING (
        requester_id = auth.uid() OR addressee_id = auth.uid()
    );

CREATE POLICY "connection_requests_insert_policy" ON connection_requests  
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "connection_requests_update_policy" ON connection_requests
    FOR UPDATE USING (addressee_id = auth.uid());

RAISE NOTICE '✅ Connection requests policies created';

-- Conversations: usuarios pueden ver sus propias conversaciones
CREATE POLICY "conversations_policy" ON conversations
    FOR ALL USING (
        user1_id = auth.uid() OR user2_id = auth.uid()
    ) WITH CHECK (
        user1_id = auth.uid() OR user2_id = auth.uid()
    );

RAISE NOTICE '✅ Conversations policies created';

-- Private Messages: usuarios pueden ver mensajes en sus conversaciones
CREATE POLICY "messages_select_policy" ON private_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id 
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

CREATE POLICY "messages_insert_policy" ON private_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id 
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

RAISE NOTICE '✅ Messages policies created';

-- ============================================
-- 5. FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (con logging mejorado)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE '✅ Trigger created for user_profiles.updated_at';

    DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
    CREATE TRIGGER update_projects_updated_at 
        BEFORE UPDATE ON projects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE '✅ Trigger created for projects.updated_at';

    DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;  
    CREATE TRIGGER update_connection_requests_updated_at 
        BEFORE UPDATE ON connection_requests 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE '✅ Trigger created for connection_requests.updated_at';
END $$;

-- ============================================
-- 6. DATOS DE EJEMPLO (opcional, solo para testing)
-- ============================================

-- Insertar categorías de proyectos básicas
INSERT INTO projects (creator_id, title, description, category, stage, status)
SELECT 
    auth.uid(),
    'Proyecto de Ejemplo',
    'Este es un proyecto de ejemplo creado durante la configuración inicial.',
    'Technology',
    'idea', 
    'draft'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;

-- Limpiar función helper temporal
DROP FUNCTION IF EXISTS drop_policy_if_exists(text, text);

-- ============================================
-- ✅ ESQUEMA UNIFICADO COMPLETADO EXITOSAMENTE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 UNIFIED DATABASE SCHEMA v1.1 DEPLOYED SUCCESSFULLY!';
    RAISE NOTICE '✅ 22 archivos SQL fragmentados → 1 archivo unificado';
    RAISE NOTICE '✅ Políticas RLS conflictivas → Políticas limpias y efectivas';
    RAISE NOTICE '✅ Tablas duplicadas → Schema consistente';
    RAISE NOTICE '✅ Índices faltantes → Índices optimizados para performance';
    RAISE NOTICE '✅ Triggers faltantes → Triggers automáticos para updated_at';
    RAISE NOTICE '✅ Estructura caótica → Arquitectura limpia y mantenible';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Verificar que todas las políticas funcionan correctamente';
    RAISE NOTICE '2. Probar las APIs con el nuevo schema';
    RAISE NOTICE '3. Continuar con Fase 2: Performance & Architecture';
END $$;

-- ============================================
-- ✅ ESQUEMA UNIFICADO COMPLETADO
-- ============================================

/*
RESUMEN DE CAMBIOS:
✅ 22 archivos SQL fragmentados → 1 archivo unificado
✅ Políticas RLS conflictivas → Políticas limpias y efectivas  
✅ Tablas duplicadas → Schema consistente
✅ Índices faltantes → Índices optimizados para performance
✅ Triggers faltantes → Triggers automáticos para updated_at
✅ Estructura caótica → Arquitectura limpia y mantenible

PRÓXIMOS PASOS:
1. Ejecutar este script en Supabase
2. Verificar que todas las políticas funcionan
3. Migrar datos existentes si es necesario
4. Actualizar APIs para usar nuevo schema
*/
