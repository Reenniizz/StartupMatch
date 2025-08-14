import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/projects/[id]/like - Toggle like en proyecto
export async function POST(
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

    // Verificar si el proyecto existe y está activo
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status')
      .eq('id', resolvedParams.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'active') {
      return NextResponse.json({ error: 'Cannot like inactive project' }, { status: 400 });
    }

    // Verificar si ya existe el like
    const { data: existingLike, error: likeError } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .single();

    let isLiked = false;

    if (existingLike) {
      // Remover like
      const { error: deleteError } = await supabase
        .from('project_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
      }
      
      isLiked = false;
    } else {
      // Agregar like
      const { error: insertError } = await supabase
        .from('project_likes')
        .insert({
          project_id: resolvedParams.id,
          user_id: session.user.id
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
      }
      
      isLiked = true;
    }

    // Obtener contador actualizado
    const { data: likeCount } = await supabase
      .from('project_likes')
      .select('id', { count: 'exact' })
      .eq('project_id', resolvedParams.id);

    return NextResponse.json({ 
      isLiked,
      likeCount: likeCount?.length || 0
    });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
