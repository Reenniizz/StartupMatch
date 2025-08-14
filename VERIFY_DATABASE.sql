-- ==========================================
-- 🔍 VERIFICAR ESTADO DE LA BASE DE DATOS
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1️⃣ Verificar si las tablas principales existen
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('projects', 'project_files', 'user_profiles')
ORDER BY tablename;

-- 2️⃣ Verificar buckets de storage
SELECT 
    id,
    name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets
ORDER BY name;

-- 3️⃣ Verificar políticas RLS en projects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- 4️⃣ Verificar estructura de la tabla projects (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- 5️⃣ Contar registros en las tablas principales
SELECT 
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM project_files) as total_project_files,
    (SELECT COUNT(*) FROM user_profiles) as total_user_profiles;
