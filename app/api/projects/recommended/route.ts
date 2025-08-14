import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/recommended - Obtener proyectos recomendados para el usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Usar la función de recomendaciones
    const { data: recommendations, error } = await supabase.rpc('get_recommended_projects', {
      target_user_id: session.user.id,
      limit_count: limit
    });

    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    return NextResponse.json({ projects: recommendations });

  } catch (error) {
    console.error('Error in GET /api/projects/recommended:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
