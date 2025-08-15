-- ============================================
-- VERIFICACIÓN POST-EJECUCIÓN DEL ESQUEMA
-- Verifica que todo se haya ejecutado correctamente
-- ============================================

\echo '🎯 VERIFICANDO EJECUCIÓN DEL ESQUEMA UNIFICADO...'
\echo ''

-- Verificar que todas las tablas principales existen
\echo '📋 VERIFICANDO TABLAS PRINCIPALES:'
DO $$
DECLARE
    tables TEXT[] := ARRAY['user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages'];
    table_name TEXT;
    exists_flag BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) INTO exists_flag;
        
        IF exists_flag THEN
            RAISE NOTICE '✅ Tabla % creada correctamente', table_name;
        ELSE
            RAISE WARNING '❌ Tabla % NO ENCONTRADA', table_name;
        END IF;
    END LOOP;
END $$;

\echo ''

-- Verificar políticas RLS
\echo '🛡️ VERIFICANDO POLÍTICAS RLS:'
SELECT 
    '✅ ' || tablename || ' - ' || policyname as status,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY tablename, policyname;

\echo ''

-- Verificar que RLS está habilitado
\echo '🔒 VERIFICANDO ESTADO DE ROW LEVEL SECURITY:'
SELECT 
    CASE 
        WHEN rowsecurity = true THEN '✅ ' || tablename || ' - RLS HABILITADO'
        ELSE '❌ ' || tablename || ' - RLS DESHABILITADO'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY tablename;

\echo ''

-- Verificar índices críticos
\echo '📊 VERIFICANDO ÍNDICES:'
SELECT 
    '✅ ' || indexname as status,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

\echo ''

-- Verificar funciones importantes
\echo '⚙️ VERIFICANDO FUNCIONES:'
SELECT 
    '✅ ' || routine_name as status,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%notification%' THEN 'Notificaciones'
        WHEN routine_name LIKE '%connection%' THEN 'Conexiones'
        WHEN routine_name LIKE '%message%' THEN 'Mensajes'
        ELSE 'General'
    END as category
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%connection%' 
     OR routine_name LIKE '%notification%'
     OR routine_name LIKE '%message%'
     OR routine_name LIKE 'drop_policy_if_exists')
ORDER BY category, routine_name;

\echo ''

-- Verificar triggers
\echo '🔄 VERIFICANDO TRIGGERS:'
SELECT 
    '✅ ' || trigger_name as status,
    event_object_table,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
ORDER BY event_object_table, trigger_name;

\echo ''

-- Test básico de inserción (solo estructura)
\echo '🧪 PROBANDO ESTRUCTURA DE TABLAS:'
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Test user_profiles
    BEGIN
        PERFORM column_name FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('id', 'full_name', 'skills', 'created_at');
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        IF test_result::INTEGER >= 4 THEN
            RAISE NOTICE '✅ user_profiles - Estructura correcta';
        ELSE
            RAISE WARNING '⚠️ user_profiles - Estructura incompleta';
        END IF;
    END;
    
    -- Test projects
    BEGIN
        PERFORM column_name FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name IN ('id', 'title', 'description', 'owner_id', 'status');
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        IF test_result::INTEGER >= 5 THEN
            RAISE NOTICE '✅ projects - Estructura correcta';
        ELSE
            RAISE WARNING '⚠️ projects - Estructura incompleta';
        END IF;
    END;
    
    -- Test connection_requests
    BEGIN
        PERFORM column_name FROM information_schema.columns 
        WHERE table_name = 'connection_requests' 
        AND column_name IN ('id', 'requester_id', 'requested_id', 'status');
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        IF test_result::INTEGER >= 4 THEN
            RAISE NOTICE '✅ connection_requests - Estructura correcta';
        ELSE
            RAISE WARNING '⚠️ connection_requests - Estructura incompleta';
        END IF;
    END;
    
END $$;

\echo ''

-- Verificar permisos básicos
\echo '🔐 VERIFICANDO PERMISOS:'
SELECT 
    grantee,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants 
WHERE table_name IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages')
AND grantee != 'postgres'
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

\echo ''

-- Resumen final
\echo '📋 RESUMEN DE VERIFICACIÓN:'
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages');
    
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages');
    
    -- Contar funciones
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%connection%' 
         OR routine_name LIKE '%notification%'
         OR routine_name LIKE '%message%'
         OR routine_name = 'drop_policy_if_exists');
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table IN ('user_profiles', 'projects', 'connection_requests', 'conversations', 'private_messages');
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RESULTADOS:';
    RAISE NOTICE '   📋 Tablas creadas: %/5', table_count;
    RAISE NOTICE '   🛡️ Políticas RLS: %', policy_count;
    RAISE NOTICE '   ⚙️ Funciones: %', function_count;
    RAISE NOTICE '   🔄 Triggers: %', trigger_count;
    RAISE NOTICE '';
    
    IF table_count = 5 AND policy_count > 0 THEN
        RAISE NOTICE '✅ ESQUEMA EJECUTADO EXITOSAMENTE';
    ELSE
        RAISE WARNING '⚠️ PROBLEMAS DETECTADOS - REVISAR LOGS';
    END IF;
END $$;

\echo ''
\echo '🚀 BASE DE DATOS LISTA PARA USAR'
\echo ''
