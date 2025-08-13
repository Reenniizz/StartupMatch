-- 🔧 CORRECCIÓN DE FOREIGN KEYS EN CONNECTION_REQUESTS
-- El problema es que las FK apuntan a user_profiles en lugar de auth.users

-- Ver las foreign keys actuales
SELECT 
    'FOREIGN KEYS ACTUALES' as tipo,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'connection_requests';

-- Eliminar foreign keys incorrectas que apuntan a user_profiles
ALTER TABLE connection_requests DROP CONSTRAINT IF EXISTS connection_requests_requester_id_fkey;
ALTER TABLE connection_requests DROP CONSTRAINT IF EXISTS connection_requests_addressee_id_fkey;

-- Crear foreign keys correctas que apunten a auth.users
ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_addressee_id_fkey 
FOREIGN KEY (addressee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verificación final
SELECT 
    'FOREIGN KEYS CORREGIDAS' as tipo,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'connection_requests';

SELECT '✅ FOREIGN KEYS CORREGIDAS' as resultado;
SELECT 'Ahora intenta conectar de nuevo' as instruccion;
