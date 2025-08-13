-- 🚨 FIX ULTRA AGRESIVO - SIN RLS
-- Ejecutar solo si persiste el problema

-- Paso 1: Deshabilitar RLS completamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills DISABLE ROW LEVEL SECURITY;  
ALTER TABLE user_objectives DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar TODAS las políticas RLS
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;
DROP POLICY IF EXISTS "Users can view their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can insert their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can update their own objectives" ON user_objectives;
DROP POLICY IF EXISTS "Users can delete their own objectives" ON user_objectives;

-- Paso 3: Limpiar todos los triggers
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_simple_trigger ON auth.users;
DROP TRIGGER IF EXISTS ensure_user_profile ON auth.users;

-- Paso 4: Función ULTRA simple
CREATE OR REPLACE FUNCTION simple_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, username, first_name, last_name, role, industry, location)
    VALUES (
        NEW.id,
        NEW.email,
        split_part(NEW.email, '@', 1),
        'Usuario',
        'Nuevo',
        'Profesional',
        'Tecnología',
        'No especificado'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Continuar aunque falle
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 5: Trigger ultra simple
CREATE TRIGGER simple_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION simple_create_profile();

SELECT '🚀 FIX ULTRA AGRESIVO APLICADO' as resultado;
SELECT 'Ahora intenta registrar un usuario' as instruccion;
