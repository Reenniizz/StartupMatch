-- ==========================================
-- SCRIPT DE LIMPIEZA DE DATOS HUÉRFANOS
-- Elimina perfiles que no tienen usuario correspondiente en auth.users
-- ==========================================

DO $$
DECLARE
    orphaned_profiles_count INTEGER;
    deleted_profiles_count INTEGER;
    orphaned_connections_count INTEGER;
    deleted_connections_count INTEGER;
    rec RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'INICIANDO LIMPIEZA DE DATOS HUÉRFANOS';
    RAISE NOTICE '==========================================';
    
    -- 1. Contar perfiles huérfanos
    SELECT COUNT(*) INTO orphaned_profiles_count
    FROM user_profiles p
    LEFT JOIN auth.users u ON p.user_id = u.id
    WHERE u.id IS NULL;
    
    RAISE NOTICE 'Perfiles huérfanos encontrados: %', orphaned_profiles_count;
    
    -- 2. Mostrar cuáles son antes de eliminarlos
    IF orphaned_profiles_count > 0 THEN
        RAISE NOTICE 'Perfiles huérfanos que serán eliminados:';
        FOR rec IN 
            SELECT p.user_id, p.email, p.username
            FROM user_profiles p
            LEFT JOIN auth.users u ON p.user_id = u.id
            WHERE u.id IS NULL
        LOOP
            RAISE NOTICE '- ID: % | Email: % | Username: %', rec.user_id, rec.email, rec.username;
        END LOOP;
    END IF;
    
    -- 3. Contar conexiones huérfanas
    SELECT COUNT(*) INTO orphaned_connections_count
    FROM connection_requests cr
    WHERE cr.requester_id NOT IN (SELECT id FROM auth.users)
       OR cr.addressee_id NOT IN (SELECT id FROM auth.users);
    
    RAISE NOTICE 'Solicitudes de conexión huérfanas: %', orphaned_connections_count;
    
    -- 4. Eliminar conexiones huérfanas PRIMERO (debido a foreign keys)
    DELETE FROM connection_requests 
    WHERE requester_id NOT IN (SELECT id FROM auth.users)
       OR addressee_id NOT IN (SELECT id FROM auth.users);
    
    GET DIAGNOSTICS deleted_connections_count = ROW_COUNT;
    RAISE NOTICE 'Solicitudes de conexión huérfanas eliminadas: %', deleted_connections_count;
    
    -- 5. Eliminar perfiles huérfanos
    DELETE FROM user_profiles 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    GET DIAGNOSTICS deleted_profiles_count = ROW_COUNT;
    RAISE NOTICE 'Perfiles huérfanos eliminados: %', deleted_profiles_count;
    
    -- 6. Verificar estado final
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'LIMPIEZA COMPLETADA';
    RAISE NOTICE 'Total usuarios en auth.users: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Total perfiles en user_profiles: %', (SELECT COUNT(*) FROM user_profiles);
    RAISE NOTICE 'Total solicitudes de conexión: %', (SELECT COUNT(*) FROM connection_requests);
    RAISE NOTICE '==========================================';
    
END $$;
