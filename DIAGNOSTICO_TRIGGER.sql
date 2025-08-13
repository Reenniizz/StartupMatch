-- 🔍 DIAGNÓSTICO DEL TRIGGER DE REGISTRO
-- Ejecutar en Supabase SQL Editor para diagnosticar el problema

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

-- 🎯 PASO 5: Probar la función manualmente con datos de prueba
DO $$
DECLARE
    test_user_id uuid := '00000000-1111-2222-3333-444444444444';
    test_email text := 'test@example.com';
    test_metadata jsonb := '{
        "firstName": "Test",
        "lastName": "User", 
        "username": "testuser",
        "role": "Desarrollador",
        "industry": "Tecnología",
        "location": "Madrid",
        "skills": ["JavaScript", "React", "Node.js"],
        "lookingFor": ["Co-fundador técnico"]
    }'::jsonb;
BEGIN
    -- Simular inserción en auth.users para probar trigger
    RAISE NOTICE '🧪 PROBANDO FUNCIÓN create_user_profile MANUALMENTE';
    
    -- Limpiar usuario de prueba si existe
    DELETE FROM user_profiles WHERE user_id = test_user_id;
    
    -- Probar función directamente
    BEGIN
        -- Simular NEW record
        INSERT INTO user_profiles (
            user_id, 
            email,
            username,
            first_name,
            last_name,
            role,
            industry,
            location,
            phone
        ) VALUES (
            test_user_id,
            test_email,
            COALESCE(test_metadata->>'username', split_part(test_email, '@', 1)),
            COALESCE(test_metadata->>'firstName', 'Usuario'),
            COALESCE(test_metadata->>'lastName', 'Nuevo'),
            COALESCE(test_metadata->>'role', 'Profesional'),
            COALESCE(test_metadata->>'industry', 'Tecnología'),
            COALESCE(test_metadata->>'location', 'No especificado'),
            COALESCE(test_metadata->>'phone', NULL)
        );
        
        RAISE NOTICE '✅ Inserción en user_profiles EXITOSA';
        
        -- Probar inserción en user_skills
        BEGIN
            INSERT INTO user_skills (user_id, skill_name, skill_level, skill_category)
            SELECT 
                test_user_id,
                TRIM(skill_name),
                5,
                'technical'
            FROM json_array_elements_text((test_metadata->>'skills')::json) AS skill_name
            WHERE TRIM(skill_name) != '' 
              AND TRIM(skill_name) IS NOT NULL 
              AND LENGTH(TRIM(skill_name)) > 1;
            
            RAISE NOTICE '✅ Inserción en user_skills EXITOSA';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error en user_skills: %', SQLERRM;
        END;
        
        -- Probar inserción en user_objectives
        BEGIN
            INSERT INTO user_objectives (user_id, objective_type, priority)
            SELECT 
                test_user_id,
                TRIM(objective),
                1
            FROM json_array_elements_text((test_metadata->>'lookingFor')::json) AS objective
            WHERE TRIM(objective) != '' 
              AND TRIM(objective) IS NOT NULL 
              AND LENGTH(TRIM(objective)) > 1;
            
            RAISE NOTICE '✅ Inserción en user_objectives EXITOSA';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error en user_objectives: %', SQLERRM;
        END;
        
        -- Limpiar datos de prueba
        DELETE FROM user_objectives WHERE user_id = test_user_id;
        DELETE FROM user_skills WHERE user_id = test_user_id;
        DELETE FROM user_profiles WHERE user_id = test_user_id;
        
        RAISE NOTICE '🧹 Datos de prueba limpiados';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR PRINCIPAL: %', SQLERRM;
        RAISE NOTICE '❌ DETALLE: %', SQLSTATE;
    END;
END $$;

-- 🎯 PASO 6: Verificar permisos RLS
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

-- 🎯 PASO 7: Verificar foreign keys
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

SELECT '🔍 DIAGNÓSTICO COMPLETADO' as resultado;
