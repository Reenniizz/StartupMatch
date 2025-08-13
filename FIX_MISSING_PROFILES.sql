-- ==========================================
-- SCRIPT PARA CREAR PERFILES FALTANTES
-- Crea registros en user_profiles para usuarios de auth.users que no los tengan
-- Versión actualizada con manejo de columnas requeridas
-- ==========================================

-- Verificar usuarios sin perfil
DO $$
DECLARE
    missing_profiles_count INTEGER;
    created_profiles_count INTEGER;
BEGIN
    -- Contar usuarios sin perfil
    SELECT COUNT(*) INTO missing_profiles_count
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL;
    
    RAISE NOTICE 'Usuarios sin perfil encontrados: %', missing_profiles_count;
    
    -- Crear perfiles faltantes con todas las columnas requeridas
    INSERT INTO user_profiles (
        user_id, 
        username, 
        first_name, 
        last_name,
        email,
        role,
        industry,
        location,
        created_at
    )
    SELECT 
        u.id,
        COALESCE(
            u.raw_user_meta_data->>'username', 
            SPLIT_PART(u.email, '@', 1),
            'user_' || RIGHT(u.id::text, 8)
        ) as username,
        COALESCE(
            u.raw_user_meta_data->>'first_name',
            u.raw_user_meta_data->>'full_name',
            SPLIT_PART(u.email, '@', 1),
            'Usuario'
        ) as first_name,
        COALESCE(
            u.raw_user_meta_data->>'last_name',
            'Apellido'
        ) as last_name,
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'role',
            'Desarrollador'
        ) as role,
        COALESCE(
            u.raw_user_meta_data->>'industry',
            'Tecnología'
        ) as industry,
        COALESCE(
            u.raw_user_meta_data->>'location',
            'No especificada'
        ) as location,
        u.created_at
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING;
    
    GET DIAGNOSTICS created_profiles_count = ROW_COUNT;
    RAISE NOTICE 'Perfiles creados: %', created_profiles_count;
    
    -- Verificar perfiles específicos que necesitamos
    RAISE NOTICE 'Verificando perfiles específicos:';
    RAISE NOTICE 'Perfil 5e85777c-6430-4e51-bbf9-374cf6b61e09 existe: %', 
        (SELECT CASE WHEN EXISTS(SELECT 1 FROM user_profiles WHERE user_id = '5e85777c-6430-4e51-bbf9-374cf6b61e09') THEN 'SÍ' ELSE 'NO' END);
    RAISE NOTICE 'Perfil 3ba6c41a-1f33-4832-97e4-774e523fe001 existe: %', 
        (SELECT CASE WHEN EXISTS(SELECT 1 FROM user_profiles WHERE user_id = '3ba6c41a-1f33-4832-97e4-774e523fe001') THEN 'SÍ' ELSE 'NO' END);
    
    -- Mostrar resumen
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total usuarios en auth.users: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Total perfiles en user_profiles: %', (SELECT COUNT(*) FROM user_profiles);
    RAISE NOTICE 'SINCRONIZACIÓN COMPLETADA';
    RAISE NOTICE '==========================================';
END $$;
