-- Script para verificar qué grupos existen en la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- Ver todos los grupos existentes
SELECT 
  id,
  name,
  description,
  category,
  is_private,
  is_verified,
  tags,
  created_by,
  created_at
FROM groups
ORDER BY created_at DESC;

-- Ver cuántos grupos hay por categoría
SELECT 
  category,
  COUNT(*) as total_grupos,
  COUNT(CASE WHEN is_private = true THEN 1 END) as privados,
  COUNT(CASE WHEN is_private = false THEN 1 END) as publicos
FROM groups
GROUP BY category
ORDER BY total_grupos DESC;

-- Ver información de membresías
SELECT 
  g.name as grupo_nombre,
  COUNT(gm.user_id) as total_miembros
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
GROUP BY g.id, g.name
ORDER BY total_miembros DESC;
