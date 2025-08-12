-- SQL MÍNIMO para garantizar que las tablas de grupos funcionen
-- VERSIÓN ULTRA-SEGURA - Solo lo esencial
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- SOLO CREAR TABLAS SI NO EXISTEN
-- ============================================

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
-- HABILITAR SEGURIDAD RLS
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SOLO ÍNDICES BÁSICOS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_groups_private ON groups(is_private);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas existen
SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ Las 3 tablas están creadas correctamente'
    ELSE '❌ Faltan tablas: ' || (3 - COUNT(*))::text
  END as estado_tablas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'group_memberships', 'group_messages');

-- Verificar RLS
SELECT 
  table_name,
  CASE 
    WHEN row_security = 'YES' THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as estado_rls
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'group_memberships', 'group_messages')
ORDER BY table_name;

SELECT '✅ Script ejecutado. Las tablas básicas están listas.' as resultado_final;
