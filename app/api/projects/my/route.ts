import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

// GET /api/projects/my - Obtener proyectos del usuario actual
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get('tab') || 'created'; // created, team_member, applied
    const status = searchParams.get('status'); // active, draft, completed, etc.
    
    let query;
    
    if (tab === 'created') {
      // Proyectos creados por el usuario - consulta simplificada
      query = supabase
        .from('projects')
        .select('*')
        .eq('creator_id', session.user.id);

      if (status) {
        query = query.eq('status', status);
      }
      
    } else if (tab === 'team_member') {
      // Por ahora retornamos array vacío hasta implementar team_members
      return NextResponse.json({ projects: [] });
        
    } else if (tab === 'applied') {
      // Por ahora retornamos array vacío hasta implementar applications
      return NextResponse.json({ projects: [] });
    }

    if (!query) {
      return NextResponse.json({ error: 'Invalid tab parameter' }, { status: 400 });
    }

    const { data: projects, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('Error in GET /api/projects/my:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
