import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { secureAuthService } from '@/lib/auth-security';
import { inputValidationService } from '@/lib/input-validation';
import { rateLimit } from '@/lib/rate-limiting';
import { sanitizeInput } from '@/lib/xss-protection';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { z } from 'zod';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

// Schema de validación para parámetros de query
const QuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  seeking_cofounder: z.string().optional(),
  seeking_investors: z.string().optional(),
  page: z.string().optional().transform(val => {
    const parsed = parseInt(val || '1');
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform(val => {
    const parsed = parseInt(val || '20');
    return isNaN(parsed) || parsed < 1 || parsed > 100 ? 20 : parsed;
  })
});

// Schema de validación para creación de proyectos
const ProjectCreateSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(200, 'Título muy largo'),
  tagline: z.string().max(300, 'Tagline muy largo').optional(),
  description: z.string().min(10, 'Descripción muy corta').max(1000, 'Descripción muy larga'),
  detailed_description: z.string().max(5000, 'Descripción detallada muy larga').optional(),
  category: z.enum(['tech', 'health', 'finance', 'education', 'entertainment', 'social', 'other']),
  industry: z.string().min(1, 'Industria requerida').max(100, 'Industria muy larga'),
  stage: z.enum(['idea', 'mvp', 'beta', 'launched', 'scaling']).default('idea'),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  start_date: z.string().optional(),
  target_completion_date: z.string().optional(),
  logo_url: z.string().url('URL de logo inválida').optional(),
  cover_image_url: z.string().url('URL de imagen de portada inválida').optional(),
  demo_url: z.string().url('URL de demo inválida').optional(),
  website_url: z.string().url('URL de website inválida').optional(),
  repository_url: z.string().url('URL de repositorio inválida').optional(),
  pitch_deck_url: z.string().url('URL de pitch deck inválida').optional(),
  demo_video_url: z.string().url('URL de video demo inválida').optional(),
  tech_stack: z.array(z.string()).max(20, 'Máximo 20 tecnologías').optional(),
  required_skills: z.array(z.string()).max(15, 'Máximo 15 habilidades').optional(),
  funding_goal: z.number().positive('Meta de financiamiento debe ser positiva').optional(),
  funding_stage: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'ipo']).optional(),
  equity_offered: z.number().min(0, 'Equity ofrecido debe ser positivo').max(100, 'Equity máximo 100%').optional(),
  team_size_target: z.number().int().min(1, 'Tamaño de equipo mínimo 1').max(100, 'Tamaño de equipo máximo 100').default(1),
  is_seeking_cofounder: z.boolean().default(false),
  is_seeking_investors: z.boolean().default(false),
  is_seeking_mentors: z.boolean().default(false),
  is_open_to_collaboration: z.boolean().default(true),
  accepts_applications: z.boolean().default(true),
  application_deadline: z.string().optional(),
  requires_application_message: z.boolean().default(false),
  tags: z.array(z.string()).max(20, 'Máximo 20 etiquetas').optional()
});

// GET /api/projects - Obtener proyectos con filtros y búsqueda
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkLimit(clientIP, 'api_projects_get', 200, 60000);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded for projects GET API', {
        source: 'projects_api',
        ip: clientIP,
        endpoint: '/api/projects'
      });
      
      return NextResponse.json({
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter || 60
      }, { 
        status: 429,
        headers: {
          ...getAPISecurityHeaders(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      });
    }

    // 2. Validación de entrada
    const { searchParams } = new URL(request.url);
    const queryData = {
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      industry: searchParams.get('industry'),
      stage: searchParams.get('stage'),
      seeking_cofounder: searchParams.get('seeking_cofounder'),
      seeking_investors: searchParams.get('seeking_investors'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    };

    const validation = inputValidationService.validate(queryData, QuerySchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input in projects GET API', {
        source: 'projects_api',
        errors: validation.errors,
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Parámetros de entrada inválidos',
        code: 'INVALID_INPUT',
        details: validation.errors
      }, { 
        status: 400,
        headers: getAPISecurityHeaders()
      });
    }

    const { page, limit } = validation.sanitizedData;
    const offset = (page - 1) * limit;

    // 3. Autenticación
    try {
      const authContext = await secureAuthService.verifyAuth(request);
      if (!authContext.user) {
        throw new Error('Usuario no autenticado');
      }
    } catch (authError) {
      logSecurityEvent('auth', 'medium', 'Authentication failed in projects GET API', {
        source: 'projects_api',
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Autenticación requerida',
        code: 'UNAUTHORIZED'
      }, { 
        status: 401,
        headers: getAPISecurityHeaders()
      });
    }

    // 4. Obtener proyectos
    const supabase = await createSupabaseServer();
    
    // Usar la función de búsqueda personalizada
    const { data: projects, error } = await supabase.rpc('search_projects', {
      search_term: validation.sanitizedData.search || '',
      category_filter: validation.sanitizedData.category || '',
      industry_filter: validation.sanitizedData.industry || '',
      stage_filter: validation.sanitizedData.stage || '',
      seeking_cofounder: validation.sanitizedData.seeking_cofounder === 'true' ? true : null,
      seeking_investors: validation.sanitizedData.seeking_investors === 'true' ? true : null,
      limit_count: limit,
      offset_count: offset
    });

    if (error) {
      logSecurityEvent('system', 'medium', 'Database error in projects GET API', {
        source: 'projects_api',
        error: error.message,
        ip: clientIP
      });
      
      return NextResponse.json({ 
        error: 'Error al obtener proyectos',
        code: 'DATABASE_ERROR'
      }, { 
        status: 500,
        headers: getAPISecurityHeaders()
      });
    }

    // Obtener conteo total para paginación
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('visibility', 'public');

    // 5. Log de acceso exitoso
    logSecurityEvent('system', 'low', 'Projects GET API accessed successfully', {
      source: 'projects_api',
      resultsCount: projects?.length || 0,
      ip: clientIP
    });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { 
      headers: getAPISecurityHeaders()
    });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error in projects GET API', {
      source: 'projects_api',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: getAPISecurityHeaders()
    });
  }
}

// POST /api/projects - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting más restrictivo para creación
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkLimit(clientIP, 'api_projects_create', 10, 60000);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded for projects POST API', {
        source: 'projects_api',
        ip: clientIP,
        endpoint: '/api/projects'
      });
      
      return NextResponse.json({
        error: 'Demasiadas solicitudes de creación. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter || 60
      }, { 
        status: 429,
        headers: {
          ...getAPISecurityHeaders(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      });
    }

    // 2. Autenticación
    let authContext;
    try {
      authContext = await secureAuthService.verifyAuth(request);
      if (!authContext.user) {
        throw new Error('Usuario no autenticado');
      }
    } catch (authError) {
      logSecurityEvent('auth', 'medium', 'Authentication failed in projects POST API', {
        source: 'projects_api',
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Autenticación requerida',
        code: 'UNAUTHORIZED'
      }, { 
        status: 401,
        headers: getAPISecurityHeaders()
      });
    }

    // 3. Validación de entrada
    const body = await request.json();
    
    const validation = inputValidationService.validate(body, ProjectCreateSchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input in projects POST API', {
        source: 'projects_api',
        errors: validation.errors,
        ip: clientIP,
        userId: authContext.user.id
      });
      
      return NextResponse.json({ 
        error: 'Datos del proyecto inválidos',
        code: 'INVALID_INPUT',
        details: validation.errors
      }, { 
        status: 400,
        headers: getAPISecurityHeaders()
      });
    }

    const projectData = validation.sanitizedData;

    // 4. Crear el proyecto
    const supabase = await createSupabaseServer();
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        creator_id: authContext.user.id
      })
      .select()
      .single();

    if (error) {
      logSecurityEvent('system', 'medium', 'Database error creating project', {
        source: 'projects_api',
        error: error.message,
        ip: clientIP,
        userId: authContext.user.id
      });
      
      return NextResponse.json({ 
        error: 'Error al crear el proyecto',
        code: 'DATABASE_ERROR'
      }, { 
        status: 500,
        headers: getAPISecurityHeaders()
      });
    }

    // 5. Agregar al creador como miembro fundador del equipo
    const { error: teamError } = await supabase
      .from('project_team_members')
      .insert({
        project_id: project.id,
        user_id: authContext.user.id,
        role: 'founder',
        custom_title: 'Founder & Creator',
        is_founder: true,
        is_admin: true,
        commitment_level: 'full_time',
        status: 'active'
      });

    if (teamError) {
      logSecurityEvent('system', 'low', 'Error adding creator to team', {
        source: 'projects_api',
        error: teamError.message,
        ip: clientIP,
        userId: authContext.user.id,
        projectId: project.id
      });
      // No fallar la creación del proyecto por esto
    }

    // 6. Log de creación exitosa
    logSecurityEvent('system', 'low', 'Project created successfully', {
      source: 'projects_api',
      projectId: project.id,
      userId: authContext.user.id,
      ip: clientIP
    });

    return NextResponse.json({ 
      project,
      message: 'Proyecto creado exitosamente'
    }, { 
      status: 201,
      headers: getAPISecurityHeaders()
    });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error in projects POST API', {
      source: 'projects_api',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: getAPISecurityHeaders()
    });
  }
}
