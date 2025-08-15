-- Script para verificar y crear tabla de proyectos
-- Solo ejecutar si no existe la tabla

-- Verificar si la tabla existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        -- Crear tabla projects básica
        CREATE TABLE projects (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            tagline VARCHAR(300),
            description TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'draft' 
                CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived')),
            visibility VARCHAR(20) NOT NULL DEFAULT 'public' 
                CHECK (visibility IN ('public', 'private', 'connections_only', 'team_only')),
            is_featured BOOLEAN DEFAULT FALSE,
            category VARCHAR(50) NOT NULL DEFAULT 'startup',
            stage VARCHAR(30) DEFAULT 'idea' 
                CHECK (stage IN ('idea', 'mvp', 'beta', 'launch', 'growth', 'scaling', 'exit')),
            logo_url TEXT,
            cover_image_url TEXT,
            demo_url TEXT,
            tech_stack TEXT[] DEFAULT '{}',
            required_skills TEXT[] DEFAULT '{}',
            tags TEXT[] DEFAULT '{}',
            budget_min INTEGER DEFAULT 0,
            budget_max INTEGER DEFAULT 0,
            budget_currency VARCHAR(3) DEFAULT 'USD',
            is_seeking_cofounder BOOLEAN DEFAULT FALSE,
            is_seeking_investors BOOLEAN DEFAULT FALSE,
            is_seeking_team BOOLEAN DEFAULT TRUE,
            team_size_current INTEGER DEFAULT 1,
            team_size_target INTEGER DEFAULT 1,
            location_type VARCHAR(20) DEFAULT 'remote' 
                CHECK (location_type IN ('remote', 'hybrid', 'onsite')),
            location_city VARCHAR(100),
            location_country VARCHAR(100),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(50),
            contact_website TEXT,
            contact_social_links JSONB DEFAULT '{}',
            like_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            application_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

        -- Crear políticas básicas
        CREATE POLICY "projects_select_policy" ON projects
            FOR SELECT USING (
                visibility = 'public' 
                OR creator_id = auth.uid()
            );

        CREATE POLICY "projects_insert_policy" ON projects
            FOR INSERT WITH CHECK (auth.uid() = creator_id);

        CREATE POLICY "projects_update_policy" ON projects
            FOR UPDATE USING (creator_id = auth.uid());

        CREATE POLICY "projects_delete_policy" ON projects
            FOR DELETE USING (creator_id = auth.uid());

        -- Crear índices
        CREATE INDEX idx_projects_creator_id ON projects(creator_id);
        CREATE INDEX idx_projects_category ON projects(category);
        CREATE INDEX idx_projects_stage ON projects(stage);
        CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
        CREATE INDEX idx_projects_status ON projects(status);
        CREATE INDEX idx_projects_visibility ON projects(visibility);

        RAISE NOTICE 'Tabla projects creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla projects ya existe';
    END IF;
END
$$;
