-- =============================================
-- Test del Sistema de Matching (Versión Segura)
-- =============================================

-- PASO 1: Primero veamos qué usuarios tenemos disponibles
SELECT 
    au.id as auth_user_id,
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    up.username
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NOT NULL
LIMIT 5;

-- PASO 2: Selecciona dos IDs de usuarios de la consulta anterior y reemplaza aquí:
-- Reemplaza 'USER_ID_1' y 'USER_ID_2' con IDs reales de tu base de datos

-- Ejemplo de uso (REEMPLAZA CON IDs REALES):
/*
-- 1. Insertar datos de prueba para interacciones
INSERT INTO user_interactions (user_id, target_user_id, interaction_type) 
VALUES 
  -- Usuario 1 le da like al usuario 2
  ('USER_ID_1', 'USER_ID_2', 'like'),
  -- Usuario 2 le da like al usuario 1 (match mutuo)
  ('USER_ID_2', 'USER_ID_1', 'like');

-- 2. Verificar que se creó el match mutuo automáticamente
SELECT 
  mm.*,
  up1.first_name || ' ' || up1.last_name as user1_name,
  up2.first_name || ' ' || up2.last_name as user2_name,
  mm.compatibility_score
FROM mutual_matches mm
JOIN user_profiles up1 ON mm.user1_id = up1.user_id
JOIN user_profiles up2 ON mm.user2_id = up2.user_id
ORDER BY mm.matched_at DESC;

-- 3. Probar función de matches potenciales
SELECT * FROM get_potential_matches(
  'USER_ID_1', -- ID del usuario
  10, -- límite
  50  -- compatibilidad mínima
);

-- 4. Crear solicitud de conexión
INSERT INTO connection_requests (requester_id, addressee_id, message)
VALUES (
  'USER_ID_1',
  'USER_ID_2',
  '¡Hola! Me gustaría conectar contigo después de nuestro match.'
);

-- 5. Aceptar la solicitud (esto debe crear automáticamente una conversación)
UPDATE connection_requests 
SET status = 'accepted', responded_at = NOW()
WHERE requester_id = 'USER_ID_1'
  AND addressee_id = 'USER_ID_2';

-- 6. Verificar que se creó la conversación automáticamente
SELECT 
  c.*,
  up1.first_name || ' ' || up1.last_name as user1_name,
  up2.first_name || ' ' || up2.last_name as user2_name
FROM conversations c
JOIN user_profiles up1 ON c.user1_id = up1.user_id
JOIN user_profiles up2 ON c.user2_id = up2.user_id
ORDER BY c.created_at DESC;

-- 7. Probar función de conexiones de usuario
SELECT * FROM get_user_connections('USER_ID_1');

-- 8. Probar cálculo de compatibilidad
SELECT calculate_compatibility('USER_ID_1', 'USER_ID_2') as compatibility_score;
*/

-- PASO 3: Verificar estado del sistema
SELECT 
  'user_interactions' as table_name, COUNT(*) as total_records
FROM user_interactions
UNION ALL
SELECT 
  'mutual_matches' as table_name, COUNT(*) as total_records
FROM mutual_matches
UNION ALL
SELECT 
  'connection_requests' as table_name, COUNT(*) as total_records
FROM connection_requests
UNION ALL
SELECT 
  'compatibility_cache' as table_name, COUNT(*) as total_records
FROM compatibility_cache;
