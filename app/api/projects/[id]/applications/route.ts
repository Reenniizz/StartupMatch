import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id]/applications - Obtener aplicaciones del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar permisos (creador o admin del proyecto)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', params.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isCreator = project.creator_id === session.user.id;
    
    let isAdmin = false;
    if (!isCreator) {
      const { data: teamMember } = await supabase
        .from('project_team_members')
        .select('is_admin')
        .eq('project_id', params.id)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();
      
      isAdmin = teamMember?.is_admin || false;
    }

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Obtener aplicaciones con información del aplicante
    const { data: applications, error } = await supabase
      .from('project_applications')
      .select(`
        *,
        applicant:user_profiles!applicant_id(
          user_id,
          first_name,
          last_name,
          avatar_url,
          role,
          company,
          headline,
          bio,
          linkedin_url,
          github_url,
          portfolio_url
        )
      `)
      .eq('project_id', params.id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications });

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/applications - Aplicar al proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validaciones básicas
    if (!body.desired_role || !body.message) {
      return NextResponse.json({ 
        error: 'Missing required fields: desired_role, message' 
      }, { status: 400 });
    }

    // Verificar que el proyecto acepta aplicaciones
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('accepts_applications, status, application_deadline, creator_id')
      .eq('id', params.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id === session.user.id) {
      return NextResponse.json({ error: 'Cannot apply to your own project' }, { status: 400 });
    }

    if (!project.accepts_applications) {
      return NextResponse.json({ error: 'This project is not accepting applications' }, { status: 400 });
    }

    if (project.status !== 'active') {
      return NextResponse.json({ error: 'Cannot apply to inactive project' }, { status: 400 });
    }

    if (project.application_deadline && new Date(project.application_deadline) < new Date()) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Verificar si ya es miembro del equipo
    const { data: teamMember } = await supabase
      .from('project_team_members')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (teamMember) {
      return NextResponse.json({ error: 'You are already a member of this project' }, { status: 400 });
    }

    // Verificar si ya aplicó
    const { data: existingApplication } = await supabase
      .from('project_applications')
      .select('id')
      .eq('project_id', params.id)
      .eq('applicant_id', session.user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this project' }, { status: 400 });
    }

    // Crear la aplicación
    const applicationData = {
      project_id: params.id,
      applicant_id: session.user.id,
      desired_role: body.desired_role,
      message: body.message,
      proposed_equity: body.proposed_equity || null,
      proposed_commitment: body.proposed_commitment || 'part_time',
      resume_url: body.resume_url || null,
      portfolio_url: body.portfolio_url || null,
      cover_letter_url: body.cover_letter_url || null,
      additional_documents: body.additional_documents || []
    };

    const { data: application, error } = await supabase
      .from('project_applications')
      .insert(applicationData)
      .select(`
        *,
        applicant:user_profiles!applicant_id(
          user_id,
          first_name,
          last_name,
          avatar_url,
          role,
          company
        )
      `)
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    // TODO: Enviar notificación al creador del proyecto

    return NextResponse.json({ application }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
