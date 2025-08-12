-- DATOS_CHAT_PRUEBA.sql
-- Script para poblar la base de datos con datos de prueba para el sistema de mensajes

-- PASO 1: Verificar que tenemos usuarios en la tabla auth.users
-- Necesitamos usar los UUIDs reales de los usuarios que ya están registrados
-- Este script debe ser ejecutado después de que tengas al menos 2 usuarios registrados

-- PASO 2: Obtener los IDs de usuarios existentes (ejecutar primero para ver los UUIDs)
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- PASO 3: Una vez que tengas los UUIDs, reemplaza estos valores de ejemplo:
-- IMPORTANTE: UUIDs reales de la base de datos
DO $$
DECLARE
  user1_id UUID := '3ba6c41a-1f33-4832-97e4-774e523fe001'; -- Usuario 1
  user2_id UUID := 'a1089270-efec-4c4b-a97f-22bb0cd2f313'; -- Usuario 2
  user3_id UUID := NULL; -- Opcional (sin tercer usuario por ahora)
  
  group1_id UUID;
  group2_id UUID;
  conv1_id UUID;
  conv2_id UUID;
BEGIN
  
  -- Verificar que los usuarios existen
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user1_id) THEN
    RAISE EXCEPTION 'Usuario 1 no encontrado: %', user1_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user2_id) THEN
    RAISE EXCEPTION 'Usuario 2 no encontrado: %', user2_id;
  END IF;
  
  RAISE NOTICE 'Iniciando creación de datos de prueba...';

  -- PASO 4: Crear grupos de prueba
  INSERT INTO groups (id, name, description, category, is_private, is_verified, tags, created_by)
  VALUES 
    (gen_random_uuid(), 'Founders FinTech México', 'Comunidad de emprendedores fintech en México', 'Tecnología', false, true, ARRAY['fintech', 'startup', 'méxico'], user1_id),
    (gen_random_uuid(), 'AI Startups Global', 'Red mundial de startups de inteligencia artificial', 'Tecnología', false, true, ARRAY['ai', 'machine-learning', 'global'], user2_id),
    (gen_random_uuid(), 'Investors Network', 'Red privada de inversores angel y VCs', 'Inversión', true, true, ARRAY['investment', 'vc', 'angel'], user1_id)
  RETURNING id INTO group1_id;

  -- Obtener los IDs de los grupos creados
  SELECT id INTO group1_id FROM groups WHERE name = 'Founders FinTech México';
  SELECT id INTO group2_id FROM groups WHERE name = 'AI Startups Global';

  RAISE NOTICE 'Grupos creados: % y %', group1_id, group2_id;

  -- PASO 5: Crear membresías de grupo
  INSERT INTO group_memberships (group_id, user_id, role, joined_at)
  VALUES 
    -- Usuario 1 es admin del primer grupo y miembro del segundo
    (group1_id, user1_id, 'admin', now() - interval '30 days'),
    (group2_id, user1_id, 'member', now() - interval '15 days'),
    
    -- Usuario 2 es admin del segundo grupo y miembro del primero
    (group1_id, user2_id, 'member', now() - interval '25 days'),
    (group2_id, user2_id, 'admin', now() - interval '20 days');

  -- Si tienes un tercer usuario, agregarlo también
  IF user3_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = user3_id) THEN
    INSERT INTO group_memberships (group_id, user_id, role, joined_at)
    VALUES 
      (group1_id, user3_id, 'member', now() - interval '10 days'),
      (group2_id, user3_id, 'member', now() - interval '5 days');
  END IF;

  RAISE NOTICE 'Membresías de grupo creadas';

  -- PASO 6: Crear conversaciones privadas
  INSERT INTO conversations (id, user1_id, user2_id, created_at, last_message, last_message_at)
  VALUES 
    (gen_random_uuid(), user1_id, user2_id, now() - interval '7 days', 'Hola! Vi tu perfil y me interesa tu startup.', now() - interval '2 hours');

  -- Obtener el ID de la conversación creada
  SELECT id INTO conv1_id FROM conversations WHERE user1_id = user1_id AND user2_id = user2_id;

  RAISE NOTICE 'Conversación creada: %', conv1_id;

  -- PASO 7: Crear mensajes privados
  INSERT INTO private_messages (conversation_id, sender_id, receiver_id, message, created_at)
  VALUES 
    (conv1_id, user1_id, user2_id, 'Hola! Vi tu perfil y me interesa mucho tu startup de FinTech. ¿Podríamos platicar?', now() - interval '2 days 3 hours'),
    (conv1_id, user2_id, user1_id, '¡Hola! Claro, me da mucho gusto conectar. ¿En qué área te especializas?', now() - interval '2 days 1 hour'),
    (conv1_id, user1_id, user2_id, 'Soy especialista en pagos digitales y blockchain. He visto que tu proyecto tiene mucho potencial.', now() - interval '1 day 4 hours'),
    (conv1_id, user2_id, user1_id, 'Gracias! Estamos buscando colaboradores con experiencia en blockchain. ¿Te interesaría una videollamada?', now() - interval '1 day 2 hours'),
    (conv1_id, user1_id, user2_id, 'Perfecto, estoy disponible mañana en la tarde. Te paso mi calendario.', now() - interval '2 hours');

  RAISE NOTICE 'Mensajes privados creados';

  -- PASO 8: Crear mensajes de grupo
  INSERT INTO group_messages (group_id, sender_id, message, created_at)
  VALUES 
    (group1_id, user1_id, '¡Bienvenidos al grupo de Founders FinTech México! Este es un espacio para conectar, colaborar y crecer juntos.', now() - interval '5 days'),
    (group1_id, user2_id, '¡Gracias por la bienvenida! Muy emocionado de ser parte de esta comunidad.', now() - interval '4 days'),
    (group1_id, user1_id, 'Estamos organizando un meetup para el próximo mes. ¿Quién estaría interesado en participar?', now() - interval '3 days'),
    (group1_id, user2_id, '¡Yo me apunto! ¿Ya tienen fecha tentativa?', now() - interval '2 days'),
    
    (group2_id, user2_id, 'Compartiendo artículo interesante sobre el futuro de AI en startups: [link]', now() - interval '6 hours'),
    (group2_id, user1_id, 'Excelente artículo! Muy relevante para lo que estamos construyendo.', now() - interval '4 hours');

  RAISE NOTICE 'Mensajes de grupo creados';

  -- PASO 9: Actualizar timestamps de última actividad
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
  RAISE NOTICE 'Datos de prueba creados exitosamente!';

END $$;

-- PASO 10: Verificar los datos creados
SELECT 'GRUPOS CREADOS' as tipo, COUNT(*) as cantidad FROM groups
UNION ALL
SELECT 'MEMBRESÍAS', COUNT(*) FROM group_memberships
UNION ALL  
SELECT 'CONVERSACIONES', COUNT(*) FROM conversations
UNION ALL
SELECT 'MENSAJES PRIVADOS', COUNT(*) FROM private_messages
UNION ALL
SELECT 'MENSAJES GRUPALES', COUNT(*) FROM group_messages;

-- PASO 11: Ver los datos creados
SELECT 
  'Grupos' as tipo,
  g.name,
  g.description,
  g.category,
  COUNT(gm.user_id) as miembros
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.description, g.category
ORDER BY g.created_at DESC;

-- PASO 12: Ver conversaciones
SELECT 
  'Conversaciones' as tipo,
  c.id,
  u1.email as usuario1,
  u2.email as usuario2,
  c.last_message,
  c.last_message_at
FROM conversations c
JOIN auth.users u1 ON c.user1_id = u1.id
JOIN auth.users u2 ON c.user2_id = u2.id
ORDER BY c.last_message_at DESC;
