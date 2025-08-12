-- 🔧 SOLUCIÓN INMEDIATA - REGISTRO DE USUARIOS
-- Ejecutar en Supabase SQL Editor

-- ⚠️ IMPORTANTE: Este script solucionará el problema de inmediato

-- 🎯 PARTE 1: ELIMINAR TODOS LOS TRIGGERS EXISTENTES
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_simple_trigger ON auth.users;

-- 🎯 PARTE 2: FUNCIÓN ULTRA SIMPLE QUE SIEMPRE FUNCIONA
CREATE OR REPLACE FUNCTION create_profile_guaranteed()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear perfil básico SIEMPRE
    INSERT INTO user_profiles (
        user_id,
        email,
        username,
        first_name,
        last_name,
        role,
        industry,
        location,
        created_at
    ) 
    SELECT 
        NEW.id,
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'username' IS NOT NULL 
            THEN NEW.raw_user_meta_data->>'username'
            ELSE split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
        END,
        COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'lastName', 'Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Profesional'),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'Tecnología'),
        COALESCE(NEW.raw_user_meta_data->>'location', 'No especificado'),
        now()
    WHERE NOT EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🎯 PARTE 3: CREAR TRIGGER GARANTIZADO
CREATE TRIGGER ensure_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_guaranteed();

-- 🎯 PARTE 4: CREAR PERFILES PARA USUARIOS EXISTENTES SIN PERFIL
INSERT INTO user_profiles (
    user_id,
    email,
    username,
    first_name,
    last_name,
    role,
    industry,
    location,
    created_at
)
SELECT 
    u.id,
    u.email,
    split_part(u.email, '@', 1) || '_' || substr(u.id::text, 1, 4),
    COALESCE(u.raw_user_meta_data->>'firstName', 'Usuario'),
    COALESCE(u.raw_user_meta_data->>'lastName', 'Existente'),
    COALESCE(u.raw_user_meta_data->>'role', 'Profesional'),
    COALESCE(u.raw_user_meta_data->>'industry', 'Tecnología'),
    COALESCE(u.raw_user_meta_data->>'location', 'No especificado'),
    u.created_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.user_id = u.id
);

-- 🎯 PARTE 5: VERIFICACIÓN INMEDIATA
SELECT 
    'VERIFICACIÓN POST-INSTALACIÓN' as titulo,
    (SELECT COUNT(*) FROM auth.users) as usuarios_registrados,
    (SELECT COUNT(*) FROM user_profiles) as perfiles_creados,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM user_profiles)
        THEN '✅ PERFECTO - Todos los usuarios tienen perfil'
        ELSE '⚠️ HAY USUARIOS SIN PERFIL'
    END as estado;

-- Mostrar usuarios y sus perfiles
SELECT 
    u.email,
    u.created_at as registrado,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ Tiene perfil'
        ELSE '❌ Sin perfil'
    END as estado_perfil,
    p.username,
    p.first_name,
    p.last_name
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

-- 🎯 PARTE 6: LIMPIAR FUNCIONES OBSOLETAS
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS create_user_profile_simple();
DROP FUNCTION IF EXISTS generate_unique_username(TEXT);

SELECT '✅ SOLUCIÓN INSTALADA CORRECTAMENTE' as resultado;
SELECT '🚀 Ahora registra un nuevo usuario para verificar que funciona' as proximos_pasos;
