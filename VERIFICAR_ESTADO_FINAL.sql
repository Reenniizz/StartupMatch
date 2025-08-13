-- 🔍 VERIFICACIÓN RÁPIDA DEL ESTADO ACTUAL
-- Ejecutar para ver qué está pasando después del fix

-- Ver trigger actual
SELECT 
    'TRIGGER ACTUAL' as tipo,
    trigger_name,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Ver función actual  
SELECT 
    'FUNCIÓN ACTUAL' as tipo,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_profile_guaranteed';

-- Ver estado de usuarios y perfiles
SELECT 
    'ESTADO ACTUAL' as tipo,
    (SELECT COUNT(*) FROM auth.users) as usuarios,
    (SELECT COUNT(*) FROM user_profiles) as perfiles;

-- Ver RLS status
SELECT 
    'RLS STATUS' as tipo,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_skills', 'user_objectives');

-- Ver últimos usuarios
SELECT 
    'ÚLTIMOS USUARIOS' as tipo,
    u.email,
    u.created_at,
    CASE WHEN p.user_id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as estado
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 3;
