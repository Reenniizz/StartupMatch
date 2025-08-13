-- 🛠️ FIX RÁPIDO: DESHABILITAR RLS TEMPORAL PARA TRIGGER
-- Este es probablemente el problema - RLS bloquea el trigger

-- Deshabilitar RLS temporalmente para permitir que el trigger funcione
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_objectives DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DESHABILITADO TEMPORALMENTE' as resultado;
SELECT 'Ahora prueba registrar un usuario' as instruccion;
