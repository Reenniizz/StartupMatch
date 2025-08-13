-- ==========================================
-- DIAGNÓSTICO COMPLETO DE USUARIOS Y PERFILES
-- Script corregido para identificar problemas de integridad
-- ==========================================

-- 1. Verificar si el usuario problemático existe
SELECT 
    'Usuario 5e85777c-6430-4e51-bbf9-374cf6b61e09:' as info,
    'Existe en auth.users: ' || CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = '5e85777c-6430-4e51-bbf9-374cf6b61e09') THEN 'SÍ' ELSE 'NO' END as auth_users,
    'Existe en user_profiles: ' || CASE WHEN EXISTS(SELECT 1 FROM user_profiles WHERE user_id = '5e85777c-6430-4e51-bbf9-374cf6b61e09') THEN 'SÍ' ELSE 'NO' END as user_profiles;

-- 2. Contar totales por separado
SELECT 'TOTALES:' as seccion, '' as detalle;
SELECT 'auth.users' as tabla, COUNT(*) as total FROM auth.users;
SELECT 'user_profiles' as tabla, COUNT(*) as total FROM user_profiles;

-- 3. Ver usuarios en auth.users
SELECT 'USUARIOS EN AUTH.USERS:' as titulo;
SELECT email, id::text as user_id FROM auth.users ORDER BY created_at DESC;

-- 4. Ver perfiles en user_profiles
SELECT 'PERFILES EN USER_PROFILES:' as titulo;
SELECT email, user_id::text FROM user_profiles ORDER BY created_at DESC;

-- 5. Encontrar perfiles huérfanos (que no tienen usuario en auth.users)
SELECT 'PERFILES HUÉRFANOS (sin usuario en auth.users):' as titulo;
SELECT 
    p.email,
    p.user_id::text,
    p.username
FROM user_profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- 6. Encontrar usuarios sin perfil
SELECT 'USUARIOS SIN PERFIL (sin registro en user_profiles):' as titulo;
SELECT 
    u.email,
    u.id::text as user_id
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;
