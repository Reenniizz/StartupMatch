-- =============================================
-- Limpiar y Recrear Sistema de Matching
-- =============================================

-- 1. ELIMINAR TRIGGERS EXISTENTES
DROP TRIGGER IF EXISTS trigger_create_mutual_match ON user_interactions;
DROP TRIGGER IF EXISTS trigger_create_conversation ON connection_requests;

-- 2. ELIMINAR FUNCIONES EXISTENTES
DROP FUNCTION IF EXISTS create_mutual_match();
DROP FUNCTION IF EXISTS create_conversation_on_connection();
DROP FUNCTION IF EXISTS cleanup_expired_cache();
DROP FUNCTION IF EXISTS calculate_compatibility(uuid, uuid);
DROP FUNCTION IF EXISTS get_potential_matches(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_user_connections(uuid);

-- También eliminar versiones con nombres de parámetros prefijados
DROP FUNCTION IF EXISTS calculate_compatibility(p_user1_id uuid, p_user2_id uuid);
DROP FUNCTION IF EXISTS get_potential_matches(p_target_user_id uuid, p_limit_count integer, p_min_compatibility integer);
DROP FUNCTION IF EXISTS get_user_connections(p_target_user_id uuid);

-- 3. ELIMINAR TABLAS EXISTENTES
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS mutual_matches CASCADE;
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS compatibility_cache CASCADE;

-- 4. VERIFICAR ESQUEMA DE auth.users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESQUEMA DE user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

SELECT '✅ Limpieza completada. Ahora ejecuta MATCHING_DATABASE_SETUP.sql nuevamente' as resultado;
