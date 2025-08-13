-- Verificar triggers automáticos para creación de usuarios
SELECT 'TRIGGERS EN AUTH.USERS:' as titulo;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'auth';

-- Verificar funciones que se ejecutan automáticamente
SELECT 'FUNCIONES RELACIONADAS CON REGISTRO:' as titulo;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%user_profiles%'
   AND routine_definition ILIKE '%INSERT%'
   AND routine_type = 'FUNCTION';

-- Verificar si existe alguna función para crear perfiles automáticamente
SELECT 'FUNCIONES PARA AUTO-CREAR PERFILES:' as titulo;
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%user_profiles%'
  AND prosrc ILIKE '%INSERT%';
