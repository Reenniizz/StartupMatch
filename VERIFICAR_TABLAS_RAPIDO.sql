-- 🔍 VERIFICACIÓN RÁPIDA DE TABLAS
-- Ejecutar PRIMERO para verificar que todas las tablas existen

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_skills', 'user_objectives')
ORDER BY table_name;

-- Si alguna tabla NO aparece, necesitamos crearla
-- Las tablas que deberían existir son:
-- - user_profiles ✓
-- - user_skills (podría faltar)
-- - user_objectives (podría faltar)
