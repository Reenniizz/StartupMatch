-- ============================================
-- VERIFICACIÓN PRE-EJECUCIÓN DEL ESQUEMA
-- Verifica el estado actual antes de ejecutar el esquema unificado
-- ============================================

\echo '🔍 VERIFICANDO ESTADO ACTUAL DE LA BASE DE DATOS...'
\echo ''

-- Verificar extensiones
\echo '📦 EXTENSIONES INSTALADAS:'
SELECT name, installed_version, comment 
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'pgcrypto') 
AND installed_version IS NOT NULL;

\echo ''

-- Verificar tablas existentes
\echo '📋 TABLAS EXISTENTES:'
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY table_name;

\echo ''

-- Verificar políticas RLS existentes
\echo '🛡️ POLÍTICAS RLS EXISTENTES:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY tablename, policyname;

\echo ''

-- Verificar estado de RLS en tablas
\echo '🔒 ESTADO DE ROW LEVEL SECURITY:'
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages');

\echo ''

-- Contar registros existentes
\echo '📊 REGISTROS EXISTENTES:'
DO $$
DECLARE
    table_name TEXT;
    record_count INTEGER;
    tables TEXT[] := ARRAY['user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages'];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO record_count;
            RAISE NOTICE 'Tabla %: % registros', table_name, record_count;
        EXCEPTION WHEN undefined_table THEN
            RAISE NOTICE 'Tabla %: NO EXISTE', table_name;
        END;
    END LOOP;
END $$;

\echo ''

-- Verificar funciones existentes
\echo '⚙️ FUNCIONES PERSONALIZADAS:'
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%connection%' 
   OR routine_name LIKE '%notification%'
   OR routine_name LIKE '%message%'
ORDER BY routine_name;

\echo ''

-- Verificar triggers
\echo '🔄 TRIGGERS EXISTENTES:'
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '✅ VERIFICACIÓN COMPLETADA'
\echo '🚀 EJECUTAR: \\i UNIFIED_DATABASE_SCHEMA.sql'
\echo ''
