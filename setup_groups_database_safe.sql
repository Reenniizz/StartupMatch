-- SQL para actualizar/completar las tablas de grupos en Supabase
-- VERSIÓN SEGURA - NO ELIMINA DATOS EXISTENTES
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- VERIFICAR QUE TENEMOS LAS TABLAS BÁSICAS
-- ============================================

-- Solo crear tablas si no existen
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  avatar_url TEXT,
  cover_url TEXT,
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  member_limit INTEGER DEFAULT 100,
  tags TEXT[],
  
  -- Metadatos
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  reply_to UUID REFERENCES group_messages(id),
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- ASEGURAR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SOLO CREAR FUNCIONES SI NO EXISTEN
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar función existente y recrearla con la definición correcta
DROP FUNCTION IF EXISTS get_user_groups(UUID);

-- Función para obtener grupos del usuario
CREATE FUNCTION get_user_groups(for_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_data JSONB,
  member_count BIGINT,
  last_activity TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as group_id,
    jsonb_build_object(
      'name', g.name,
      'description', g.description,
      'category', g.category,
      'isPrivate', g.is_private,
      'isVerified', g.is_verified,
      'tags', g.tags,
      'createdBy', g.created_by,
      'createdAt', g.created_at
    ) as group_data,
    COUNT(gm.user_id) as member_count,
    COALESCE(MAX(gmsg.created_at), g.created_at) as last_activity
  FROM groups g
  LEFT JOIN group_memberships gm ON g.id = gm.group_id
  LEFT JOIN group_messages gmsg ON g.id = gmsg.group_id
  WHERE g.id IN (
    SELECT group_id FROM group_memberships WHERE user_id = for_user_id
  )
  GROUP BY g.id, g.name, g.description, g.category, g.is_private, g.is_verified, 
           g.tags, g.created_by, g.created_at
  ORDER BY last_activity DESC;
END;
$$ language 'plpgsql';

-- ============================================
-- CREAR TRIGGER SI NO EXISTE
-- ============================================

-- Eliminar trigger si existe y recrearlo
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREAR ÍNDICES SI NO EXISTEN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_private ON groups(is_private);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- ============================================
-- MENSAJE FINAL
-- ============================================

SELECT '✅ Script ejecutado correctamente. Las tablas están listas para usar.' as resultado;
