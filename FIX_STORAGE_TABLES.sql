-- ==========================================
-- 🔧 FIX STORAGE TABLES - Solución de Problemas
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1️⃣ CREAR TABLA project_files SI NO EXISTE
CREATE TABLE IF NOT EXISTS project_files (
    -- Identificadores
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    uploader_id UUID NOT NULL,
    
    -- Información del archivo
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
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

-- 2️⃣ CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploader ON project_files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_project_files_type ON project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_public ON project_files(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_project_files_created ON project_files(created_at);

-- 3️⃣ HABILITAR RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- 4️⃣ POLÍTICAS RLS BÁSICAS
DROP POLICY IF EXISTS "project_files_select_policy" ON project_files;
CREATE POLICY "project_files_select_policy" ON project_files
FOR SELECT
USING (
    -- Permitir ver archivos públicos O archivos del usuario
    is_public = TRUE 
    OR uploader_id = auth.uid()
);

DROP POLICY IF EXISTS "project_files_insert_policy" ON project_files;
CREATE POLICY "project_files_insert_policy" ON project_files
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND uploader_id = auth.uid()
);

DROP POLICY IF EXISTS "project_files_update_policy" ON project_files;
CREATE POLICY "project_files_update_policy" ON project_files
FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND uploader_id = auth.uid()
);

DROP POLICY IF EXISTS "project_files_delete_policy" ON project_files;
CREATE POLICY "project_files_delete_policy" ON project_files
FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND uploader_id = auth.uid()
);

-- 5️⃣ VERIFICAR/CREAR BUCKETS DE STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects', 
    true,
    52428800, -- 50MB
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf',
        'text/plain', 'text/markdown'
    ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-assets',
    'project-assets',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-documents',
    'project-documents',
    false,
    104857600, -- 100MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'text/plain', 'text/markdown'
    ]
) ON CONFLICT (id) DO NOTHING;

-- 6️⃣ POLÍTICAS STORAGE BÁSICAS
-- Eliminar políticas existentes primero
DROP POLICY IF EXISTS "projects_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "projects_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_storage_insert" ON storage.objects;

-- Crear nuevas políticas
CREATE POLICY "projects_storage_select" ON storage.objects
FOR SELECT USING (bucket_id = 'projects');

CREATE POLICY "projects_storage_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'projects' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "project_assets_storage_select" ON storage.objects
FOR SELECT USING (bucket_id = 'project-assets');

CREATE POLICY "project_assets_storage_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' 
    AND auth.uid() IS NOT NULL
);

-- 7️⃣ VERIFICACIONES FINALES
SELECT 
    'project_files' as tabla,
    COUNT(*) as registros
FROM project_files
UNION ALL
SELECT 
    'buckets' as tabla,
    COUNT(*) as registros
FROM storage.buckets
WHERE name IN ('projects', 'project-assets', 'project-documents');
