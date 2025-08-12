-- =============================================
-- Test del Sistema de Matching
-- =============================================

-- 1. Insertar datos de prueba para interacciones
INSERT INTO user_interactions (user_id, target_user_id, interaction_type) 
VALUES 
  -- Simulamos que el usuario A le da like al usuario B
  ((SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
   (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 
   'like'),
  
  -- Simulamos que el usuario B le da like al usuario A (match mutuo)
  ((SELECT id FROM auth.users LIMIT 1 OFFSET 1), 
   (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
   'like');

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
  (SELECT id FROM auth.users LIMIT 1), -- ID del usuario
  10, -- límite
  50  -- compatibilidad mínima
);

-- 4. Crear solicitud de conexión
INSERT INTO connection_requests (requester_id, addressee_id, message)
VALUES (
  (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
  '¡Hola! Me gustaría conectar contigo después de nuestro match.'
);

-- 5. Aceptar la solicitud (esto debe crear automáticamente una conversación)
UPDATE connection_requests 
SET status = 'accepted', responded_at = NOW()
WHERE requester_id = (SELECT id FROM auth.users LIMIT 1 OFFSET 0)
  AND addressee_id = (SELECT id FROM auth.users LIMIT 1 OFFSET 1);

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
SELECT * FROM get_user_connections(
  (SELECT id FROM auth.users LIMIT 1)
);

-- 8. Probar cálculo de compatibilidad
SELECT calculate_compatibility(
  (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1)
) as compatibility_score;

-- 9. Verificar cache de compatibilidad
SELECT * FROM compatibility_cache ORDER BY calculated_at DESC;

-- 10. Limpiar cache expirado (función de mantenimiento)
SELECT cleanup_expired_cache() as deleted_cache_entries;

-- Resumen del estado del sistema
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
