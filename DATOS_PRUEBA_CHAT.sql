-- 🎭 SCRIPT PARA CREAR CONVERSACIONES ESPECÍFICAS ENTRE TUS USUARIOS DE PRUEBA
-- Ejecutar después de crear las dos cuentas de prueba

-- Buscar los IDs de los usuarios de prueba
DO $$
DECLARE
    carlos_id UUID;
    ana_id UUID;
    conversation_id UUID;
BEGIN
    -- Obtener IDs de los usuarios de prueba
    SELECT id INTO carlos_id FROM auth.users WHERE email = 'carlos@example.com';
    SELECT id INTO ana_id FROM auth.users WHERE email = 'ana@example.com';
    
    IF carlos_id IS NULL OR ana_id IS NULL THEN
        RAISE NOTICE 'Usuarios de prueba no encontrados. Asegúrate de crear las cuentas primero.';
        RETURN;
    END IF;
    
    -- Crear conversación entre Carlos y Ana
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (carlos_id, ana_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO conversation_id;
    
    -- Si no se creó (ya existía), obtener el ID
    IF conversation_id IS NULL THEN
        SELECT id INTO conversation_id 
        FROM conversations 
        WHERE (user1_id = carlos_id AND user2_id = ana_id) 
           OR (user1_id = ana_id AND user2_id = carlos_id);
    END IF;
    
    -- Crear mensajes de ejemplo entre ellos
    INSERT INTO private_messages (conversation_id, sender_id, message, created_at) VALUES
    (conversation_id, carlos_id, '¡Hola Ana! Vi tu perfil y me parece increíble tu experiencia en desarrollo fullstack.', now() - interval '2 days'),
    (conversation_id, ana_id, 'Hola Carlos! Muchas gracias, he visto que tienes una startup muy interesante. Cuéntame más sobre el proyecto.', now() - interval '2 days' + interval '15 minutes'),
    (conversation_id, carlos_id, 'Estamos desarrollando una plataforma SaaS para empresas. Necesitamos un co-fundador técnico con tu experiencia.', now() - interval '1 day' + interval '8 hours'),
    (conversation_id, ana_id, '¡Suena genial! Me encanta trabajar en SaaS. ¿Qué stack tecnológico están usando?', now() - interval '1 day' + interval '8 hours' + interval '30 minutes'),
    (conversation_id, carlos_id, 'React en frontend, Node.js con Express en backend, y PostgreSQL. También usamos AWS para la infraestructura.', now() - interval '1 day' + interval '10 hours'),
    (conversation_id, ana_id, 'Perfecto, tengo mucha experiencia con ese stack. ¿Te parece si nos reunimos esta semana para hablar más a detalle?', now() - interval '1 day' + interval '12 hours'),
    (conversation_id, carlos_id, '¡Por supuesto! ¿Qué tal el viernes a las 3 PM? Podemos hacerlo por videollamada o presencial.', now() - interval '4 hours'),
    (conversation_id, ana_id, 'Viernes 3 PM perfecto. Prefiero presencial si te parece bien. ¿Conoces algún café céntrico?', now() - interval '2 hours'),
    (conversation_id, carlos_id, 'Excelente! Te parece el Starbucks de Polanco? Es muy céntrico y tranquilo para platicar.', now() - interval '1 hour'),
    (conversation_id, ana_id, 'Perfecto, nos vemos ahí. ¡Estoy muy emocionada por conocer más del proyecto! 🚀', now() - interval '30 minutes');
    
    RAISE NOTICE 'Conversación creada exitosamente entre Carlos y Ana con 10 mensajes de ejemplo';
    
    -- Agregar ambos usuarios a grupos comunes
    INSERT INTO group_memberships (group_id, user_id, role) 
    SELECT g.id, carlos_id, 'member'
    FROM groups g 
    WHERE g.name IN ('Developers México', 'Fundadores Latinoamérica')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO group_memberships (group_id, user_id, role) 
    SELECT g.id, ana_id, 'member'
    FROM groups g 
    WHERE g.name IN ('Developers México', 'Women in Tech MX')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Usuarios agregados a grupos comunes para testing';
END $$;

-- Verificar que se creó todo correctamente
SELECT 
    'VERIFICACIÓN DE USUARIOS DE PRUEBA' as titulo,
    (SELECT COUNT(*) FROM auth.users WHERE email IN ('carlos@example.com', 'ana@example.com')) as usuarios_creados,
    (SELECT COUNT(*) FROM conversations c 
     JOIN auth.users u1 ON c.user1_id = u1.id OR c.user2_id = u1.id
     JOIN auth.users u2 ON c.user1_id = u2.id OR c.user2_id = u2.id
     WHERE u1.email = 'carlos@example.com' AND u2.email = 'ana@example.com') as conversaciones,
    (SELECT COUNT(*) FROM private_messages pm
     JOIN conversations c ON pm.conversation_id = c.id
     JOIN auth.users u1 ON c.user1_id = u1.id OR c.user2_id = u1.id
     JOIN auth.users u2 ON c.user1_id = u2.id OR c.user2_id = u2.id
     WHERE u1.email = 'carlos@example.com' AND u2.email = 'ana@example.com') as mensajes_entre_ellos;

SELECT '✅ DATOS DE PRUEBA CREADOS - Ya puedes probar el chat entre Carlos y Ana' as resultado;
