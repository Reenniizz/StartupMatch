import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/projects/[id]/bookmark - Toggle project bookmark
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
      .select('id')
      .eq('id', resolvedParams.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has already bookmarked this project
    const { data: existingBookmark } = await supabase
      .from('project_bookmarks')
      .select('id')
      .eq('project_id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .single();

    let isBookmarked = false;

    if (existingBookmark) {
      // Remove bookmark
      const { error } = await supabase
        .from('project_bookmarks')
        .delete()
        .eq('project_id', resolvedParams.id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error removing bookmark:', error);
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        );
      }

      isBookmarked = false;
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('project_bookmarks')
        .insert({
          project_id: resolvedParams.id,
          user_id: session.user.id
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        );
      }

      isBookmarked = true;
    }

    // Get updated bookmark count
    const { count: bookmarkCount } = await supabase
      .from('project_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', resolvedParams.id);

    return NextResponse.json({
      success: true,
      isBookmarked,
      bookmarkCount: bookmarkCount || 0
    });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
