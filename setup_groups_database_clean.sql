-- SQL para limpiar y recrear las tablas de grupos en Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ESTE SCRIPT ELIMINARÁ DATOS EXISTENTES

-- ============================================
-- PASO 1: LIMPIAR POLÍTICAS Y TABLAS EXISTENTES
-- ============================================

-- Eliminar políticas existentes para groups
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can view joined groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete groups" ON groups;

-- Eliminar políticas existentes para group_memberships
DROP POLICY IF EXISTS "Users can view group memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can join public groups" ON group_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON group_memberships;

-- Eliminar políticas existentes para group_messages
DROP POLICY IF EXISTS "Members can view group messages" ON group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON group_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON group_messages;

-- Eliminar función existente
DROP FUNCTION IF EXISTS get_user_groups(UUID);

-- Eliminar trigger y función de updated_at
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_messages DISABLE ROW LEVEL SECURITY;

-- Eliminar tablas (¡CUIDADO: ESTO BORRA TODOS LOS DATOS!)
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- ============================================
-- PASO 2: CREAR TABLAS DESDE CERO
-- ============================================

-- Tabla de grupos
CREATE TABLE groups (
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

-- Tabla de membresías de grupos
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

-- Mensajes de grupos
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
  file_url TEXT,
  reply_to UUID REFERENCES group_messages(id),
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- PASO 3: CONFIGURAR SEGURIDAD RLS
-- ============================================

-- Habilitar Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para groups
CREATE POLICY "Users can view public groups" ON groups
  FOR SELECT USING (NOT is_private);

CREATE POLICY "Users can view joined groups" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Creators can delete groups" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- Políticas para group_memberships
CREATE POLICY "Users can view group memberships" ON group_memberships
  FOR SELECT USING (
    group_id IN (
      SELECT id FROM groups WHERE NOT is_private
    ) OR user_id = auth.uid() OR 
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups" ON group_memberships
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (SELECT id FROM groups WHERE NOT is_private)
  );

CREATE POLICY "Admins can manage memberships" ON group_memberships
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Políticas para group_messages
CREATE POLICY "Members can view group messages" ON group_messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages" ON group_messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON group_messages
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- PASO 4: FUNCIONES ÚTILES
-- ============================================

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

-- Función para actualizar updated_at automáticamente
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para groups
CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 5: ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_private ON groups(is_private);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX idx_group_messages_created_at ON group_messages(created_at);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%group%'
ORDER BY table_name;

SELECT 'Policies created:' as status;
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename LIKE '%group%'
ORDER BY tablename, policyname;

SELECT 'Functions created:' as status;
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%group%'
ORDER BY routine_name;
