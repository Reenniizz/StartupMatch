-- ==========================================
-- 📁 SUPABASE STORAGE SETUP - PROYECTOS
-- StartupMatch - Configuración completa de Storage
-- Version: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 🗂️ CREAR BUCKETS DE STORAGE
-- ==========================================

-- Bucket principal para archivos de proyectos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects', 
    true,
    52428800, -- 50MB limit
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- PPTX
        'application/vnd.ms-powerpoint', -- PPT
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- DOCX
        'application/msword', -- DOC
        'text/plain', 'text/markdown',
        'application/zip', 'application/x-zip-compressed'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares y logos (más pequeño, solo imágenes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-assets',
    'project-assets',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Bucket privado para documentos sensibles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-documents',
    'project-documents',
    false, -- Privado
    104857600, -- 100MB limit
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain', 'text/markdown'
    ]
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 🔐 POLÍTICAS DE STORAGE
-- ==========================================

-- BUCKET: projects (público)
-- Política para ver archivos (público)
CREATE POLICY "projects_storage_select_policy" ON storage.objects
FOR SELECT
USING (bucket_id = 'projects');

-- Política para subir archivos (solo usuarios autenticados)
CREATE POLICY "projects_storage_insert_policy" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'projects' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para actualizar archivos (solo el propietario)
CREATE POLICY "projects_storage_update_policy" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'projects' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para eliminar archivos (solo el propietario)
CREATE POLICY "projects_storage_delete_policy" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'projects' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- BUCKET: project-assets (público)
-- Política para ver assets (público)
CREATE POLICY "project_assets_storage_select_policy" ON storage.objects
FOR SELECT
USING (bucket_id = 'project-assets');

-- Política para subir assets (solo usuarios autenticados)
CREATE POLICY "project_assets_storage_insert_policy" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'project-assets' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para actualizar assets (solo el propietario)
CREATE POLICY "project_assets_storage_update_policy" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'project-assets' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para eliminar assets (solo el propietario)
CREATE POLICY "project_assets_storage_delete_policy" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'project-assets' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- BUCKET: project-documents (privado)
-- Política para ver documentos (solo propietario y miembros del proyecto)
CREATE POLICY "project_documents_storage_select_policy" ON storage.objects
FOR SELECT
USING (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (
        -- Es el propietario del archivo
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Es miembro del equipo del proyecto
        EXISTS (
            SELECT 1 FROM project_team_members ptm
            JOIN projects p ON p.id = ptm.project_id
            WHERE ptm.user_id = auth.uid()
            AND p.id::text = (storage.foldername(name))[2]
            AND ptm.status = 'active'
        )
        OR
        -- Es el creador del proyecto
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.creator_id = auth.uid()
            AND p.id::text = (storage.foldername(name))[2]
        )
    )
);

-- Política para subir documentos (solo usuarios autenticados)
CREATE POLICY "project_documents_storage_insert_policy" ON storage.objects
FOR INSERT 
WITH CHECK (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para actualizar documentos (solo el propietario)
CREATE POLICY "project_documents_storage_update_policy" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para eliminar documentos (solo el propietario)
CREATE POLICY "project_documents_storage_delete_policy" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'project-documents' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- 📋 TABLA PARA TRACKING DE ARCHIVOS
-- ==========================================

CREATE TABLE project_files (
    -- Identificadores
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información del archivo
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Ruta en storage
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Categorización
    file_type VARCHAR(50) NOT NULL 
        CHECK (file_type IN (
            'logo', 'cover_image', 'demo_video', 'pitch_deck', 
            'document', 'image', 'video', 'presentation', 'other'
        )),
    category VARCHAR(50) DEFAULT 'other',
    
    -- Metadatos
    title VARCHAR(200),
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Storage info
    bucket_name VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    
    -- Control
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Índices para project_files
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_uploader ON project_files(uploader_id);
CREATE INDEX idx_project_files_type ON project_files(file_type);
CREATE INDEX idx_project_files_public ON project_files(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_project_files_created ON project_files(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_project_files_updated_at 
    BEFORE UPDATE ON project_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 🔐 RLS PARA TABLA project_files
-- ==========================================

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Política para ver archivos
CREATE POLICY "project_files_select_policy" ON project_files
FOR SELECT
USING (
    -- Archivos públicos del proyecto público
    (is_public = TRUE AND EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id 
        AND p.visibility = 'public' 
        AND p.status = 'active'
    ))
    OR
    -- Es miembro del equipo o creador
    (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id 
        AND (
            p.creator_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM project_team_members ptm 
                WHERE ptm.project_id = p.id 
                AND ptm.user_id = auth.uid() 
                AND ptm.status = 'active'
            )
        )
    ))
);

-- Política para subir archivos
CREATE POLICY "project_files_insert_policy" ON project_files
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND uploader_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id 
        AND (
            p.creator_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM project_team_members ptm 
                WHERE ptm.project_id = p.id 
                AND ptm.user_id = auth.uid() 
                AND ptm.status = 'active'
            )
        )
    )
);

-- Política para actualizar archivos
CREATE POLICY "project_files_update_policy" ON project_files
FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND (
        uploader_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND p.creator_id = auth.uid()
        )
    )
);

-- Política para eliminar archivos
CREATE POLICY "project_files_delete_policy" ON project_files
FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND (
        uploader_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_id 
            AND p.creator_id = auth.uid()
        )
    )
);

-- ==========================================
-- 🔧 FUNCIONES AUXILIARES PARA STORAGE
-- ==========================================

-- Función para obtener archivos de un proyecto
CREATE OR REPLACE FUNCTION get_project_files(project_uuid UUID)
RETURNS TABLE (
    id UUID,
    file_name VARCHAR,
    file_type VARCHAR,
    file_size BIGINT,
    mime_type VARCHAR,
    title VARCHAR,
    description TEXT,
    is_public BOOLEAN,
    public_url TEXT,
    created_at TIMESTAMP,
    uploader_name TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        pf.id,
        pf.file_name,
        pf.file_type,
        pf.file_size,
        pf.mime_type,
        pf.title,
        pf.description,
        pf.is_public,
        pf.public_url,
        pf.created_at,
        CONCAT(up.first_name, ' ', up.last_name) as uploader_name
    FROM project_files pf
    LEFT JOIN user_profiles up ON up.user_id = pf.uploader_id
    WHERE pf.project_id = project_uuid
    ORDER BY pf.display_order ASC, pf.created_at DESC;
$$;

-- Función para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphaned_project_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Eliminar registros de archivos cuyos proyectos ya no existen
    DELETE FROM project_files 
    WHERE project_id NOT IN (SELECT id FROM projects);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

COMMIT;

-- ==========================================
-- 📝 INSTRUCCIONES DE USO
-- ==========================================

/*
ESTRUCTURA DE CARPETAS EN STORAGE:

projects/
├── {user_id}/
│   ├── {project_id}/
│   │   ├── cover-images/
│   │   ├── demos/
│   │   └── media/

project-assets/
├── {user_id}/
│   ├── logos/
│   ├── avatars/
│   └── icons/

project-documents/
├── {user_id}/
│   ├── {project_id}/
│   │   ├── pitch-decks/
│   │   ├── business-plans/
│   │   └── contracts/

EJEMPLO DE RUTAS:
- Logo: project-assets/123e4567-e89b-12d3-a456-426614174000/logos/logo.png
- Video demo: projects/123e4567-e89b-12d3-a456-426614174000/abc-project-id/demos/demo.mp4
- Pitch deck: project-documents/123e4567-e89b-12d3-a456-426614174000/abc-project-id/pitch-decks/deck.pdf
*/
