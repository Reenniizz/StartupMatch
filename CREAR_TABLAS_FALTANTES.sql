-- 🛠️ CREAR TABLAS FALTANTES PARA EL SISTEMA DE REGISTRO
-- Ejecutar solo si las tablas user_skills y user_objectives no existen

-- 📊 TABLA: user_skills
CREATE TABLE IF NOT EXISTS user_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_name text NOT NULL,
    skill_level integer DEFAULT 5 CHECK (skill_level >= 1 AND skill_level <= 10),
    skill_category text DEFAULT 'technical',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para user_skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON user_skills(skill_category);

-- RLS para user_skills
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_skills
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;
CREATE POLICY "Users can view their own skills" ON user_skills
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON user_skills;
CREATE POLICY "Users can insert their own skills" ON user_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON user_skills;
CREATE POLICY "Users can update their own skills" ON user_skills
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON user_skills;
CREATE POLICY "Users can delete their own skills" ON user_skills
    FOR DELETE USING (auth.uid() = user_id);

-- 🎯 TABLA: user_objectives  
CREATE TABLE IF NOT EXISTS user_objectives (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    objective_type text NOT NULL,
    priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para user_objectives
CREATE INDEX IF NOT EXISTS idx_user_objectives_user_id ON user_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_user_objectives_priority ON user_objectives(priority);

-- RLS para user_objectives
ALTER TABLE user_objectives ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_objectives
DROP POLICY IF EXISTS "Users can view their own objectives" ON user_objectives;
CREATE POLICY "Users can view their own objectives" ON user_objectives
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own objectives" ON user_objectives;
CREATE POLICY "Users can insert their own objectives" ON user_objectives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own objectives" ON user_objectives;
CREATE POLICY "Users can update their own objectives" ON user_objectives
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own objectives" ON user_objectives;
CREATE POLICY "Users can delete their own objectives" ON user_objectives
    FOR DELETE USING (auth.uid() = user_id);

-- ✅ VERIFICACIÓN FINAL
SELECT 
    'TABLAS CREADAS' as resultado,
    table_name,
    'Existe ✅' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_skills', 'user_objectives')
ORDER BY table_name;

SELECT '🎉 Tablas creadas exitosamente. Ahora ejecuta FIX_REGISTRO.sql de nuevo.' as mensaje_final;
