import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id] - Obtener proyecto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createSupabaseServer();
    
    // Obtener proyecto básico
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }

    // Obtener información del creador por separado
    let creator = null;
    if (project.creator_id) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, website, location')
        .eq('id', project.creator_id)
        .single();
      
      creator = creatorData;
    }

    // Obtener archivos del proyecto desde Storage
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', resolvedParams.id);

    if (filesError) {
      console.error('Error fetching project files:', filesError);
    }

    // Registrar vista si hay usuario autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.id && session.user.id !== project.creator_id) {
      await supabase
        .from('project_views')
        .insert({
          project_id: resolvedParams.id,
          viewer_id: session.user.id,
          user_agent: request.headers.get('user-agent') || null
        })
        .select()
        .single();
    }

    // Obtener estadísticas del proyecto
    const { data: stats } = await supabase.rpc('get_project_stats', {
      project_uuid: resolvedParams.id
    });

    // Verificar si el usuario actual ha dado like
    let hasLiked = false;
    if (session?.user.id) {
      const { data: likeData } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', resolvedParams.id)
        .eq('user_id', session.user.id)
        .single();
      
      hasLiked = !!likeData;
    }

    // Verificar si el usuario ha guardado el proyecto
    let isBookmarked = false;
    if (session?.user.id) {
      const { data: bookmarkData } = await supabase
        .from('project_bookmarks')
        .select('id')
        .eq('project_id', resolvedParams.id)
        .eq('user_id', session.user.id)
        .single();
      
      isBookmarked = !!bookmarkData;
    }

    return NextResponse.json({
      project: {
        ...project,
        creator: creator,
        files: files || [],
        // Extractar project_data desde metadata para retrocompatibilidad
        project_data: project.metadata || {},
        stats: stats?.[0] || {
          total_views: 0,
          unique_views: 0,
          total_likes: 0,
          total_applications: 0,
          team_members: 0,
          recent_activity_count: 0
        },
        user_interactions: {
          has_liked: hasLiked,
          is_bookmarked: isBookmarked,
          is_team_member: false // Simplificar por ahora
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Actualizar proyecto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar permisos (creador o admin del proyecto)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', resolvedParams.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isCreator = project.creator_id === session.user.id;
    
    // Verificar si es admin del equipo
    let isAdmin = false;
    if (!isCreator) {
      const { data: teamMember } = await supabase
        .from('project_team_members')
        .select('is_admin')
        .eq('project_id', resolvedParams.id)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();
      
      isAdmin = teamMember?.is_admin || false;
    }

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Actualizar proyecto
    const updateData: any = {};
    
    // Solo permitir actualizar ciertos campos
    const allowedFields = [
      'title', 'tagline', 'description', 'detailed_description',
      'category', 'industry', 'stage', 'status', 'visibility',
      'start_date', 'target_completion_date', 'actual_completion_date',
      'logo_url', 'cover_image_url', 'demo_url', 'website_url',
      'repository_url', 'pitch_deck_url', 'demo_video_url',
      'tech_stack', 'required_skills', 'funding_goal', 'funding_raised',
      'funding_stage', 'equity_offered', 'team_size_target',
      'is_seeking_cofounder', 'is_seeking_investors', 'is_seeking_mentors',
      'is_open_to_collaboration', 'accepts_applications',
      'application_deadline', 'requires_application_message', 'tags'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project: updatedProject });

  } catch (error) {
    console.error('Error in PUT /api/projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Eliminar proyecto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el usuario es el creador del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', resolvedParams.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the project creator can delete this project' }, { status: 403 });
    }

    // Eliminar proyecto (cascadea a todas las tablas relacionadas)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
