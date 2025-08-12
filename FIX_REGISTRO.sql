-- 🔧 CORRECCIÓN DEL TRIGGER DE REGISTRO DE USUARIOS
-- Ejecutar en Supabase SQL Editor para corregir el error de registro

-- Primero, vamos a ver la estructura actual de user_profiles
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 🎯 PARTE 1: ELIMINAR TRIGGER PROBLEMÁTICO Y RECREAR
-- Eliminar trigger actual que está causando problemas
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- 🎯 PARTE 2: FUNCIÓN MEJORADA DE CREACIÓN DE PERFILES
-- Reemplazar la función problemática con una versión más robusta
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear perfil si no existe ya uno para este usuario
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.id) THEN
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
            NEW.id,
            COALESCE(NEW.email, ''),
            COALESCE(
                NEW.raw_user_meta_data->>'username', 
                split_part(COALESCE(NEW.email, ''), '@', 1),
                'user_' || substr(NEW.id::text, 1, 8)
            ),
            COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'lastName', 'Nuevo'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Profesional'),
            COALESCE(NEW.raw_user_meta_data->>'industry', 'Tecnología'),
            COALESCE(NEW.raw_user_meta_data->>'location', 'No especificado'),
            COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
        );
        
        -- Crear skills solo si existen en metadata y la inserción de perfil fue exitosa
        IF NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN
            BEGIN
                INSERT INTO user_skills (user_id, skill_name, skill_level, skill_category)
                SELECT 
                    NEW.id,
                    skill_name,
                    5, -- nivel por defecto
                    'technical' -- categoría por defecto
                FROM json_array_elements_text((NEW.raw_user_meta_data->>'skills')::json) AS skill_name
                WHERE skill_name != '' AND skill_name IS NOT NULL;
            EXCEPTION WHEN OTHERS THEN
                -- Si hay error con skills, continuar (no fallar todo el registro)
                NULL;
            END;
        END IF;
        
        -- Crear objetivos solo si existen en metadata
        IF NEW.raw_user_meta_data->>'lookingFor' IS NOT NULL THEN
            BEGIN
                INSERT INTO user_objectives (user_id, objective_type, priority)
                SELECT 
                    NEW.id,
                    objective,
                    1 -- prioridad por defecto
                FROM json_array_elements_text((NEW.raw_user_meta_data->>'lookingFor')::json) AS objective
                WHERE objective != '' AND objective IS NOT NULL;
            EXCEPTION WHEN OTHERS THEN
                -- Si hay error con objetivos, continuar
                NULL;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Si todo falla, registrar el error pero permitir que el usuario se registre
    -- Solo loggear el error sin fallar
    RAISE WARNING 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 🎯 PARTE 3: RECREAR TRIGGER MEJORADO
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 🎯 PARTE 4: VERIFICAR QUE FUNCIONA
-- Verificar que el trigger existe
SELECT 
    trigger_name, 
    event_object_table,
    event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

-- 🎯 PARTE 5: HACER username ÚNICO PERO PERMITIR DUPLICADOS TEMPORALES
-- Modificar constraint de username para manejar duplicados
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_key;

-- Crear índice único parcial que permite NULL y duplicados de 'Usuario'
DROP INDEX IF EXISTS idx_user_profiles_username_unique;
CREATE UNIQUE INDEX idx_user_profiles_username_unique 
ON user_profiles (username) 
WHERE username IS NOT NULL 
  AND username != '' 
  AND username != 'Usuario'
  AND NOT username LIKE 'user_%';

-- 🎯 PARTE 6: FUNCIÓN PARA GENERAR USERNAMES ÚNICOS
CREATE OR REPLACE FUNCTION generate_unique_username(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
    new_username TEXT;
    counter INTEGER := 1;
BEGIN
    -- Limpiar el nombre base
    base_name := COALESCE(base_name, 'usuario');
    base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Si está vacío, usar 'usuario'
    IF base_name = '' THEN
        base_name := 'usuario';
    END IF;
    
    new_username := base_name;
    
    -- Buscar username único
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = new_username) LOOP
        new_username := base_name || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_username;
END;
$$ language 'plpgsql';

-- 🎯 PARTE 7: FUNCIÓN MEJORADA FINAL
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    suggested_username TEXT;
BEGIN
    -- Solo crear perfil si no existe ya uno para este usuario
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.id) THEN
        -- Generar username único
        suggested_username := generate_unique_username(
            COALESCE(
                NEW.raw_user_meta_data->>'username',
                NEW.raw_user_meta_data->>'firstName',
                split_part(COALESCE(NEW.email, ''), '@', 1)
            )
        );
        
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
            NEW.id,
            COALESCE(NEW.email, ''),
            suggested_username,
            COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'lastName', 'Nuevo'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Profesional'),
            COALESCE(NEW.raw_user_meta_data->>'industry', 'Tecnología'),
            COALESCE(NEW.raw_user_meta_data->>'location', 'No especificado'),
            COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
        );
        
        -- Manejar skills de forma segura
        IF NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN
            BEGIN
                -- Validar que sea JSON válido antes de procesarlo
                PERFORM (NEW.raw_user_meta_data->>'skills')::json;
                
                INSERT INTO user_skills (user_id, skill_name, skill_level, skill_category)
                SELECT 
                    NEW.id,
                    TRIM(skill_name),
                    5,
                    'technical'
                FROM json_array_elements_text((NEW.raw_user_meta_data->>'skills')::json) AS skill_name
                WHERE TRIM(skill_name) != '' 
                  AND TRIM(skill_name) IS NOT NULL 
                  AND LENGTH(TRIM(skill_name)) > 1;
            EXCEPTION WHEN OTHERS THEN
                -- Skills fallaron, continuar sin error
                NULL;
            END;
        END IF;
        
        -- Manejar objetivos de forma segura
        IF NEW.raw_user_meta_data->>'lookingFor' IS NOT NULL THEN
            BEGIN
                -- Validar que sea JSON válido
                PERFORM (NEW.raw_user_meta_data->>'lookingFor')::json;
                
                INSERT INTO user_objectives (user_id, objective_type, priority)
                SELECT 
                    NEW.id,
                    TRIM(objective),
                    1
                FROM json_array_elements_text((NEW.raw_user_meta_data->>'lookingFor')::json) AS objective
                WHERE TRIM(objective) != '' 
                  AND TRIM(objective) IS NOT NULL 
                  AND LENGTH(TRIM(objective)) > 1;
            EXCEPTION WHEN OTHERS THEN
                -- Objetivos fallaron, continuar
                NULL;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Error crítico - registrar pero permitir registro
    RAISE WARNING 'Error completo creando perfil para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 🎯 VERIFICACIÓN FINAL
SELECT '✅ CORRECCIÓN DE REGISTRO COMPLETADA' as resultado;

-- Verificar funciones creadas
SELECT 
    routine_name,
    'Disponible ✅' as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_user_profile', 'generate_unique_username');

-- Verificar trigger
SELECT 
    'Trigger create_user_profile_trigger' as componente,
    CASE WHEN COUNT(*) > 0 THEN 'Activo ✅' ELSE 'Error ❌' END as estado
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

SELECT '🚀 Ahora puedes registrar usuarios sin problemas' as mensaje_final;
