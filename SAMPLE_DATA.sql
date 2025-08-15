-- ============================================
-- DATOS DE EJEMPLO PARA STARTUPMATCH
-- Inserta datos de prueba seguros para desarrollo
-- EJECUTAR SOLO DESPUÉS DEL ESQUEMA UNIFICADO
-- ============================================

\echo '🌱 INSERTANDO DATOS DE EJEMPLO...'
\echo ''

BEGIN;

-- ============================================
-- PERFILES DE USUARIO DE EJEMPLO
-- ============================================

\echo '👥 Creando perfiles de usuario...'

-- Desactivar temporalmente RLS para insertar datos
SET session_replication_role = replica;

INSERT INTO user_profiles (
    id,
    full_name,
    bio,
    location,
    skills,
    interests,
    experience_level,
    availability,
    profile_completed,
    created_at,
    updated_at
) VALUES 
-- Perfil 1: Developer Full Stack
(
    'user-dev-001',
    'Ana García López',
    'Desarrolladora Full Stack con 5 años de experiencia. Especializada en React, Node.js y bases de datos. Busco proyectos innovadores en fintech.',
    'Madrid, España',
    ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS'],
    ARRAY['Fintech', 'IA', 'Blockchain', 'Startups'],
    'senior',
    'part_time',
    true,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
),

-- Perfil 2: Diseñador UX/UI
(
    'user-design-002',
    'Carlos Mendoza',
    'Diseñador UX/UI apasionado por crear experiencias digitales excepcionales. 3 años de experiencia en startups tech.',
    'Barcelona, España',
    ARRAY['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
    ARRAY['Design Systems', 'Mobile Apps', 'SaaS', 'E-commerce'],
    'mid',
    'full_time',
    true,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '2 hours'
),

-- Perfil 3: Product Manager
(
    'user-pm-003',
    'María Rodríguez',
    'Product Manager con experiencia en productos digitales B2B. MBA y background técnico. Especializada en metodologías ágiles.',
    'Valencia, España',
    ARRAY['Product Management', 'Scrum', 'Analytics', 'User Stories', 'Roadmapping'],
    ARRAY['SaaS', 'B2B', 'Analytics', 'Growth'],
    'senior',
    'full_time',
    true,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '30 minutes'
),

-- Perfil 4: Marketing Digital
(
    'user-marketing-004',
    'Javier Sánchez',
    'Especialista en marketing digital y growth hacking. Experto en SEO, SEM y marketing de contenidos para startups.',
    'Sevilla, España',
    ARRAY['SEO', 'Google Ads', 'Content Marketing', 'Analytics', 'Social Media'],
    ARRAY['Growth Hacking', 'SaaS Marketing', 'Content Strategy'],
    'mid',
    'part_time',
    true,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 hour'
),

-- Perfil 5: Data Scientist
(
    'user-data-005',
    'Elena Martín',
    'Data Scientist con doctorado en matemáticas. Especializada en machine learning y análisis predictivo para productos digitales.',
    'Bilbao, España',
    ARRAY['Python', 'R', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
    ARRAY['AI', 'Predictive Analytics', 'Business Intelligence'],
    'expert',
    'freelance',
    true,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '6 hours'
);

\echo '✅ Perfiles de usuario creados'

-- ============================================
-- PROYECTOS DE EJEMPLO
-- ============================================

\echo '🚀 Creando proyectos...'

INSERT INTO projects (
    id,
    title,
    description,
    detailed_description,
    owner_id,
    status,
    required_skills,
    preferred_skills,
    team_size,
    duration_estimate,
    budget_range,
    equity_offered,
    project_stage,
    category,
    tags,
    is_featured,
    created_at,
    updated_at
) VALUES 

-- Proyecto 1: Fintech App
(
    'proj-fintech-001',
    'EcoWallet - App de Finanzas Sostenibles',
    'Aplicación móvil que ayuda a los usuarios a invertir en proyectos ecológicos mientras gestionan sus finanzas personales.',
    'EcoWallet combina gestión financiera personal con inversión de impacto. Los usuarios pueden:\n• Gestionar presupuestos y gastos\n• Invertir en proyectos verdes verificados\n• Ganar puntos por decisiones sostenibles\n• Conectar con otros inversores eco-conscientes\n\nBuscamos un equipo comprometido con el impacto ambiental y la innovación fintech.',
    'user-pm-003',
    'active',
    ARRAY['React Native', 'Node.js', 'PostgreSQL', 'API Development'],
    ARRAY['TypeScript', 'AWS', 'Stripe API', 'Financial Modeling'],
    4,
    '6 months',
    '€10,000 - €25,000',
    '2-5%',
    'mvp',
    'fintech',
    ARRAY['sustainability', 'mobile', 'investment', 'green-tech'],
    true,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '2 hours'
),

-- Proyecto 2: HealthTech Platform
(
    'proj-health-002',
    'MindCare - Plataforma de Salud Mental',
    'Plataforma digital que conecta pacientes con profesionales de salud mental a través de terapia online y herramientas de bienestar.',
    'MindCare revoluciona el acceso a la salud mental con:\n• Matching inteligente paciente-terapeuta\n• Sesiones de terapia online seguras\n• Herramientas de autoayuda y meditación\n• Dashboard para profesionales\n• Seguimiento de progreso con IA\n\nPrioridad en privacidad, seguridad y cumplimiento GDPR.',
    'user-dev-001',
    'active',
    ARRAY['React', 'Node.js', 'WebRTC', 'Security', 'GDPR Compliance'],
    ARRAY['TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
    5,
    '8 months',
    '€15,000 - €40,000',
    '5-10%',
    'concept',
    'healthcare',
    ARRAY['mental-health', 'telemedicine', 'AI', 'privacy'],
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 hours'
),

-- Proyecto 3: EdTech Startup
(
    'proj-edtech-003',
    'CodeMentor - Plataforma de Aprendizaje de Programación',
    'Plataforma educativa que enseña programación a través de proyectos reales con mentores expertos de la industria.',
    'CodeMentor ofrece:\n• Cursos prácticos basados en proyectos reales\n• Mentorías 1-on-1 con developers seniors\n• Ambiente de desarrollo integrado en el navegador\n• Certificaciones reconocidas por empresas\n• Comunidad activa de learners y mentores\n\nEnfoque en learning-by-doing y empleabilidad real.',
    'user-design-002',
    'active',
    ARRAY['Vue.js', 'Python', 'Docker', 'Educational Technology'],
    ARRAY['Kubernetes', 'Video Streaming', 'Payment Processing'],
    6,
    '10 months',
    '€20,000 - €50,000',
    '3-8%',
    'prototype',
    'education',
    ARRAY['coding', 'mentorship', 'online-learning', 'career'],
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 hour'
),

-- Proyecto 4: SaaS Tool
(
    'proj-saas-004',
    'FlowTracker - Herramienta de Gestión de Proyectos',
    'SaaS para equipos remotos que combina gestión de proyectos con análisis de productividad y bienestar del equipo.',
    'FlowTracker incluye:\n• Gestión de tareas y proyectos visual\n• Time tracking inteligente\n• Análisis de productividad del equipo\n• Indicadores de bienestar y burnout\n• Integraciones con herramientas populares\n• Reportes automáticos para managers\n\nDiseñado para el futuro del trabajo remoto.',
    'user-marketing-004',
    'active',
    ARRAY['Next.js', 'PostgreSQL', 'Analytics', 'API Integrations'],
    ARRAY['TypeScript', 'Prisma', 'Vercel', 'Stripe'],
    3,
    '4 months',
    '€8,000 - €20,000',
    '5-15%',
    'mvp',
    'productivity',
    ARRAY['remote-work', 'analytics', 'team-management', 'saas'],
    false,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '30 minutes'
),

-- Proyecto 5: AI Startup
(
    'proj-ai-005',
    'VoiceAI - Asistente Virtual para Empresas',
    'Plataforma de IA conversacional que automatiza atención al cliente y procesos internos mediante procesamiento de lenguaje natural.',
    'VoiceAI proporciona:\n• Chatbots inteligentes multiidioma\n• Integración con sistemas empresariales\n• Análisis de sentimientos en tiempo real\n• Escalabilidad automática\n• Dashboard de analytics avanzado\n• API para desarrolladores\n\nTecnología de vanguardia en NLP y machine learning.',
    'user-data-005',
    'active',
    ARRAY['Python', 'Machine Learning', 'NLP', 'API Development'],
    ARRAY['TensorFlow', 'FastAPI', 'Docker', 'Kubernetes'],
    4,
    '12 months',
    '€25,000 - €60,000',
    '1-3%',
    'concept',
    'artificial-intelligence',
    ARRAY['chatbots', 'nlp', 'enterprise', 'automation'],
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '15 minutes'
);

\echo '✅ Proyectos creados'

-- ============================================
-- CONEXIONES DE EJEMPLO
-- ============================================

\echo '🤝 Creando conexiones...'

INSERT INTO connection_requests (
    id,
    requester_id,
    requested_id,
    project_id,
    message,
    status,
    created_at,
    updated_at
) VALUES 

-- Ana (dev) solicita unirse al proyecto de María (PM)
(
    'conn-001',
    'user-dev-001',
    'user-pm-003',
    'proj-fintech-001',
    'Hola María! Me interesa mucho el proyecto EcoWallet. Mi experiencia con React Native y APIs financieras puede ser muy valiosa. ¿Podríamos hablar sobre cómo puedo contribuir?',
    'accepted',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '5 days'
),

-- Carlos (designer) solicita unirse al proyecto de Ana (dev)
(
    'conn-002',
    'user-design-002',
    'user-dev-001',
    'proj-health-002',
    'Ana, el proyecto MindCare me parece fascinante. Como diseñador UX con experiencia en healthcare, creo que puedo aportar mucho valor al diseño de la experiencia del usuario. Especialmente en temas de privacidad y usabilidad para terapia online.',
    'accepted',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days'
),

-- Elena (data scientist) solicita colaborar con el proyecto AI
(
    'conn-003',
    'user-pm-003',
    'user-data-005',
    'proj-ai-005',
    'Elena, he visto tu experiencia en NLP y machine learning. Aunque mi proyecto actual es EcoWallet, estoy muy interesada en colaborar contigo en VoiceAI. ¿Te interesaría que co-lideráramos el proyecto?',
    'pending',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),

-- Javier (marketing) quiere unirse a CodeMentor
(
    'conn-004',
    'user-marketing-004',
    'user-design-002',
    'proj-edtech-003',
    'Carlos, me encanta la visión de CodeMentor. Creo que mi experiencia en marketing digital y growth hacking sería perfecta para escalar la plataforma. Tengo ideas específicas sobre cómo posicionarnos en el mercado EdTech.',
    'accepted',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours'
);

\echo '✅ Conexiones creadas'

-- ============================================
-- CONVERSACIONES DE EJEMPLO
-- ============================================

\echo '💬 Creando conversaciones...'

INSERT INTO conversations (
    id,
    project_id,
    participants,
    last_message_at,
    created_at,
    updated_at
) VALUES 

-- Conversación del equipo EcoWallet
(
    'conv-ecowallet-001',
    'proj-fintech-001',
    ARRAY['user-pm-003', 'user-dev-001'],
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 hours'
),

-- Conversación del equipo MindCare
(
    'conv-mindcare-002',
    'proj-health-002',
    ARRAY['user-dev-001', 'user-design-002'],
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 hour'
),

-- Conversación del equipo CodeMentor
(
    'conv-codementor-003',
    'proj-edtech-003',
    ARRAY['user-design-002', 'user-marketing-004'],
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '30 minutes'
);

\echo '✅ Conversaciones creadas'

-- ============================================
-- MENSAJES DE EJEMPLO
-- ============================================

\echo '📝 Creando mensajes...'

INSERT INTO private_messages (
    id,
    conversation_id,
    sender_id,
    content,
    message_type,
    created_at
) VALUES 

-- Mensajes en EcoWallet team
(
    'msg-001',
    'conv-ecowallet-001',
    'user-pm-003',
    '¡Bienvenida al equipo Ana! Estoy emocionada de trabajar contigo en EcoWallet. ¿Podríamos hacer una llamada mañana para alinear la visión técnica?',
    'text',
    NOW() - INTERVAL '5 days'
),

(
    'msg-002',
    'conv-ecowallet-001',
    'user-dev-001',
    'Perfecto María! Mañana a las 10:00 me viene bien. He estado revisando el concepto y tengo algunas ideas sobre la arquitectura de la API para las inversiones verdes.',
    'text',
    NOW() - INTERVAL '5 days' + INTERVAL '15 minutes'
),

(
    'msg-003',
    'conv-ecowallet-001',
    'user-pm-003',
    'Excelente! También he preparado algunos wireframes iniciales. Creo que deberíamos empezar con un MVP que se enfoque en la gestión de presupuestos y añadir las inversiones en la v2.',
    'text',
    NOW() - INTERVAL '2 hours'
),

-- Mensajes en MindCare team
(
    'msg-004',
    'conv-mindcare-002',
    'user-dev-001',
    'Carlos, me alegra que te hayas unido al proyecto. Tu experiencia en UX para healthcare será clave. ¿Has trabajado antes con aplicaciones de telemedicina?',
    'text',
    NOW() - INTERVAL '3 days'
),

(
    'msg-005',
    'conv-mindcare-002',
    'user-design-002',
    'Sí Ana, trabajé en una startup de telemedicina el año pasado. Aprendí mucho sobre diseño centrado en la privacidad y cómo crear interfaces que generen confianza. Tengo algunos casos de estudio que podría compartir.',
    'text',
    NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'
),

(
    'msg-006',
    'conv-mindcare-002',
    'user-dev-001',
    'Perfecto! También necesitaremos pensar en la integración con WebRTC para las videollamadas. ¿Te parece si empezamos con el user journey del paciente?',
    'text',
    NOW() - INTERVAL '1 hour'
),

-- Mensajes en CodeMentor team
(
    'msg-007',
    'conv-codementor-003',
    'user-design-002',
    'Javier, gracias por tu interés en CodeMentor. Tu expertise en marketing será crucial para diferenciarnos en el mercado EdTech. ¿Cuál crees que debería ser nuestro first market?',
    'text',
    NOW() - INTERVAL '10 hours'
),

(
    'msg-008',
    'conv-codementor-003',
    'user-marketing-004',
    'Creo que deberíamos enfocarnos en developers junior que buscan su primer trabajo. Es un mercado con mucha demanda y willingness to pay. Podríamos empezar con JavaScript y React, que son las skills más demandadas.',
    'text',
    NOW() - INTERVAL '8 hours'
),

(
    'msg-009',
    'conv-codementor-003',
    'user-design-002',
    'Me gusta la idea! También podríamos añadir un programa de job guarantee. Si completas el curso y no encuentras trabajo en 6 meses, te devolvemos el dinero. ¿Qué opinas?',
    'text',
    NOW() - INTERVAL '30 minutes'
);

\echo '✅ Mensajes creados'

-- Reactivar RLS
SET session_replication_role = DEFAULT;

\echo ''
\echo '🎯 DATOS DE EJEMPLO INSERTADOS EXITOSAMENTE'
\echo ''
\echo '📊 RESUMEN:'

-- Mostrar resumen de datos insertados
SELECT 
    'user_profiles' as tabla,
    COUNT(*) as registros
FROM user_profiles
UNION ALL
SELECT 
    'projects' as tabla,
    COUNT(*) as registros  
FROM projects
UNION ALL
SELECT 
    'connection_requests' as tabla,
    COUNT(*) as registros
FROM connection_requests
UNION ALL
SELECT 
    'conversations' as tabla,
    COUNT(*) as registros
FROM conversations
UNION ALL
SELECT 
    'private_messages' as tabla,
    COUNT(*) as registros
FROM private_messages;

\echo ''
\echo '✨ LA BASE DE DATOS ESTÁ LISTA CON DATOS DE PRUEBA'
\echo '🚀 Ahora puedes probar la aplicación con usuarios y proyectos reales'
\echo ''

COMMIT;
