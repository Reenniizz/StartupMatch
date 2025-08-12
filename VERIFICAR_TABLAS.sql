-- VERIFICAR_TABLAS.sql
-- Script para verificar la estructura de las tablas de mensajería

-- Verificar estructura de private_messages
SELECT 'ESTRUCTURA private_messages' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'private_messages'
ORDER BY ordinal_position;

-- Verificar estructura de group_messages
SELECT 'ESTRUCTURA group_messages' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'group_messages'
ORDER BY ordinal_position;

-- Verificar estructura de conversations
SELECT 'ESTRUCTURA conversations' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Verificar estructura de groups
SELECT 'ESTRUCTURA groups' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- Si alguna tabla no existe, crearlas
DO $$
BEGIN
  -- Crear tabla private_messages si no existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'private_messages') THEN
    CREATE TABLE private_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      read_at TIMESTAMP WITH TIME ZONE,
      edited_at TIMESTAMP WITH TIME ZONE
    );
    
    -- Índices
    CREATE INDEX idx_private_messages_conversation ON private_messages(conversation_id);
    CREATE INDEX idx_private_messages_sender ON private_messages(sender_id);
    CREATE INDEX idx_private_messages_created_at ON private_messages(created_at);
    
    RAISE NOTICE 'Tabla private_messages creada';
  END IF;

  -- Crear tabla group_messages si no existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_messages') THEN
    CREATE TABLE group_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      edited_at TIMESTAMP WITH TIME ZONE
    );
    
    -- Índices
    CREATE INDEX idx_group_messages_group ON group_messages(group_id);
    CREATE INDEX idx_group_messages_user ON group_messages(user_id);
    CREATE INDEX idx_group_messages_created_at ON group_messages(created_at);
    
    RAISE NOTICE 'Tabla group_messages creada';
  END IF;
END $$;

-- Verificar que las columnas correctas existen
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'private_messages' AND column_name = 'message'
    ) THEN '✅ private_messages.message existe'
    ELSE '❌ private_messages.message NO existe'
  END as private_message_column,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'group_messages' AND column_name = 'message'
    ) THEN '✅ group_messages.message existe'
    ELSE '❌ group_messages.message NO existe'
  END as group_message_column;
