-- Insertar proyectos de ejemplo para testing
-- NOTA: Reemplaza 'a1089270-efec-4c4b-a97f-22bb0cd2f313' con tu ID de usuario real

-- Ejemplo de proyectos para testing
INSERT INTO projects (
    creator_id,
    title,
    tagline,
    description,
    category,
    industry,
    stage,
    tech_stack,
    is_seeking_cofounder,
    is_seeking_investors,
    team_size_target,
    status,
    visibility
) VALUES 
(
    'a1089270-efec-4c4b-a97f-22bb0cd2f313',
    'StartupMatch Platform',
    'Plataforma para conectar emprendedores y co-fundadores',
    'Una plataforma completa que permite a emprendedores encontrar co-fundadores, desarrolladores y otros colaboradores para sus proyectos. Incluye sistema de matching inteligente, chat en tiempo real y gestión de proyectos.',
    'startup',
    'technology',
    'mvp',
    '["Next.js", "TypeScript", "Supabase", "Tailwind CSS"]',
    true,
    false,
    5,
    'active',
    'public'
),
(
    'a1089270-efec-4c4b-a97f-22bb0cd2f313',
    'EcoTracker App',
    'Aplicación para seguimiento de huella de carbono personal',
    'Aplicación móvil que ayuda a los usuarios a rastrear su huella de carbono diaria y obtener recomendaciones personalizadas para reducir su impacto ambiental.',
    'mobile-app',
    'sustainability',
    'idea',
    '["React Native", "Node.js", "MongoDB"]',
    true,
    true,
    3,
    'draft',
    'public'
),
(
    'a1089270-efec-4c4b-a97f-22bb0cd2f313',
    'AI Content Creator',
    'Herramienta de IA para generar contenido de marketing',
    'Plataforma SaaS que utiliza inteligencia artificial para generar contenido de marketing personalizado para pequeñas y medianas empresas.',
    'saas',
    'marketing',
    'beta',
    '["Python", "FastAPI", "OpenAI API", "React"]',
    false,
    true,
    4,
    'active',
    'public'
);

-- Verificar que se insertaron
SELECT id, title, stage, status, created_at 
FROM projects 
WHERE creator_id = 'a1089270-efec-4c4b-a97f-22bb0cd2f313'
ORDER BY created_at DESC;
