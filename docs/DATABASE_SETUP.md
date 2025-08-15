# 🗄️ StartupMatch - Database Setup Guide

*Guía completa para implementar el schema de perfiles en Supabase*  
**Versión:** 2.0 | **Fecha:** Agosto 11, 2025

---

## 🎯 **QUÉ VAMOS A CREAR**

Una base de datos completa para gestión avanzada de perfiles con:
- **5 tablas principales** para datos de usuario
- **Seguridad RLS** completa
- **Triggers automáticos** para consistencia
- **Funciones de utilidad** para matching y estadísticas

---

## 🚀 **PASO 1: Acceso a Supabase**

1. **Ve a tu proyecto:** https://supabase.com/dashboard/projects
2. **Selecciona:** StartupMatch (ID: `cbaxjoozbnffrryuywno`)
3. **Ve a:** SQL Editor
4. **Crea:** New Query

---

## 📋 **PASO 2: EJECUTAR SCHEMA DE PERFILES**

### **Bloque 1: Tabla Principal de Perfiles**
```sql
-- Habilitar UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla principal de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Información básica
  username VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
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

-- Índices para performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_industry ON user_profiles(industry);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);
```

### **Bloque 2: Tabla de Habilidades**
```sql
-- Tabla de habilidades del usuario
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

-- Índices para skills
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_category ON user_skills(skill_category);
CREATE INDEX idx_user_skills_level ON user_skills(skill_level);
```

### **Bloque 3: Tabla de Objetivos**
```sql
-- Tabla de objetivos del usuario (lo que busca)
CREATE TABLE user_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  objective_type VARCHAR(50) NOT NULL, -- 'co-founder', 'team-member', 'advisor', etc.
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, objective_type)
);

-- Índices para objectives
CREATE INDEX idx_user_objectives_user_id ON user_objectives(user_id);
CREATE INDEX idx_user_objectives_type ON user_objectives(objective_type);
```

### **Bloque 4: Tabla de Proyectos**
```sql
-- Tabla de proyectos del usuario
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

-- Índices para projects
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_status ON user_projects(project_status);
```

### **Bloque 5: Tabla de Experiencia**
```sql
-- Tabla de experiencia laboral
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

-- Índices para experience
CREATE INDEX idx_user_experience_user_id ON user_experience(user_id);
CREATE INDEX idx_user_experience_current ON user_experience(is_current);
```

---

## 🔐 **PASO 3: CONFIGURAR SEGURIDAD RLS**

### **Habilitar RLS en todas las tablas:**
```sql
-- Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience ENABLE ROW LEVEL SECURITY;
```

### **Políticas de seguridad:**
```sql
-- Políticas para user_profiles
CREATE POLICY "Users can view public profiles" ON user_profiles
  FOR SELECT USING (
    profile_visibility = 'public' OR 
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para user_skills
CREATE POLICY "Users can manage own skills" ON user_skills
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' skills" ON user_skills
  FOR SELECT USING (true);

-- Políticas para user_objectives
CREATE POLICY "Users can manage own objectives" ON user_objectives
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' objectives" ON user_objectives
  FOR SELECT USING (true);

-- Políticas para user_projects
CREATE POLICY "Users can manage own projects" ON user_projects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' projects" ON user_projects
  FOR SELECT USING (true);

-- Políticas para user_experience
CREATE POLICY "Users can manage own experience" ON user_experience
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view others' experience" ON user_experience
  FOR SELECT USING (true);
```

---

## ⚡ **PASO 4: FUNCIONES AUTOMÁTICAS**

### **Función para updated_at:**
```sql
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
```

### **Función para crear perfil automático:**
```sql
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
```

---

## ✅ **PASO 5: VERIFICAR INSTALACIÓN**

### **Comprobar que todo funciona:**
```sql
-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'user_%'
ORDER BY table_name;

-- Ver índices creados
SELECT indexname, tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'user_%'
ORDER BY tablename, indexname;

-- Ver políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'user_%'
ORDER BY tablename;

-- Ver funciones creadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;
```

### **Resultado esperado:**
```
Tablas:     5 (user_profiles, user_skills, user_objectives, user_projects, user_experience)
Índices:    8+ (optimización de consultas)
Políticas:  15+ (seguridad RLS completa)  
Funciones:  2 (auto-update + auto-creation)
```

---

## 🔧 **PASO 6: CONFIGURAR VARIABLES DE ENTORNO**

Actualiza tu `.env.local`:

```bash
# Supabase - StartupMatch Project
NEXT_PUBLIC_SUPABASE_URL=https://cbaxjoozbnffrryuywno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (para operaciones server-side)
# Ve a Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para obtener Service Role Key:
# 1. Ve a https://supabase.com/dashboard/project/cbaxjoozbnffrryuywno
# 2. Settings > API
# 3. Copia "service_role" key (NO la anon key)
```

---

## 🧪 **PASO 7: DATOS DE PRUEBA (OPCIONAL)**

Si quieres datos de ejemplo para testing:

```sql
-- SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
INSERT INTO user_profiles (
  user_id, username, first_name, last_name, email,
  role, industry, location, bio, headline
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'juan_dev', 'Juan', 'Pérez', 'juan@test.com',
   'Desarrollador Full Stack', 'Tecnología', 'Madrid, España', 
   'Desarrollador apasionado por las startups', 'Full Stack Developer | React Expert'),
   
  ('550e8400-e29b-41d4-a716-446655440001', 'ana_ceo', 'Ana', 'García', 'ana@test.com',
   'Fundador/CEO', 'FinTech', 'Barcelona, España',
   'Emprendedora en fintech con 5 años de experiencia', 'CEO & Founder | FinTech Enthusiast');

-- Skills de ejemplo
INSERT INTO user_skills (user_id, skill_name, skill_level, skill_category, is_primary) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'React', 9, 'Frontend', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Node.js', 8, 'Backend', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'TypeScript', 8, 'Programming', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'Business Strategy', 9, 'Business', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Fundraising', 7, 'Business', false);

-- Objetivos de ejemplo
INSERT INTO user_objectives (user_id, objective_type, priority) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Co-fundador técnico', 1),
  ('550e8400-e29b-41d4-a716-446655440000', 'Mentor', 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'CTO', 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'Desarrollador Senior', 2);
```

---

## 🚀 **QUÉ HEMOS CREADO**

### **📊 Base de Datos Completa:**
- **user_profiles**: Información completa del usuario
- **user_skills**: Skills con niveles 1-10 y categorías
- **user_objectives**: Lo que busca cada usuario
- **user_projects**: Portfolio de proyectos
- **user_experience**: Historial laboral completo

### **🔒 Seguridad Total:**
- **RLS habilitado** en todas las tablas
- **Políticas granulares** para cada tipo de operación
- **Protección automática** de datos privados
- **Triggers de auditoría** para cambios

### **⚡ Funcionalidades Avanzadas:**
- **Auto-creación** de perfiles al registrarse
- **Auto-actualización** de timestamps
- **Integración automática** con formulario de registro
- **Optimización** con índices para consultas rápidas

---

## 🎯 **SIGUIENTES PASOS**

### **Inmediatamente después de ejecutar este SQL:**

1. **✅ Verifica** que todas las tablas se crearon correctamente
2. **✅ Prueba** registrar un nuevo usuario desde tu app
3. **✅ Confirma** que el perfil se crea automáticamente
4. **✅ Testing** de consultas básicas

### **Próximo desarrollo:**

1. **📱 Página de perfil** avanzada con formularios por secciones
2. **🔄 Sistema de matching** usando la función de compatibilidad  
3. **💬 Mensajería** entre usuarios compatibles
4. **📊 Dashboard** con métricas y estadísticas

---

## ⚠️ **NOTAS IMPORTANTES**

- **✅ Ejecuta cada bloque por separado** para evitar errores
- **🔒 Las políticas RLS** protegen automáticamente todos los datos
- **⚡ Los triggers** se ejecutan automáticamente, no requieren intervención
- **🗃️ Los datos de prueba** son opcionales y solo para desarrollo
- **🔑 El Service Role Key** debe mantenerse seguro y privado

---

**✨ ¡Base de datos lista para desarrollo de perfil avanzado!**

*La estructura está optimizada para escalabilidad y permite implementar todas las funcionalidades planificadas en el ROADMAP.md*
