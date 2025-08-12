-- VERIFICAR_USUARIOS.sql
-- Script para verificar qué usuarios existen y obtener sus UUIDs reales

-- Mostrar estructura de usuarios/profiles
SELECT 'ESTRUCTURA auth.users' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;

SELECT 'ESTRUCTURA profiles' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Mostrar usuarios existentes
SELECT 'USUARIOS EN auth.users' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'USUARIOS EN profiles' as info;
SELECT id, first_name, last_name, email, company, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar los UUIDs específicos que intentaste usar
SELECT 'VERIFICACIÓN DE UUIDs ESPECÍFICOS' as info;
SELECT 
    '5e85777c-6430-4e51-bbf9-374cf6b61e09' as uuid_buscado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '5e85777c-6430-4e51-bbf9-374cf6b61e09') 
        THEN '✅ Existe en auth.users' 
        ELSE '❌ NO existe en auth.users' 
    END as estado_auth_users,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '5e85777c-6430-4e51-bbf9-374cf6b61e09') 
        THEN '✅ Existe en profiles' 
        ELSE '❌ NO existe en profiles' 
    END as estado_profiles;

SELECT 
    'dd2418c7-3d65-4a49-8b8a-40a0e75faa09' as uuid_buscado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'dd2418c7-3d65-4a49-8b8a-40a0e75faa09') 
        THEN '✅ Existe en auth.users' 
        ELSE '❌ NO existe en auth.users' 
    END as estado_auth_users,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = 'dd2418c7-3d65-4a49-8b8a-40a0e75faa09') 
        THEN '✅ Existe en profiles' 
        ELSE '❌ NO existe en profiles' 
    END as estado_profiles;

-- Obtener los primeros dos usuarios reales para usar en la conversación
SELECT 'PRIMEROS DOS USUARIOS PARA CONVERSACIÓN' as info;
SELECT id, 
       COALESCE(first_name || ' ' || last_name, email) as nombre,
       email,
       company,
       created_at
FROM profiles 
ORDER BY created_at ASC 
LIMIT 2;
