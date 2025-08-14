import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects - Obtener proyectos con filtros y búsqueda
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const industry = searchParams.get('industry') || '';
    const stage = searchParams.get('stage') || '';
    const seekingCofounder = searchParams.get('seeking_cofounder') === 'true' ? true : null;
    const seekingInvestors = searchParams.get('seeking_investors') === 'true' ? true : null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Usar la función de búsqueda personalizada
    const { data: projects, error } = await supabase.rpc('search_projects', {
      search_term: search,
      category_filter: category,
      industry_filter: industry,
      stage_filter: stage,
      seeking_cofounder: seekingCofounder,
      seeking_investors: seekingInvestors,
      limit_count: limit,
      offset_count: offset
    });

    if (error) {
      console.error('Error searching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Obtener conteo total para paginación
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('visibility', 'public');

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validaciones básicas
    if (!body.title || !body.description || !body.category || !body.industry) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, category, industry' 
      }, { status: 400 });
    }

    // Crear el proyecto
    const projectData = {
      creator_id: session.user.id,
      title: body.title,
      tagline: body.tagline || null,
      description: body.description,
      detailed_description: body.detailed_description || null,
      category: body.category,
      industry: body.industry,
      stage: body.stage || 'idea',
      status: body.status || 'draft',
      visibility: body.visibility || 'public',
      start_date: body.start_date || null,
      target_completion_date: body.target_completion_date || null,
      logo_url: body.logo_url || null,
      cover_image_url: body.cover_image_url || null,
      demo_url: body.demo_url || null,
      website_url: body.website_url || null,
      repository_url: body.repository_url || null,
      pitch_deck_url: body.pitch_deck_url || null,
      demo_video_url: body.demo_video_url || null,
      tech_stack: body.tech_stack || [],
      required_skills: body.required_skills || [],
      funding_goal: body.funding_goal || null,
      funding_stage: body.funding_stage || null,
      equity_offered: body.equity_offered || null,
      team_size_target: body.team_size_target || 1,
      is_seeking_cofounder: body.is_seeking_cofounder || false,
      is_seeking_investors: body.is_seeking_investors || false,
      is_seeking_mentors: body.is_seeking_mentors || false,
      is_open_to_collaboration: body.is_open_to_collaboration !== false,
      accepts_applications: body.accepts_applications !== false,
      application_deadline: body.application_deadline || null,
      requires_application_message: body.requires_application_message !== false,
      tags: body.tags || []
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Agregar al creador como miembro fundador del equipo
    const { error: teamError } = await supabase
      .from('project_team_members')
      .insert({
        project_id: project.id,
        user_id: session.user.id,
        role: 'founder',
        custom_title: 'Founder & Creator',
        is_founder: true,
        is_admin: true,
        commitment_level: 'full_time',
        status: 'active'
      });

    if (teamError) {
      console.error('Error adding creator to team:', teamError);
      // No fallar la creación del proyecto por esto
    }

    return NextResponse.json({ project }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
