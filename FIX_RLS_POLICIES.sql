-- FIX_RLS_POLICIES.sql
-- Script para arreglar las políticas RLS que causan recursión infinita

-- PASO 1: Eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "Users can view group memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can manage their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Group admins can manage memberships" ON group_memberships;
DROP POLICY IF EXISTS "Members can view group info" ON groups;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;

-- Eliminar políticas adicionales que puedan existir
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- PASO 2: Crear políticas RLS simples y seguras
-- Políticas para group_memberships
CREATE POLICY "Users can view their own memberships" 
ON group_memberships FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" 
ON group_memberships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" 
ON group_memberships FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships" 
ON group_memberships FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para groups - permitir lectura de grupos públicos
CREATE POLICY "Anyone can view public groups" 
ON groups FOR SELECT 
USING (is_private = false OR created_by = auth.uid());

CREATE POLICY "Users can create groups" 
ON groups FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their groups" 
ON groups FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their groups" 
ON groups FOR DELETE 
USING (auth.uid() = created_by);

-- Políticas para group_messages
CREATE POLICY "Group members can view messages" 
ON group_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_memberships gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can send messages" 
ON group_messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_memberships gm 
    WHERE gm.group_id = group_messages.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Políticas para conversations
CREATE POLICY "Users can view their conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations" 
ON conversations FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Políticas para private_messages
CREATE POLICY "Users can view their private messages" 
ON private_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = private_messages.conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send private messages" 
ON private_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = private_messages.conversation_id 
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- PASO 3: Verificar políticas creadas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('groups', 'group_memberships', 'group_messages', 'conversations', 'private_messages')
ORDER BY tablename, policyname;

SELECT '✅ POLÍTICAS RLS ARREGLADAS' as resultado;
