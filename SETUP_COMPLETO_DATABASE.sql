-- ==========================================
-- 🔧 SETUP COMPLETO - BASE DE DATOS Y STORAGE
-- Ejecutar TODO este script en Supabase SQL Editor
-- ==========================================

-- PASO 1: CREAR TABLA PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    visibility VARCHAR(20) DEFAULT 'public',
    stage VARCHAR(50) DEFAULT 'idea',
    budget_min INTEGER DEFAULT 0,
    budget_max INTEGER,
    location VARCHAR(200),
    timeline VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- PASO 2: CREAR TABLA PROJECT_FILES
CREATE TABLE IF NOT EXISTS project_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    uploader_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL 
        CHECK (file_type IN (
            'logo', 'cover_image', 'demo_video', 'pitch_deck', 
            'document', 'image', 'video', 'presentation', 'other'
        )),
    category VARCHAR(50) DEFAULT 'other',
    title VARCHAR(200),
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    bucket_name VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- PASO 3: HABILITAR RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- PASO 4: POLÍTICAS PARA PROJECTS (MUY PERMISIVAS PARA TESTING)
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT USING (true); -- Permitir todo por ahora

DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "projects_update_policy" ON projects;
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
CREATE POLICY "projects_delete_policy" ON projects
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PASO 5: POLÍTICAS PARA PROJECT_FILES (MUY PERMISIVAS PARA TESTING)
DROP POLICY IF EXISTS "project_files_select_policy" ON project_files;
CREATE POLICY "project_files_select_policy" ON project_files
FOR SELECT USING (true); -- Permitir todo por ahora

DROP POLICY IF EXISTS "project_files_insert_policy" ON project_files;
CREATE POLICY "project_files_insert_policy" ON project_files
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_files_update_policy" ON project_files;
CREATE POLICY "project_files_update_policy" ON project_files
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_files_delete_policy" ON project_files;
CREATE POLICY "project_files_delete_policy" ON project_files
FOR DELETE USING (auth.uid() IS NOT NULL);

-- PASO 6: CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploader ON project_files(uploader_id);

-- PASO 7: CREAR BUCKETS DE STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects', 
    true,
    52428800,
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-assets',
    'project-assets',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-documents',
    'project-documents',
    false,
    104857600,
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- PASO 8: POLÍTICAS DE STORAGE (MUY PERMISIVAS PARA TESTING)
DROP POLICY IF EXISTS "projects_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "projects_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "projects_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "projects_storage_delete" ON storage.objects;

CREATE POLICY "projects_storage_select" ON storage.objects
FOR SELECT USING (bucket_id = 'projects');

CREATE POLICY "projects_storage_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'projects' AND auth.uid() IS NOT NULL);

CREATE POLICY "projects_storage_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'projects' AND auth.uid() IS NOT NULL);

CREATE POLICY "projects_storage_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'projects' AND auth.uid() IS NOT NULL);

-- Políticas para project-assets
DROP POLICY IF EXISTS "project_assets_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "project_assets_storage_delete" ON storage.objects;

CREATE POLICY "project_assets_storage_select" ON storage.objects
FOR SELECT USING (bucket_id = 'project-assets');

CREATE POLICY "project_assets_storage_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "project_assets_storage_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "project_assets_storage_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

-- PASO 9: INSERTAR PROYECTO DE PRUEBA
INSERT INTO projects (
    title,
    description,
    creator_id,
    category,
    status,
    visibility,
    industry
) VALUES (
    '🧪 Proyecto de Prueba - Storage Test',
    'Proyecto temporal para probar el sistema de Storage',
    '3ba6c41a-1f33-4832-97e4-774e523fe001', -- Tu user ID
    'Tecnología',
    'active',
    'public',
    'Tecnología' -- Agregar industry requerida
);

-- Obtener el ID del proyecto de prueba creado
DO $$
DECLARE
    test_project_uuid UUID;
BEGIN
    -- Buscar el proyecto de prueba más reciente
    SELECT id INTO test_project_uuid 
    FROM projects 
    WHERE title = '🧪 Proyecto de Prueba - Storage Test'
    AND creator_id = '3ba6c41a-1f33-4832-97e4-774e523fe001'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_project_uuid IS NOT NULL THEN
        RAISE NOTICE 'Proyecto de prueba ID: %', test_project_uuid;
    ELSE
        RAISE NOTICE 'No se encontró el proyecto de prueba';
    END IF;
END $$;

-- PASO 10: VERIFICACIÓN FINAL
SELECT 'Verificación Final:' as status;

SELECT 
    'projects' as tabla,
    COUNT(*) as registros,
    'Tabla projects creada' as descripcion
FROM projects
UNION ALL
SELECT 
    'project_files' as tabla,
    COUNT(*) as registros,
    'Tabla project_files creada' as descripcion
FROM project_files
UNION ALL
SELECT 
    'storage_buckets' as tabla,
    COUNT(*) as registros,
    'Buckets de storage' as descripcion
FROM storage.buckets
WHERE name IN ('projects', 'project-assets', 'project-documents');

-- Verificar proyecto de prueba
SELECT 
    'test-project' as tipo,
    COUNT(*) as existe,
    'Proyecto de prueba creado' as descripcion
FROM projects 
WHERE title = '🧪 Proyecto de Prueba - Storage Test';

-- Mostrar el ID del proyecto de prueba
SELECT 
    id as project_id,
    title,
    'Usar este ID en el test' as nota
FROM projects 
WHERE title = '🧪 Proyecto de Prueba - Storage Test';
