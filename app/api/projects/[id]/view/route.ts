import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/projects/[id]/view - Track project view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, creator_id')
      .eq('id', resolvedParams.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Don't track views for project creator
    if (project.creator_id === session.user.id) {
      return NextResponse.json({ success: true });
    }

    // Insert view record
    const { error } = await supabase
      .from('project_views')
      .insert({
        project_id: resolvedParams.id,
        viewer_id: session.user.id,
        user_agent: request.headers.get('user-agent') || null
      });

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error tracking view:', error);
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
