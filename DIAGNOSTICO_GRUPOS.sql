-- Script para diagnosticar y limpiar problemas en la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- 1. VERIFICAR ESTADO ACTUAL
-- ============================================

-- Ver qué tablas existen
SELECT 'Tablas existentes:' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Ver estructura de group_memberships
SELECT 'Estructura de group_memberships:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'group_memberships'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR DATOS EXISTENTES  
-- ============================================

-- Contar grupos por categoría
SELECT 'Grupos por categoría:' as info;
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN is_private THEN 1 END) as privados,
  COUNT(CASE WHEN NOT is_private THEN 1 END) as publicos
FROM groups 
GROUP BY category 
ORDER BY total DESC;

-- Verificar membresías
SELECT 'Estado de membresías:' as info;
SELECT 
  g.name,
  g.category,
  COUNT(gm.id) as miembros
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.category
ORDER BY miembros DESC;

-- ============================================
-- 3. OPCIONES DE LIMPIEZA (COMENTADAS)
-- ============================================

-- ⚠️ DESCOMENTA SOLO SI QUIERES LIMPIAR LOS DATOS DE PRUEBA ⚠️

-- Opción 1: Eliminar todos los grupos de prueba
-- DELETE FROM groups WHERE created_at < now();

-- Opción 2: Eliminar grupos sin miembros
-- DELETE FROM groups 
-- WHERE id NOT IN (
--   SELECT DISTINCT group_id FROM group_memberships
-- );

-- Opción 3: Eliminar grupos específicos por nombre
-- DELETE FROM groups 
-- WHERE name IN (
--   'Developers México',
--   'AI & Machine Learning', 
--   'Fundadores Latinoamérica',
--   'Fintech Innovators',
--   'Growth Hackers',
--   'Women in Tech MX',
--   'Startup CDMX'
-- );

SELECT '✅ Diagnóstico completado. Revisa los resultados arriba.' as resultado;
