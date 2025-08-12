-- SCRIPT_COMPLETO_MENSAJES.sql
-- Script completo para crear funciones y datos de prueba del sistema de mensajes

-- PASO 1: Crear las funciones necesarias
-- Función para obtener conversaciones del usuario
CREATE OR REPLACE FUNCTION get_user_conversations(for_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_data JSONB,
  last_message TEXT,
  last_message_at TIMESTAMP,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    CASE 
      WHEN c.user1_id = for_user_id THEN c.user2_id
      ELSE c.user1_id
    END as other_user_id,
    CASE 
      WHEN c.user1_id = for_user_id THEN 
        jsonb_build_object(
          'firstName', p2.first_name,
          'lastName', p2.last_name,
          'company', p2.company,
          'avatar', p2.avatar_url
        )
      ELSE 
        jsonb_build_object(
          'firstName', p1.first_name,
          'lastName', p1.last_name,
          'company', p1.company,
          'avatar', p1.avatar_url
        )
    END as other_user_data,
    c.last_message,
    c.last_message_at,
    (
      SELECT COUNT(*)
      FROM private_messages pm 
      WHERE pm.conversation_id = c.id 
        AND pm.sender_id != for_user_id 
        AND pm.read_at IS NULL
    ) as unread_count
  FROM conversations c
  LEFT JOIN user_profiles p1 ON c.user1_id = p1.user_id
  LEFT JOIN user_profiles p2 ON c.user2_id = p2.user_id
  WHERE c.user1_id = for_user_id OR c.user2_id = for_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ language 'plpgsql';

-- Función para obtener grupos del usuario
CREATE OR REPLACE FUNCTION get_user_groups(for_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_data JSONB,
  member_count BIGINT,
  user_role TEXT,
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
      'avatar', g.avatar_url,
      'isPrivate', g.is_private,
      'isVerified', g.is_verified,
      'tags', g.tags
    ) as group_data,
    (SELECT COUNT(*) FROM group_memberships gm2 WHERE gm2.group_id = g.id) as member_count,
    gm.role::text as user_role,
    (
      SELECT MAX(created_at) 
      FROM group_messages gm3
      WHERE gm3.group_id = g.id
    ) as last_activity
  FROM groups g
  JOIN group_memberships gm ON g.id = gm.group_id
  WHERE gm.user_id = for_user_id
  ORDER BY last_activity DESC NULLS LAST;
END;
$$ language 'plpgsql';

-- PASO 2: Verificar funciones creadas
SELECT '✅ FUNCIONES CREADAS' as estado;
SELECT routine_name as funcion_creada
FROM information_schema.routines 
WHERE routine_name IN ('get_user_conversations', 'get_user_groups');

-- PASO 3: Crear datos de prueba con UUIDs reales
DO $$
DECLARE
  user1_id UUID := '3ba6c41a-1f33-4832-97e4-774e523fe001'; -- Usuario 1
  user2_id UUID := 'a1089270-efec-4c4b-a97f-22bb0cd2f313'; -- Usuario 2
  
  group1_id UUID;
  group2_id UUID;
  conv1_id UUID;
BEGIN
  
  -- Verificar que los usuarios existen
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1_id) THEN
    RAISE EXCEPTION 'Usuario 1 no encontrado: %', user1_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user2_id) THEN
    RAISE EXCEPTION 'Usuario 2 no encontrado: %', user2_id;
  END IF;
  
  RAISE NOTICE 'Iniciando creación de datos de prueba...';

  -- Crear grupos de prueba
  INSERT INTO groups (id, name, description, category, is_private, is_verified, tags, created_by)
  VALUES 
    (gen_random_uuid(), 'Founders FinTech México', 'Comunidad de emprendedores fintech en México', 'Tecnología', false, true, ARRAY['fintech', 'startup', 'méxico'], user1_id),
    (gen_random_uuid(), 'AI Startups Global', 'Red mundial de startups de inteligencia artificial', 'Tecnología', false, true, ARRAY['ai', 'machine-learning', 'global'], user2_id),
    (gen_random_uuid(), 'Investors Network', 'Red privada de inversores angel y VCs', 'Inversión', true, true, ARRAY['investment', 'vc', 'angel'], user1_id);

  -- Obtener los IDs de los grupos creados
  SELECT id INTO group1_id FROM groups WHERE name = 'Founders FinTech México';
  SELECT id INTO group2_id FROM groups WHERE name = 'AI Startups Global';

  RAISE NOTICE 'Grupos creados: % y %', group1_id, group2_id;

  -- Crear membresías de grupo
  INSERT INTO group_memberships (group_id, user_id, role, joined_at)
  VALUES 
    -- Usuario 1 es admin del primer grupo y miembro del segundo
    (group1_id, user1_id, 'admin', now() - interval '30 days'),
    (group2_id, user1_id, 'member', now() - interval '15 days'),
    
    -- Usuario 2 es admin del segundo grupo y miembro del primero
    (group1_id, user2_id, 'member', now() - interval '25 days'),
    (group2_id, user2_id, 'admin', now() - interval '20 days');

  RAISE NOTICE 'Membresías de grupo creadas';

  -- Crear conversación privada
  INSERT INTO conversations (id, user1_id, user2_id, created_at, last_message, last_message_at)
  VALUES 
    (gen_random_uuid(), user1_id, user2_id, now() - interval '7 days', 'Hola! Vi tu perfil y me interesa tu startup.', now() - interval '2 hours')
  RETURNING id INTO conv1_id;

  RAISE NOTICE 'Conversación creada: %', conv1_id;

  -- Crear mensajes privados
  INSERT INTO private_messages (conversation_id, sender_id, message, created_at)
  VALUES 
    (conv1_id, user1_id, 'Hola! Vi tu perfil y me interesa mucho tu startup de FinTech. ¿Podríamos platicar?', now() - interval '2 days 3 hours'),
    (conv1_id, user2_id, '¡Hola! Claro, me da mucho gusto conectar. ¿En qué área te especializas?', now() - interval '2 days 1 hour'),
    (conv1_id, user1_id, 'Soy especialista en pagos digitales y blockchain. He visto que tu proyecto tiene mucho potencial.', now() - interval '1 day 4 hours'),
    (conv1_id, user2_id, 'Gracias! Estamos buscando colaboradores con experiencia en blockchain. ¿Te interesaría una videollamada?', now() - interval '1 day 2 hours'),
    (conv1_id, user1_id, 'Perfecto, estoy disponible mañana en la tarde. Te paso mi calendario.', now() - interval '2 hours');

  RAISE NOTICE 'Mensajes privados creados';

  -- Crear mensajes de grupo
  INSERT INTO group_messages (group_id, user_id, message, created_at)
  VALUES 
    (group1_id, user1_id, '¡Bienvenidos al grupo de Founders FinTech México! Este es un espacio para conectar, colaborar y crecer juntos.', now() - interval '5 days'),
    (group1_id, user2_id, '¡Gracias por la bienvenida! Muy emocionado de ser parte de esta comunidad.', now() - interval '4 days'),
    (group1_id, user1_id, 'Estamos organizando un meetup para el próximo mes. ¿Quién estaría interesado en participar?', now() - interval '3 days'),
    (group1_id, user2_id, '¡Yo me apunto! ¿Ya tienen fecha tentativa?', now() - interval '2 days'),
    
    (group2_id, user2_id, 'Compartiendo artículo interesante sobre el futuro de AI en startups: [link]', now() - interval '6 hours'),
    (group2_id, user1_id, 'Excelente artículo! Muy relevante para lo que estamos construyendo.', now() - interval '4 hours');

  RAISE NOTICE 'Mensajes de grupo creados';

  -- Actualizar timestamps de última actividad
  UPDATE conversations 
  SET last_message_at = (
    SELECT MAX(created_at) 
    FROM private_messages 
    WHERE conversation_id = conversations.id
  ),
  last_message = (
    SELECT message 
    FROM private_messages 
    WHERE conversation_id = conversations.id 
    ORDER BY created_at DESC 
    LIMIT 1
  );

  RAISE NOTICE 'Timestamps actualizados';
  RAISE NOTICE '✅ Datos de prueba creados exitosamente!';

END $$;

-- PASO 4: Verificar datos creados
SELECT '📊 RESUMEN DE DATOS CREADOS' as titulo;

SELECT 'GRUPOS' as tipo, COUNT(*) as cantidad FROM groups
UNION ALL
SELECT 'MEMBRESÍAS', COUNT(*) FROM group_memberships
UNION ALL  
SELECT 'CONVERSACIONES', COUNT(*) FROM conversations
UNION ALL
SELECT 'MENSAJES PRIVADOS', COUNT(*) FROM private_messages
UNION ALL
SELECT 'MENSAJES GRUPALES', COUNT(*) FROM group_messages;

-- PASO 5: Probar las funciones
SELECT '🧪 PRUEBAS DE FUNCIONES' as titulo;

-- Probar get_user_conversations para usuario 1
SELECT 'Conversaciones Usuario 1' as prueba;
SELECT * FROM get_user_conversations('3ba6c41a-1f33-4832-97e4-774e523fe001');

-- Probar get_user_groups para usuario 1
SELECT 'Grupos Usuario 1' as prueba;
SELECT * FROM get_user_groups('3ba6c41a-1f33-4832-97e4-774e523fe001');

SELECT '🚀 TODO LISTO PARA PROBAR LAS APIS!' as resultado;
