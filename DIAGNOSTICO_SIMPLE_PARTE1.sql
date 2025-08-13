-- 🔍 DIAGNÓSTICO SIMPLE DEL TRIGGER - PARTE 1
-- Ejecutar en Supabase SQL Editor

-- 🎯 PASO 1: Verificar que el trigger existe
SELECT 
    'TRIGGER STATUS' as check_type,
    trigger_name, 
    event_object_table as tabla,
    event_manipulation as evento,
    action_timing as momento
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

-- 🎯 PASO 2: Verificar que la función existe
SELECT 
    'FUNCTION STATUS' as check_type,
    routine_name as nombre_funcion,
    routine_type as tipo,
    is_deterministic as deterministico
FROM information_schema.routines 
WHERE routine_name = 'create_user_profile'
  AND routine_schema = 'public';

-- 🎯 PASO 3: Verificar estructura de user_profiles
SELECT 
    'TABLE STRUCTURE' as check_type,
    column_name,
    is_nullable,
    data_type,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 🎯 PASO 4: Verificar si hay usuarios sin perfil
SELECT 
    'USERS WITHOUT PROFILE' as check_type,
    u.id,
    u.email,
    u.created_at,
    CASE WHEN p.user_id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 10;
