-- ==========================================
-- 📋 SISTEMA DE PROYECTOS - BASE DE DATOS
-- StartupMatch - Esquema completo para proyectos
-- Version: 1.0.0
-- Fecha: $(date)
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

BEGIN;

-- ==========================================
-- 🗂️ TABLA PRINCIPAL: PROJECTS
-- ==========================================

CREATE TABLE projects (
    -- Identificadores únicos
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información básica del proyecto
    title VARCHAR(200) NOT NULL,
    tagline VARCHAR(300), -- Descripción corta/elevator pitch
    description TEXT NOT NULL,
    detailed_description TEXT, -- Descripción completa con markdown
    
    -- Estado y visibilidad
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' 
        CHECK (visibility IN ('public', 'private', 'connections_only', 'team_only')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- Para proyectos verificados por admin
    
    -- Clasificación del proyecto
    category VARCHAR(50) NOT NULL, -- startup, side-project, mvp, etc.
    industry VARCHAR(50) NOT NULL,
    stage VARCHAR(30) DEFAULT 'idea' 
        CHECK (stage IN ('idea', 'mvp', 'beta', 'launch', 'growth', 'scaling', 'exit')),
    
    -- Detalles de fechas y plazos
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Recursos y media
    logo_url TEXT,
    cover_image_url TEXT,
    demo_url TEXT,
    website_url TEXT,
    repository_url TEXT,
    pitch_deck_url TEXT,
    demo_video_url TEXT,
    
    -- Tecnologías y habilidades
    tech_stack JSONB DEFAULT '[]'::jsonb, -- Array de tecnologías
    required_skills JSONB DEFAULT '[]'::jsonb, -- Skills necesarias
    
    -- Financiamiento y recursos
    funding_goal DECIMAL(15,2), -- Meta de financiamiento
    funding_raised DECIMAL(15,2) DEFAULT 0,
    funding_stage VARCHAR(30) 
        CHECK (funding_stage IN ('bootstrapped', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'ipo')),
    equity_offered DECIMAL(5,2), -- % equity disponible para co-fundadores
    
    -- Métricas y engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    
    -- Configuración de equipo
    team_size_current INTEGER DEFAULT 1,
    team_size_target INTEGER DEFAULT 1,
    is_seeking_cofounder BOOLEAN DEFAULT FALSE,
    is_seeking_investors BOOLEAN DEFAULT FALSE,
    is_seeking_mentors BOOLEAN DEFAULT FALSE,
    is_open_to_collaboration BOOLEAN DEFAULT TRUE,
    
    -- Configuración de aplicaciones
    accepts_applications BOOLEAN DEFAULT TRUE,
    application_deadline DATE,
    auto_accept_applications BOOLEAN DEFAULT FALSE,
    requires_application_message BOOLEAN DEFAULT TRUE,
    
    -- Metadatos adicionales
    tags TEXT[] DEFAULT '{}', -- Array de tags para búsqueda
    metadata JSONB DEFAULT '{}'::jsonb, -- Datos adicionales flexibles
    
    -- Control de tiempo
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITHOUT TIME ZONE, -- Cuando se publicó por primera vez
    last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 🏷️ TABLA: PROJECT_CATEGORIES
-- ==========================================

CREATE TABLE project_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Nombre del ícono
    color VARCHAR(7), -- Color hex
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 👥 TABLA: PROJECT_TEAM_MEMBERS
-- ==========================================

CREATE TABLE project_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rol y permisos
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    custom_title VARCHAR(100), -- Título personalizado
    is_founder BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Detalles de participación
    equity_percentage DECIMAL(5,2) DEFAULT 0,
    commitment_level VARCHAR(20) DEFAULT 'part_time' 
        CHECK (commitment_level IN ('part_time', 'full_time', 'consultant', 'advisor')),
    
    -- Estado de la membresía
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'left', 'removed')),
    
    -- Fechas importantes
    joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Información adicional
    bio TEXT, -- Descripción del rol en el proyecto
    responsibilities TEXT[], -- Array de responsabilidades
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(project_id, user_id)
);

-- ==========================================
-- 📨 TABLA: PROJECT_APPLICATIONS
-- ==========================================

CREATE TABLE project_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Detalles de la aplicación
    desired_role VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    proposed_equity DECIMAL(5,2), -- % equity solicitado
    proposed_commitment VARCHAR(20) DEFAULT 'part_time' 
        CHECK (proposed_commitment IN ('part_time', 'full_time', 'consultant', 'advisor')),
    
    -- Archivos adjuntos
    resume_url TEXT,
    portfolio_url TEXT,
    cover_letter_url TEXT,
    additional_documents JSONB DEFAULT '[]'::jsonb,
    
    -- Estado de la aplicación
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'withdrawn')),
    
    -- Respuesta del creador del proyecto
    response_message TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Fechas importantes
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE, -- Auto-expire applications
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar aplicaciones duplicadas
    UNIQUE(project_id, applicant_id)
);

-- ==========================================
-- 💡 TABLA: PROJECT_IDEAS (Para borradores y conceptos)
-- ==========================================

CREATE TABLE project_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información básica de la idea
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    industry VARCHAR(50),
    
    -- Estado de la idea
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'developing', 'converted_to_project', 'abandoned')),
    
    -- Referencia al proyecto si se convierte
    converted_to_project_id UUID REFERENCES projects(id),
    converted_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Metadatos
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    inspiration_sources TEXT[], -- URLs o referencias que inspiraron la idea
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 📝 TABLA: PROJECT_UPDATES (Para actualizaciones/posts del proyecto)
-- ==========================================

CREATE TABLE project_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenido del update
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    update_type VARCHAR(30) DEFAULT 'general' 
        CHECK (update_type IN ('general', 'milestone', 'announcement', 'blog_post', 'media', 'funding')),
    
    -- Media attachments
    images JSONB DEFAULT '[]'::jsonb, -- Array de URLs de imágenes
    videos JSONB DEFAULT '[]'::jsonb, -- Array de URLs de videos
    documents JSONB DEFAULT '[]'::jsonb, -- Array de documentos adjuntos
    
    -- Configuración de visibilidad
    visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (visibility IN ('public', 'team_only', 'investors_only')),
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Métricas
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Control de tiempo
    published_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 💬 TABLA: PROJECT_COMMENTS (Para comentarios en updates)
-- ==========================================

CREATE TABLE project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    update_id UUID NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenido del comentario
    content TEXT NOT NULL,
    
    -- Threading para replies
    parent_comment_id UUID REFERENCES project_comments(id),
    
    -- Métricas
    like_count INTEGER DEFAULT 0,
    
    -- Estado
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 👍 TABLA: PROJECT_LIKES
-- ==========================================

CREATE TABLE project_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar likes duplicados
    UNIQUE(project_id, user_id)
);

-- ==========================================
-- 👀 TABLA: PROJECT_VIEWS (Para tracking de visualizaciones)
-- ==========================================

CREATE TABLE project_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null para usuarios anónimos
    
    -- Información de la visita
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Métricas de engagement
    time_spent_seconds INTEGER DEFAULT 0,
    pages_viewed INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 🔖 TABLA: PROJECT_BOOKMARKS (Para guardar proyectos favoritos)
-- ==========================================

CREATE TABLE project_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Organización de bookmarks
    folder_name VARCHAR(100) DEFAULT 'default',
    notes TEXT,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar bookmarks duplicados
    UNIQUE(project_id, user_id)
);

-- ==========================================
-- 📊 TABLA: PROJECT_METRICS (Para métricas agregadas)
-- ==========================================

CREATE TABLE project_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Métricas de engagement
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_bookmarks INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    
    -- Métricas de conversión
    view_to_like_rate DECIMAL(5,2) DEFAULT 0,
    view_to_application_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Métricas temporales (últimos 30 días)
    views_last_30d INTEGER DEFAULT 0,
    likes_last_30d INTEGER DEFAULT 0,
    applications_last_30d INTEGER DEFAULT 0,
    
    -- Fecha de última actualización
    last_calculated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);

-- ==========================================
-- 🎯 TABLA: PROJECT_MILESTONES (Para hitos del proyecto)
-- ==========================================

CREATE TABLE project_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Información del milestone
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Fechas
    target_date DATE NOT NULL,
    completed_date DATE,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'delayed')),
    
    -- Prioridad y orden
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    sort_order INTEGER DEFAULT 0,
    
    -- Quién lo marcó como completado
    completed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

COMMIT;

-- ==========================================
-- 📊 ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

BEGIN;

-- Índices principales para projects
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_industry ON projects(industry);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_projects_seeking ON projects(is_seeking_cofounder, is_seeking_investors) WHERE is_seeking_cofounder = TRUE OR is_seeking_investors = TRUE;
CREATE INDEX idx_projects_created ON projects(created_at);
CREATE INDEX idx_projects_activity ON projects(last_activity_at);

-- Índice compuesto para búsquedas complejas
CREATE INDEX idx_projects_discovery ON projects(status, visibility, category, is_featured, created_at) 
    WHERE status = 'active' AND visibility = 'public';

-- Full-text search index
CREATE INDEX idx_projects_search ON projects USING gin(
    to_tsvector('spanish', 
        COALESCE(title, '') || ' ' || 
        COALESCE(tagline, '') || ' ' || 
        COALESCE(description, '')
    )
);

-- Índice para tags
CREATE INDEX idx_projects_tags ON projects USING gin(tags);
CREATE INDEX idx_projects_tech_stack ON projects USING gin(tech_stack);

-- Índices para project_team_members
CREATE INDEX idx_team_members_project ON project_team_members(project_id);
CREATE INDEX idx_team_members_user ON project_team_members(user_id);
CREATE INDEX idx_team_members_role ON project_team_members(role);
CREATE INDEX idx_team_members_status ON project_team_members(status);
CREATE INDEX idx_team_members_founder ON project_team_members(is_founder) WHERE is_founder = TRUE;

-- Índices para project_applications
CREATE INDEX idx_applications_project ON project_applications(project_id);
CREATE INDEX idx_applications_applicant ON project_applications(applicant_id);
CREATE INDEX idx_applications_status ON project_applications(status);
CREATE INDEX idx_applications_pending ON project_applications(project_id, status, applied_at) WHERE status = 'pending';

-- Índices para project_updates
CREATE INDEX idx_updates_project ON project_updates(project_id, published_at);
CREATE INDEX idx_updates_author ON project_updates(author_id);
CREATE INDEX idx_updates_type ON project_updates(update_type);
CREATE INDEX idx_updates_pinned ON project_updates(project_id, is_pinned) WHERE is_pinned = TRUE;

-- Índices para project_views (para analytics)
CREATE INDEX idx_views_project_date ON project_views(project_id, created_at);
CREATE INDEX idx_views_user ON project_views(viewer_id) WHERE viewer_id IS NOT NULL;

-- Índices para métricas
CREATE INDEX idx_likes_project ON project_likes(project_id);
CREATE INDEX idx_bookmarks_user ON project_bookmarks(user_id);
CREATE INDEX idx_milestones_project_status ON project_milestones(project_id, status);

COMMIT;

-- ==========================================
-- 🔧 TRIGGERS Y FUNCIONES
-- ==========================================

BEGIN;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON project_team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON project_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updates_updated_at 
    BEFORE UPDATE ON project_updates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON project_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at 
    BEFORE UPDATE ON project_milestones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar contadores automáticamente
CREATE OR REPLACE FUNCTION update_project_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'project_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET like_count = like_count + 1 WHERE id = NEW.project_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_applications' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET application_count = application_count + 1 WHERE id = NEW.project_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE projects SET application_count = GREATEST(application_count - 1, 0) WHERE id = OLD.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_views' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET view_count = view_count + 1 WHERE id = NEW.project_id;
        END IF;
    END IF;
    
    -- Actualizar last_activity_at del proyecto
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET last_activity_at = NOW() WHERE id = NEW.project_id;
        RETURN NEW;
    ELSE
        UPDATE projects SET last_activity_at = NOW() WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para contadores automáticos
CREATE TRIGGER update_project_like_count
    AFTER INSERT OR DELETE ON project_likes
    FOR EACH ROW EXECUTE FUNCTION update_project_counters();

CREATE TRIGGER update_project_application_count
    AFTER INSERT OR DELETE ON project_applications
    FOR EACH ROW EXECUTE FUNCTION update_project_counters();

CREATE TRIGGER update_project_view_count
    AFTER INSERT ON project_views
    FOR EACH ROW EXECUTE FUNCTION update_project_counters();

-- Función para actualizar published_at cuando se activa un proyecto
CREATE OR REPLACE FUNCTION update_project_published_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el status cambió a 'active' y no hay published_at, lo establecemos
    IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_published_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_project_published_at();

COMMIT;

-- ==========================================
-- 🔒 POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==========================================

BEGIN;

-- Habilitar RLS en todas las tablas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 📋 POLÍTICAS PARA PROJECTS
-- ==========================================

-- Ver proyectos: públicos, propios, o de equipo
CREATE POLICY "projects_select_policy" ON projects
    FOR SELECT USING (
        visibility = 'public' 
        OR creator_id = auth.uid()
        OR (visibility = 'connections_only' AND EXISTS (
            SELECT 1 FROM connection_requests cr
            WHERE ((cr.requester_id = auth.uid() AND cr.addressee_id = creator_id) 
                   OR (cr.requester_id = creator_id AND cr.addressee_id = auth.uid()))
                   AND cr.status = 'accepted'
        ))
        OR (visibility = 'team_only' AND EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = id AND ptm.user_id = auth.uid() AND ptm.status = 'active'
        ))
    );

-- Crear proyectos: usuarios autenticados
CREATE POLICY "projects_insert_policy" ON projects
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Actualizar proyectos: creador o admin del equipo
CREATE POLICY "projects_update_policy" ON projects
    FOR UPDATE USING (
        creator_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = id AND ptm.user_id = auth.uid() 
                  AND ptm.is_admin = TRUE AND ptm.status = 'active'
        )
    );

-- Eliminar proyectos: solo el creador
CREATE POLICY "projects_delete_policy" ON projects
    FOR DELETE USING (creator_id = auth.uid());

-- ==========================================
-- 📋 POLÍTICAS PARA PROJECT_TEAM_MEMBERS
-- ==========================================

-- Ver miembros del equipo: según visibilidad del proyecto
CREATE POLICY "team_members_select_policy" ON project_team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.visibility = 'public' 
                 OR p.creator_id = auth.uid()
                 OR (p.visibility = 'connections_only' AND EXISTS (
                     SELECT 1 FROM connection_requests cr
                     WHERE ((cr.requester_id = auth.uid() AND cr.addressee_id = p.creator_id) 
                            OR (cr.requester_id = p.creator_id AND cr.addressee_id = auth.uid()))
                            AND cr.status = 'accepted'
                 ))
                 OR user_id = auth.uid())
        )
    );

-- Agregar miembros: creador del proyecto o admin
CREATE POLICY "team_members_insert_policy" ON project_team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.creator_id = auth.uid()
                 OR EXISTS (
                     SELECT 1 FROM project_team_members ptm
                     WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid() 
                           AND ptm.is_admin = TRUE AND ptm.status = 'active'
                 ))
        )
    );

-- Actualizar miembros: creador, admin, o el propio usuario
CREATE POLICY "team_members_update_policy" ON project_team_members
    FOR UPDATE USING (
        user_id = auth.uid() -- El usuario puede actualizar su propia info
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.creator_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = project_id AND ptm.user_id = auth.uid() 
                  AND ptm.is_admin = TRUE AND ptm.status = 'active'
        )
    );

-- ==========================================
-- 📋 POLÍTICAS PARA PROJECT_APPLICATIONS
-- ==========================================

-- Ver aplicaciones: creador del proyecto, admins, o el propio aplicante
CREATE POLICY "applications_select_policy" ON project_applications
    FOR SELECT USING (
        applicant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.creator_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = project_id AND ptm.user_id = auth.uid() 
                  AND ptm.is_admin = TRUE AND ptm.status = 'active'
        )
    );

-- Crear aplicaciones: usuarios autenticados
CREATE POLICY "applications_insert_policy" ON project_applications
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id 
                  AND p.accepts_applications = TRUE
                  AND p.status = 'active'
                  AND (p.application_deadline IS NULL OR p.application_deadline > CURRENT_DATE)
                  AND NOT EXISTS (
                      SELECT 1 FROM project_team_members ptm
                      WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
                  )
        )
    );

-- Actualizar aplicaciones: creador del proyecto, admins, o el aplicante (para withdraw)
CREATE POLICY "applications_update_policy" ON project_applications
    FOR UPDATE USING (
        applicant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id AND p.creator_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = project_id AND ptm.user_id = auth.uid() 
                  AND ptm.is_admin = TRUE AND ptm.status = 'active'
        )
    );

-- ==========================================
-- 📋 POLÍTICAS RESTANTES (IDEAS, UPDATES, ETC.)
-- ==========================================

-- PROJECT_IDEAS: Solo el usuario puede ver/modificar sus ideas
CREATE POLICY "ideas_all_policy" ON project_ideas
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PROJECT_UPDATES: Ver según proyecto, crear si eres del equipo
CREATE POLICY "updates_select_policy" ON project_updates
    FOR SELECT USING (
        visibility = 'public'
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.creator_id = auth.uid()
                 OR EXISTS (
                     SELECT 1 FROM project_team_members ptm
                     WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid() AND ptm.status = 'active'
                 ))
        )
    );

CREATE POLICY "updates_insert_policy" ON project_updates
    FOR INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.creator_id = auth.uid()
                 OR EXISTS (
                     SELECT 1 FROM project_team_members ptm
                     WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid() AND ptm.status = 'active'
                 ))
        )
    );

-- PROJECT_LIKES: Usuarios autenticados pueden dar like
CREATE POLICY "likes_select_policy" ON project_likes
    FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON project_likes
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'active')
    );

CREATE POLICY "likes_delete_policy" ON project_likes
    FOR DELETE USING (user_id = auth.uid());

-- PROJECT_BOOKMARKS: Solo el usuario puede ver/modificar sus bookmarks
CREATE POLICY "bookmarks_all_policy" ON project_bookmarks
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- PROJECT_VIEWS: Permitir inserción para analytics
CREATE POLICY "views_insert_policy" ON project_views
    FOR INSERT WITH CHECK (
        viewer_id IS NULL OR viewer_id = auth.uid()
    );

-- Políticas más permisivas para otras tablas (comentarios, métricas, etc.)
CREATE POLICY "comments_select_policy" ON project_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_policy" ON project_comments FOR INSERT WITH CHECK (commenter_id = auth.uid());

CREATE POLICY "categories_select_policy" ON project_categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "metrics_select_policy" ON project_metrics FOR SELECT USING (true);

CREATE POLICY "milestones_select_policy" ON project_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.visibility = 'public' OR p.creator_id = auth.uid()
                 OR EXISTS (
                     SELECT 1 FROM project_team_members ptm
                     WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid() AND ptm.status = 'active'
                 ))
        )
    );

COMMIT;

-- ==========================================
-- 🔧 FUNCIONES ÚTILES PARA LA APLICACIÓN
-- ==========================================

BEGIN;

-- Función para buscar proyectos
CREATE OR REPLACE FUNCTION search_projects(
    search_term TEXT DEFAULT '',
    category_filter TEXT DEFAULT '',
    industry_filter TEXT DEFAULT '',
    stage_filter TEXT DEFAULT '',
    seeking_cofounder BOOLEAN DEFAULT NULL,
    seeking_investors BOOLEAN DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    tagline VARCHAR,
    description TEXT,
    category VARCHAR,
    industry VARCHAR,
    stage VARCHAR,
    creator_id UUID,
    creator_name TEXT,
    creator_avatar TEXT,
    logo_url TEXT,
    view_count INTEGER,
    like_count INTEGER,
    application_count INTEGER,
    team_size_current INTEGER,
    is_seeking_cofounder BOOLEAN,
    is_seeking_investors BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    last_activity_at TIMESTAMP WITHOUT TIME ZONE,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.tagline,
        p.description,
        p.category,
        p.industry,
        p.stage,
        p.creator_id,
        (up.first_name || ' ' || up.last_name) as creator_name,
        up.avatar_url as creator_avatar,
        p.logo_url,
        p.view_count,
        p.like_count,
        p.application_count,
        p.team_size_current,
        p.is_seeking_cofounder,
        p.is_seeking_investors,
        p.created_at,
        p.last_activity_at,
        CASE 
            WHEN search_term = '' THEN 1.0
            ELSE 
                ts_rank(
                    to_tsvector('spanish', 
                        COALESCE(p.title, '') || ' ' || 
                        COALESCE(p.tagline, '') || ' ' || 
                        COALESCE(p.description, '')
                    ), 
                    plainto_tsquery('spanish', search_term)
                )
        END as relevance_score
    FROM projects p
    LEFT JOIN user_profiles up ON p.creator_id = up.user_id
    WHERE 
        p.status = 'active'
        AND p.visibility = 'public'
        AND (search_term = '' OR 
             to_tsvector('spanish', 
                COALESCE(p.title, '') || ' ' || 
                COALESCE(p.tagline, '') || ' ' || 
                COALESCE(p.description, '')
             ) @@ plainto_tsquery('spanish', search_term))
        AND (category_filter = '' OR p.category = category_filter)
        AND (industry_filter = '' OR p.industry = industry_filter)
        AND (stage_filter = '' OR p.stage = stage_filter)
        AND (seeking_cofounder IS NULL OR p.is_seeking_cofounder = seeking_cofounder)
        AND (seeking_investors IS NULL OR p.is_seeking_investors = seeking_investors)
    ORDER BY relevance_score DESC, p.last_activity_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener proyectos recomendados para un usuario
CREATE OR REPLACE FUNCTION get_recommended_projects(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    tagline VARCHAR,
    category VARCHAR,
    industry VARCHAR,
    creator_name TEXT,
    logo_url TEXT,
    compatibility_score INTEGER
) AS $$
DECLARE
    user_skills TEXT[];
    user_industry TEXT;
    user_objectives TEXT[];
BEGIN
    -- Obtener información del usuario
    SELECT up.industry, array_agg(DISTINCT us.skill_name), array_agg(DISTINCT uo.objective_type)
    INTO user_industry, user_skills, user_objectives
    FROM user_profiles up
    LEFT JOIN user_skills us ON up.user_id = us.user_id
    LEFT JOIN user_objectives uo ON up.user_id = uo.user_id
    WHERE up.user_id = target_user_id
    GROUP BY up.industry;

    RETURN QUERY
    SELECT 
        p.id as project_id,
        p.title,
        p.tagline,
        p.category,
        p.industry,
        (up.first_name || ' ' || up.last_name) as creator_name,
        p.logo_url,
        (
            -- Score basado en industry match
            CASE WHEN p.industry = user_industry THEN 30 ELSE 0 END +
            -- Score basado en skills requeridas que el usuario tiene
            (SELECT COUNT(*) * 20 FROM unnest(user_skills) skill 
             WHERE skill = ANY(SELECT jsonb_array_elements_text(p.required_skills))) +
            -- Bonus si buscan cofundador y el usuario tiene objetivos de emprendimiento
            CASE WHEN p.is_seeking_cofounder AND 'entrepreneurship' = ANY(user_objectives) THEN 20 ELSE 0 END +
            -- Factor de actividad reciente
            CASE WHEN p.last_activity_at > NOW() - INTERVAL '7 days' THEN 10 ELSE 0 END
        )::INTEGER as compatibility_score
    FROM projects p
    LEFT JOIN user_profiles up ON p.creator_id = up.user_id
    WHERE 
        p.status = 'active'
        AND p.visibility = 'public'
        AND p.creator_id != target_user_id
        AND NOT EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = p.id AND ptm.user_id = target_user_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM project_applications pa
            WHERE pa.project_id = p.id AND pa.applicant_id = target_user_id
        )
    ORDER BY compatibility_score DESC, p.last_activity_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de un proyecto
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS TABLE (
    total_views BIGINT,
    unique_views BIGINT,
    total_likes BIGINT,
    total_applications BIGINT,
    team_members BIGINT,
    recent_activity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT pv.viewer_id) as unique_views,
        COUNT(DISTINCT pl.id) as total_likes,
        COUNT(DISTINCT pa.id) as total_applications,
        COUNT(DISTINCT ptm.id) as team_members,
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.published_at > NOW() - INTERVAL '30 days') as recent_activity_count
    FROM projects p
    LEFT JOIN project_views pv ON p.id = pv.project_id
    LEFT JOIN project_likes pl ON p.id = pl.project_id
    LEFT JOIN project_applications pa ON p.id = pa.project_id
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id AND ptm.status = 'active'
    LEFT JOIN project_updates pu ON p.id = pu.project_id
    WHERE p.id = project_uuid
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==========================================
-- 📊 DATOS INICIALES (CATEGORÍAS)
-- ==========================================

BEGIN;

INSERT INTO project_categories (name, display_name, description, icon, color) VALUES
('startup', 'Startup', 'Empresas emergentes en busca de crecimiento y escalabilidad', 'rocket', '#FF6B6B'),
('side-project', 'Proyecto Personal', 'Proyectos secundarios y experimentos creativos', 'lightbulb', '#4ECDC4'),
('mvp', 'MVP', 'Productos mínimos viables en desarrollo', 'prototype', '#45B7D1'),
('saas', 'SaaS', 'Software como Servicio', 'cloud', '#96CEB4'),
('mobile-app', 'App Móvil', 'Aplicaciones para dispositivos móviles', 'smartphone', '#FFEAA7'),
('web-app', 'Aplicación Web', 'Aplicaciones y plataformas web', 'globe', '#DDA0DD'),
('ai-ml', 'IA & Machine Learning', 'Proyectos de inteligencia artificial y aprendizaje automático', 'brain', '#FF7675'),
('blockchain', 'Blockchain', 'Proyectos basados en tecnología blockchain', 'link', '#6C5CE7'),
('fintech', 'Fintech', 'Tecnología financiera', 'dollar-sign', '#00B894'),
('healthtech', 'Healthtech', 'Tecnología aplicada a la salud', 'heart', '#E17055'),
('edtech', 'Edtech', 'Tecnología educativa', 'book', '#0984E3'),
('ecommerce', 'E-commerce', 'Comercio electrónico', 'shopping-cart', '#FD79A8'),
('social', 'Red Social', 'Plataformas y redes sociales', 'users', '#FDCB6E'),
('gaming', 'Gaming', 'Videojuegos y entretenimiento', 'gamepad2', '#A29BFE'),
('iot', 'IoT', 'Internet de las Cosas', 'wifi', '#74B9FF'),
('sustainability', 'Sostenibilidad', 'Proyectos enfocados en sostenibilidad y medio ambiente', 'leaf', '#55A3FF'),
('nonprofit', 'Sin Ánimo de Lucro', 'Organizaciones y proyectos sociales', 'heart-handshake', '#26DE81'),
('other', 'Otro', 'Otros tipos de proyectos', 'folder', '#778CA3');

COMMIT;

-- ==========================================
-- 🎯 MENSAJE FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA DE PROYECTOS CONFIGURADO EXITOSAMENTE';
    RAISE NOTICE '📊 Tablas creadas: 12';
    RAISE NOTICE '🔍 Índices creados: 25+';
    RAISE NOTICE '🔒 Políticas RLS: Configuradas';
    RAISE NOTICE '⚙️ Funciones: 4';
    RAISE NOTICE '🏷️ Categorías: 18';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 El sistema está listo para implementar la funcionalidad de proyectos';
    RAISE NOTICE '📋 Revisa el archivo PROJECTS_SPECIFICATION.md para los siguientes pasos';
END $$;
