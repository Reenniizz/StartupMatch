# 🗄️ Database Schema - User Profiles

## SQL para crear las tablas de perfil en Supabase

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 1. Tabla principal de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Información básica
  username VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Información profesional
  role VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  industry VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  experience_years INTEGER DEFAULT 0,
  availability_hours INTEGER DEFAULT 40,
  
  -- Bio y descripción
  bio TEXT,
  headline VARCHAR(200),
  
  -- Enlaces profesionales
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  twitter_url TEXT,
  
  -- Configuraciones
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'connections')),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Metadatos
  profile_completed_at TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Tabla de habilidades del usuario
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 10),
  skill_category VARCHAR(50) DEFAULT 'other',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, skill_name)
);

-- 3. Tabla de objetivos del usuario (lo que busca)
CREATE TABLE user_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  objective_type VARCHAR(50) NOT NULL, -- 'co-founder', 'team-member', 'advisor', etc.
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, objective_type)
);

-- 4. Tabla de proyectos del usuario
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  project_description TEXT,
  project_url TEXT,
  project_status VARCHAR(20) DEFAULT 'active' CHECK (project_status IN ('active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  technologies TEXT[], -- Array de tecnologías utilizadas
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. Tabla de experiencia laboral
CREATE TABLE user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  position VARCHAR(150) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_objectives_user_id ON user_objectives(user_id);
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_experience_user_id ON user_experience(user_id);

-- RLS Policies
-- Política para user_profiles
CREATE POLICY "Users can view public profiles" ON user_profiles
  FOR SELECT USING (
    profile_visibility = 'public' OR 
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para user_skills
CREATE POLICY "Users can manage own skills" ON user_skills
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' skills" ON user_skills
  FOR SELECT USING (true);

-- Política para user_objectives
CREATE POLICY "Users can manage own objectives" ON user_objectives
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' objectives" ON user_objectives
  FOR SELECT USING (true);

-- Política para user_projects
CREATE POLICY "Users can manage own projects" ON user_projects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' projects" ON user_projects
  FOR SELECT USING (true);

-- Política para user_experience
CREATE POLICY "Users can manage own experience" ON user_experience
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' experience" ON user_experience
  FOR SELECT USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_experience_updated_at BEFORE UPDATE ON user_experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        user_id, 
        email,
        username,
        first_name,
        last_name,
        role,
        industry,
        location
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
        COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', ''),
        COALESCE(NEW.raw_user_meta_data->>'industry', ''),
        COALESCE(NEW.raw_user_meta_data->>'location', '')
    );
    
    -- Crear skills si existen en metadata
    IF NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN
        INSERT INTO user_skills (user_id, skill_name, skill_level)
        SELECT 
            NEW.id,
            skill_name,
            5 -- nivel por defecto
        FROM json_array_elements_text((NEW.raw_user_meta_data->>'skills')::json) AS skill_name
        WHERE skill_name != '';
    END IF;
    
    -- Crear objetivos si existen en metadata
    IF NEW.raw_user_meta_data->>'lookingFor' IS NOT NULL THEN
        INSERT INTO user_objectives (user_id, objective_type)
        SELECT 
            NEW.id,
            objective
        FROM json_array_elements_text((NEW.raw_user_meta_data->>'lookingFor')::json) AS objective;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear perfil automáticamente
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Enable RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience ENABLE ROW LEVEL SECURITY;
```

## 🚀 Instrucciones de Setup

1. **Ve a tu proyecto de Supabase**: https://supabase.com/dashboard/project/cbaxjoozbnffrryuywno
2. **SQL Editor**: Copia y pega este SQL
3. **Ejecuta**: Esto creará todas las tablas y configuraciones necesarias
4. **Verifica**: Ve a Table Editor para confirmar que se crearon las tablas

## 📊 Estructura de Datos Creada

### `user_profiles` - Perfil principal
- Información básica y profesional
- Enlaces a redes sociales
- Configuraciones de privacidad

### `user_skills` - Habilidades
- Skills con niveles (1-10)
- Categorías organizadas
- Skills primarias destacadas

### `user_objectives` - Objetivos
- Qué busca el usuario
- Prioridades ordenadas

### `user_projects` - Proyectos
- Portfolio de proyectos
- Estado y tecnologías

### `user_experience` - Experiencia
- Historial laboral completo
- Posiciones actuales y pasadas
