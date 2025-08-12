-- 📨 STARTUPATCH - DATOS DE EJEMPLO PARA SISTEMA DE MENSAJERÍA
-- Ejecutar después de completar FASE 2
-- Versión: 1.0 | Fecha: Agosto 12, 2025

-- ⚠️ IMPORTANTE: Estos datos son de ejemplo para desarrollo y testing
-- NO ejecutar en producción con usuarios reales

SET client_encoding = 'UTF8';

-- 🎯 PARTE 1: GRUPOS TEMÁTICOS
-- Insertar grupos variados por industria y temas

INSERT INTO groups (id, name, description, category, is_private, is_verified, member_limit, tags, created_by) VALUES

-- Grupos de Tecnología
('550e8400-e29b-41d4-a716-446655440001', 
 'Developers México', 
 'Comunidad de desarrolladores en México. Discutimos tecnologías, oportunidades laborales y proyectos colaborativos.',
 'Tecnología', 
 false, 
 true, 
 500,
 ARRAY['desarrollo', 'programación', 'tecnología', 'méxico', 'trabajo'],
 (SELECT id FROM auth.users LIMIT 1)),

('550e8400-e29b-41d4-a716-446655440002',
 'AI & Machine Learning',
 'Espacio para profesionales de IA, ML y Data Science. Compartimos proyectos, papers y oportunidades.',
 'Tecnología',
 false,
 true,
 300,
 ARRAY['ai', 'machine-learning', 'data-science', 'python', 'tensorflow'],
 (SELECT id FROM auth.users LIMIT 1)),

-- Grupos de Startups
('550e8400-e29b-41d4-a716-446655440003',
 'Fundadores Latinoamérica',
 'Red de fundadores y co-fundadores en LATAM. Networking, mentorías y colaboraciones estratégicas.',
 'Startups',
 false,
 true,
 200,
 ARRAY['startups', 'fundadores', 'emprendimiento', 'latam', 'networking'],
 (SELECT id FROM auth.users LIMIT 1)),

('550e8400-e29b-41d4-a716-446655440004',
 'Fintech Innovators',
 'Comunidad de profesionales en fintech. Discutimos tendencias, regulaciones y oportunidades de negocio.',
 'Fintech',
 false,
 true,
 150,
 ARRAY['fintech', 'blockchain', 'pagos', 'banking', 'crypto'],
 (SELECT id FROM auth.users LIMIT 1)),

-- Grupos de Marketing
('550e8400-e29b-41d4-a716-446655440005',
 'Growth Hackers',
 'Estrategias de crecimiento, marketing digital y acquisition. Para marketers y growth managers.',
 'Marketing',
 false,
 false,
 250,
 ARRAY['growth-hacking', 'marketing', 'digital', 'seo', 'analytics'],
 (SELECT id FROM auth.users LIMIT 1)),

-- Grupos Privados/Selectos
('550e8400-e29b-41d4-a716-446655440006',
 'CTO Network',
 'Red privada de CTOs y líderes técnicos. Discusiones estratégicas sobre tecnología y equipos.',
 'Liderazgo',
 true,
 true,
 50,
 ARRAY['cto', 'liderazgo', 'arquitectura', 'equipos', 'estrategia'],
 (SELECT id FROM auth.users LIMIT 1)),

('550e8400-e29b-41d4-a716-446655440007',
 'Women in Tech MX',
 'Comunidad de mujeres en tecnología en México. Mentorías, networking y apoyo profesional.',
 'Diversidad',
 false,
 true,
 300,
 ARRAY['mujeres', 'tecnología', 'diversidad', 'mentorías', 'networking'],
 (SELECT id FROM auth.users LIMIT 1)),

-- Grupos por Ciudad
('550e8400-e29b-41d4-a716-446655440008',
 'Startup CDMX',
 'Ecosistema startup en Ciudad de México. Eventos, networking y colaboraciones locales.',
 'Local',
 false,
 false,
 400,
 ARRAY['cdmx', 'startups', 'eventos', 'networking', 'local'],
 (SELECT id FROM auth.users LIMIT 1));

-- Verificar grupos creados
SELECT 
    name, 
    category, 
    ARRAY_LENGTH(tags, 1) as tag_count,
    is_private,
    is_verified
FROM groups 
ORDER BY created_at;

-- 🎯 PARTE 2: MEMBRESÍAS DE GRUPOS
-- Simular usuarios uniéndose a grupos con diferentes roles

-- Insertar membresías (usando IDs de usuarios existentes)
DO $$
DECLARE
    user_ids UUID[];
    group_ids UUID[];
    i INTEGER;
    j INTEGER;
    random_role TEXT;
BEGIN
    -- Obtener IDs de usuarios disponibles
    SELECT ARRAY(SELECT id FROM auth.users ORDER BY created_at LIMIT 10) INTO user_ids;
    
    -- Obtener IDs de grupos
    SELECT ARRAY(SELECT id FROM groups ORDER BY created_at) INTO group_ids;
    
    -- Si no hay usuarios, crear datos de ejemplo básicos
    IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) = 0 THEN
        RAISE NOTICE 'No hay usuarios en auth.users. Debes registrar usuarios primero.';
        RAISE NOTICE 'Las membresías se crearán cuando tengas usuarios reales.';
        RETURN;
    END IF;
    
    -- Crear membresías para cada grupo
    FOR i IN 1..array_length(group_ids, 1) LOOP
        -- Primer usuario como admin
        INSERT INTO group_memberships (group_id, user_id, role) 
        VALUES (group_ids[i], user_ids[1], 'admin')
        ON CONFLICT DO NOTHING;
        
        -- Agregar 3-7 miembros más por grupo
        FOR j IN 2..LEAST(array_length(user_ids, 1), 1 + (random() * 6)::INTEGER + 3) LOOP
            -- Roles aleatorios
            random_role := CASE (random() * 10)::INTEGER
                WHEN 0 THEN 'moderator'
                ELSE 'member'
            END;
            
            INSERT INTO group_memberships (group_id, user_id, role) 
            VALUES (group_ids[i], user_ids[j], random_role)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Membresías creadas exitosamente para % usuarios en % grupos', 
                 array_length(user_ids, 1), array_length(group_ids, 1);
END $$;

-- Verificar membresías
SELECT 
    g.name as grupo,
    COUNT(gm.user_id) as miembros,
    COUNT(CASE WHEN gm.role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN gm.role = 'moderator' THEN 1 END) as moderators,
    COUNT(CASE WHEN gm.role = 'member' THEN 1 END) as members
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
GROUP BY g.id, g.name
ORDER BY miembros DESC;

-- 🎯 PARTE 3: CONVERSACIONES PRIVADAS
-- Crear conversaciones entre usuarios

DO $$
DECLARE
    user_ids UUID[];
    i INTEGER;
    j INTEGER;
BEGIN
    -- Obtener usuarios
    SELECT ARRAY(SELECT id FROM auth.users ORDER BY created_at LIMIT 10) INTO user_ids;
    
    IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) < 2 THEN
        RAISE NOTICE 'Necesitas al menos 2 usuarios para crear conversaciones.';
        RETURN;
    END IF;
    
    -- Crear conversaciones entre diferentes pares de usuarios
    FOR i IN 1..array_length(user_ids, 1) LOOP
        FOR j IN (i+1)..LEAST(array_length(user_ids, 1), i+3) LOOP
            INSERT INTO conversations (user1_id, user2_id) 
            VALUES (user_ids[i], user_ids[j])
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Conversaciones privadas creadas entre usuarios';
END $$;

-- 🎯 PARTE 4: MENSAJES DE GRUPOS
-- Crear mensajes realistas en los grupos

DO $$
DECLARE
    group_ids UUID[];
    user_ids UUID[];
    conversation_ids UUID[];
    i INTEGER;
    random_user UUID;
    random_group UUID;
    mensajes_grupo TEXT[] := ARRAY[
        '¡Hola a todos! Soy nuevo en el grupo 👋',
        'Excelente iniciativa, me parece muy útil este espacio',
        '¿Alguien tiene experiencia con microservicios en Node.js?',
        'Comparto un artículo interesante sobre las últimas tendencias',
        '¿Hay algún evento presencial próximamente?',
        'Busco colaboradores para un proyecto innovador',
        '¡Felicitaciones por el crecimiento de la comunidad!',
        '¿Recomendaciones de libros sobre liderazgo técnico?',
        'Estoy organizando un workshop, ¿les interesa participar?',
        'Gran discusión la de ayer, aprendí mucho',
        'Comparto mi experiencia con esta tecnología...',
        '¿Alguien más va a la conferencia de este mes?',
        'Pregunta técnica: ¿cuál es su stack favorito?',
        'Nuevo en la ciudad, ¿recomendaciones de coworking?',
        'Compartiendo oportunidad laboral interesante'
    ];
    mensajes_privados TEXT[] := ARRAY[
        'Hola! Vi tu perfil y me pareció muy interesante tu experiencia',
        'Muchas gracias por conectar, espero podamos colaborar',
        '¿Te interesaría tomar un café para conocernos mejor?',
        'Excelente presentación en el evento de ayer',
        '¿Tienes tiempo para una llamada esta semana?',
        'Me encantaría conocer más sobre tu proyecto',
        'Podríamos hacer networking en el próximo meetup',
        'Tu experiencia en esa empresa debe ser muy valiosa',
        '¿Cómo has encontrado el mercado laboral últimamente?',
        'Interesante punto de vista sobre el tema que discutimos'
    ];
BEGIN
    -- Obtener IDs necesarios
    SELECT ARRAY(SELECT id FROM groups) INTO group_ids;
    SELECT ARRAY(SELECT id FROM auth.users LIMIT 10) INTO user_ids;
    SELECT ARRAY(SELECT id FROM conversations) INTO conversation_ids;
    
    IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) = 0 THEN
        RAISE NOTICE 'No hay usuarios disponibles para crear mensajes.';
        RETURN;
    END IF;
    
    -- Crear mensajes de grupo
    IF array_length(group_ids, 1) > 0 THEN
        FOR i IN 1..30 LOOP -- 30 mensajes de grupo
            random_group := group_ids[1 + (random() * (array_length(group_ids, 1) - 1))::INTEGER];
            random_user := user_ids[1 + (random() * (array_length(user_ids, 1) - 1))::INTEGER];
            
            -- Solo insertar si el usuario es miembro del grupo
            IF EXISTS (SELECT 1 FROM group_memberships WHERE group_id = random_group AND user_id = random_user) THEN
                INSERT INTO group_messages (group_id, user_id, message, created_at) 
                VALUES (
                    random_group,
                    random_user,
                    mensajes_grupo[1 + (random() * (array_length(mensajes_grupo, 1) - 1))::INTEGER],
                    now() - (random() * interval '7 days') -- Mensajes de la última semana
                );
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Mensajes de grupo creados exitosamente';
    END IF;
    
    -- Crear mensajes privados
    IF array_length(conversation_ids, 1) > 0 THEN
        FOR i IN 1..20 LOOP -- 20 mensajes privados
            DECLARE
                random_conversation_id UUID;
                sender_id UUID;
                receiver_id UUID;
            BEGIN
                random_conversation_id := conversation_ids[1 + (random() * (array_length(conversation_ids, 1) - 1))::INTEGER];
                
                -- Obtener los usuarios de la conversación
                SELECT user1_id, user2_id INTO sender_id, receiver_id 
                FROM conversations 
                WHERE id = random_conversation_id;
                
                -- Alternar quién envía el mensaje
                IF random() > 0.5 THEN
                    sender_id := receiver_id;
                END IF;
                
                INSERT INTO private_messages (conversation_id, sender_id, message, created_at) 
                VALUES (
                    random_conversation_id,
                    sender_id,
                    mensajes_privados[1 + (random() * (array_length(mensajes_privados, 1) - 1))::INTEGER],
                    now() - (random() * interval '5 days') -- Mensajes de los últimos 5 días
                );
            END;
        END LOOP;
        
        RAISE NOTICE 'Mensajes privados creados exitosamente';
    END IF;
END $$;

-- 🎯 VERIFICACIÓN FINAL
-- Mostrar resumen de datos creados

SELECT '📊 RESUMEN DE DATOS DE MENSAJERÍA CREADOS' as titulo;

SELECT 
    'GRUPOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN is_private THEN 1 END) as privados,
    COUNT(CASE WHEN is_verified THEN 1 END) as verificados
FROM groups

UNION ALL

SELECT 
    'MEMBRESÍAS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'member' THEN 1 END) as members
FROM group_memberships

UNION ALL

SELECT 
    'CONVERSACIONES' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN last_message IS NOT NULL THEN 1 END) as con_mensajes,
    0 as extra
FROM conversations

UNION ALL

SELECT 
    'MENSAJES GRUPO' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN message_type = 'text' THEN 1 END) as texto,
    0 as extra
FROM group_messages

UNION ALL

SELECT 
    'MENSAJES PRIVADOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as no_leidos,
    0 as extra
FROM private_messages;

-- 🔍 VERIFICAR FUNCIONES CREADAS EN FASE 2
SELECT '🔧 FUNCIONES DE MENSAJERÍA DISPONIBLES' as titulo;

SELECT 
    routine_name as funcion,
    'Disponible ✅' as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_conversations', 'get_user_groups', 'update_conversation_last_message');

-- 🎯 EJEMPLOS DE CONSULTAS ÚTILES
SELECT '📝 EJEMPLOS DE USO' as titulo;

-- Mostrar grupos más activos
WITH grupos_activos AS (
    SELECT 
        g.name,
        COUNT(gm.id) as total_mensajes
    FROM groups g
    LEFT JOIN group_messages gm ON g.id = gm.group_id
    GROUP BY g.id, g.name
    ORDER BY COUNT(gm.id) DESC
    LIMIT 3
)
SELECT 
    'Top 3 Grupos Más Activos' as consulta,
    STRING_AGG(name || ' (' || total_mensajes || ' mensajes)', ', ') as resultado
FROM grupos_activos;

-- Estadísticas por categoría
SELECT 
    category as categoria,
    COUNT(*) as grupos,
    SUM(member_limit) as capacidad_total,
    AVG(member_limit) as capacidad_promedio
FROM groups
GROUP BY category
ORDER BY grupos DESC;

SELECT '✅ DATOS DE MENSAJERÍA CREADOS EXITOSAMENTE' as resultado;
SELECT '🚀 Ahora puedes probar las funciones de mensajería con datos reales' as siguiente_paso;
