-- CREAR_CONVERSACION_TEST.sql
-- Script para crear una conversación entre los dos usuarios específicos

DO $$
DECLARE
    user1_uuid UUID := 'a1089270-efec-4c4b-a97f-22bb0cd2f313';
    user2_uuid UUID := '3ba6c41a-1f33-4832-97e4-774e523fe001';
    conversation_uuid UUID;
    rec RECORD;
BEGIN
    RAISE NOTICE 'Usuarios seleccionados:';
    RAISE NOTICE 'Usuario 1: %', user1_uuid;
    RAISE NOTICE 'Usuario 2: %', user2_uuid;
    
    -- Verificar si ya existe una conversación entre estos usuarios
    SELECT id INTO conversation_uuid
    FROM conversations 
    WHERE (user1_id = user1_uuid AND user2_id = user2_uuid) 
       OR (user1_id = user2_uuid AND user2_id = user1_uuid);
    
    IF conversation_uuid IS NOT NULL THEN
        RAISE NOTICE 'Ya existe conversación con ID: %', conversation_uuid;
    ELSE
        -- Crear nueva conversación
        INSERT INTO conversations (user1_id, user2_id) 
        VALUES (user1_uuid, user2_uuid)
        RETURNING id INTO conversation_uuid;
        
        RAISE NOTICE 'Nueva conversación creada con ID: %', conversation_uuid;
        
        -- Insertar algunos mensajes de prueba
        INSERT INTO private_messages (conversation_id, sender_id, message, created_at) VALUES
        (conversation_uuid, user1_uuid, '¡Hola! ¿Cómo estás?', NOW() - INTERVAL '1 hour'),
        (conversation_uuid, user2_uuid, '¡Hola! Todo bien, ¿y tú?', NOW() - INTERVAL '50 minutes'),
        (conversation_uuid, user1_uuid, 'Excelente. ¿Te interesa colaborar en un proyecto?', NOW() - INTERVAL '40 minutes'),
        (conversation_uuid, user2_uuid, 'Claro, cuéntame más detalles', NOW() - INTERVAL '30 minutes'),
        (conversation_uuid, user1_uuid, 'Es una plataforma de matching para startups', NOW() - INTERVAL '20 minutes'),
        (conversation_uuid, user2_uuid, '¡Suena interesante! Cuéntame más', NOW() - INTERVAL '10 minutes');
        
        RAISE NOTICE 'Mensajes de prueba insertados';
    END IF;
    
    -- Mostrar información de la conversación
    RAISE NOTICE 'Información de la conversación:';
    RAISE NOTICE 'ID Conversación: %', conversation_uuid;
    RAISE NOTICE 'Usuario 1: %', user1_uuid;
    RAISE NOTICE 'Usuario 2: %', user2_uuid;
    
    -- Mostrar mensajes
    RAISE NOTICE 'Mensajes en la conversación:';
    FOR rec IN 
        SELECT sender_id, message, created_at 
        FROM private_messages 
        WHERE conversation_id = conversation_uuid 
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '% - %: %', rec.created_at, rec.sender_id, rec.message;
    END LOOP;
END $$;
