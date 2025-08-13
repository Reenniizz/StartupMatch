-- 🔍 DIAGNÓSTICO SIMPLE DEL TRIGGER - PARTE 2
-- Ejecutar en Supabase SQL Editor después de la PARTE 1

-- 🎯 PASO 5: Verificar permisos RLS
SELECT 
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_skills', 'user_objectives')
ORDER BY tablename, policyname;

-- 🎯 PASO 6: Verificar foreign keys
SELECT 
    'FOREIGN KEYS' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_profiles', 'user_skills', 'user_objectives');

-- 🎯 PASO 7: Ver últimos usuarios en auth.users
SELECT 
    'AUTH USERS' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE WHEN raw_user_meta_data IS NOT NULL THEN 'CON METADATA' ELSE 'SIN METADATA' END as metadata_status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
