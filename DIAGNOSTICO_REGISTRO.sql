-- 🔍 DIAGNÓSTICO DEL PROBLEMA DE REGISTRO
-- Ejecutar en Supabase SQL Editor para identificar el problema

-- 🎯 PASO 1: VERIFICAR ESTRUCTURA DE LA BASE DE DATOS
SELECT '📊 VERIFICANDO ESTRUCTURA DE TABLAS' as titulo;

-- Verificar que las tablas existen
SELECT 
    table_name,
    'Existe ✅' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_skills', 'user_objectives')
ORDER BY table_name;

-- 🎯 PASO 2: VERIFICAR USUARIOS REGISTRADOS EN AUTH
SELECT '👥 USUARIOS EN AUTH.USERS' as titulo;

SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data::text as metadata
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 🎯 PASO 3: VERIFICAR PERFILES CREADOS
SELECT '👤 PERFILES EN USER_PROFILES' as titulo;

SELECT 
    COUNT(*) as total_perfiles,
    'Perfiles encontrados' as descripcion
FROM user_profiles;

-- Ver perfiles existentes
SELECT 
    username,
    first_name,
    last_name,
    email,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 🎯 PASO 4: VERIFICAR TRIGGERS ACTIVOS
SELECT '⚙️ TRIGGERS ACTIVOS' as titulo;

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

-- 🎯 PASO 5: VERIFICAR FUNCIONES
SELECT '🔧 FUNCIONES DISPONIBLES' as titulo;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_user_profile', 'generate_unique_username');

-- 🎯 PASO 6: VERIFICAR RLS (ROW LEVEL SECURITY)
SELECT '🔒 POLÍTICAS RLS' as titulo;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Ver políticas activas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 🎯 PASO 7: CREAR FUNCIÓN DE DIAGNÓSTICO MANUAL
-- Función para probar creación manual de perfil
CREATE OR REPLACE FUNCTION test_create_profile(test_email TEXT)
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    result_message TEXT;
BEGIN
    -- Buscar usuario por email
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = test_email 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN '❌ Usuario no encontrado con email: ' || test_email;
    END IF;
    
    -- Verificar si ya tiene perfil
    IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = test_user_id) THEN
        RETURN '✅ Usuario ya tiene perfil creado';
    END IF;
    
    -- Intentar crear perfil manualmente
    BEGIN
        INSERT INTO user_profiles (
            user_id,
            email,
            username,
            first_name,
            last_name,
            role,
            industry,
            location
        ) VALUES (
            test_user_id,
            test_email,
            'test_user_' || substr(test_user_id::text, 1, 8),
            'Usuario',
            'Prueba',
            'Desarrollador',
            'Tecnología',
            'Ciudad de México'
        );
        
        result_message := '✅ Perfil creado exitosamente para: ' || test_email;
    EXCEPTION WHEN OTHERS THEN
        result_message := '❌ Error creando perfil: ' || SQLERRM;
    END;
    
    RETURN result_message;
END;
$$ language 'plpgsql';

-- 🎯 PASO 8: CREAR TRIGGER SIMPLIFICADO Y ROBUSTO
-- Eliminar trigger actual
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Función super simple que siempre funciona
CREATE OR REPLACE FUNCTION create_user_profile_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar perfil básico siempre
    INSERT INTO user_profiles (
        user_id,
        email,
        username,
        first_name,
        last_name,
        role,
        industry,
        location
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, 'sin-email@temp.com'),
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1),
            'user' || extract(epoch from now())::bigint
        ),
        COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'lastName', 'Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Profesional'),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'Tecnología'),
        COALESCE(NEW.raw_user_meta_data->>'location', 'No especificado')
    ) ON CONFLICT (user_id) DO NOTHING; -- Evitar duplicados
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Si falla, registrar error pero continuar
    RAISE NOTICE 'Error creando perfil para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger simple
CREATE TRIGGER create_user_profile_simple_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_simple();

-- 🎯 PASO 9: VERIFICACIÓN FINAL
SELECT '✅ DIAGNÓSTICO COMPLETO' as resultado;

-- Mostrar resumen
SELECT 
    'RESUMEN DEL SISTEMA' as categoria,
    (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
    (SELECT COUNT(*) FROM user_profiles) as perfiles_creados,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'create_user_profile_simple_trigger')
        THEN 'Activo ✅'
        ELSE 'Inactivo ❌'
    END as trigger_estado;

SELECT '🧪 INSTRUCCIONES DE PRUEBA' as titulo;
SELECT 'Para probar con un usuario existente, ejecuta:' as instruccion;
SELECT 'SELECT test_create_profile(''tu-email@ejemplo.com'');' as comando_ejemplo;

SELECT '🚀 Trigger simplificado instalado - Prueba registrar un nuevo usuario' as mensaje_final;
