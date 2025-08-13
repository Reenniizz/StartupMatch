-- Verificar estado de RLS y políticas para connection_requests
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasoids
FROM pg_tables 
WHERE tablename = 'connection_requests';

-- Ver políticas activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_requests';

-- Verificar si existen registros (debe mostrar registros si RLS no está bloqueando)
SELECT COUNT(*) as total_connection_requests FROM connection_requests;

-- Verificar registros con más detalle
SELECT 
    id,
    requester_id,
    addressee_id,
    status,
    created_at
FROM connection_requests 
ORDER BY created_at DESC
LIMIT 10;
