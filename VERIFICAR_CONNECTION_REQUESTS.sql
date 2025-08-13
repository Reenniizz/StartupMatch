-- Verificar connection requests en la base de datos
SELECT 
  cr.id,
  cr.requester_id,
  cr.addressee_id, 
  cr.status,
  cr.message,
  cr.created_at,
  req_profile.username as requester_username,
  req_profile.first_name as requester_name,
  addr_profile.username as addressee_username,
  addr_profile.first_name as addressee_name
FROM connection_requests cr
LEFT JOIN user_profiles req_profile ON cr.requester_id = req_profile.user_id
LEFT JOIN user_profiles addr_profile ON cr.addressee_id = addr_profile.user_id
ORDER BY cr.created_at DESC 
LIMIT 20;
