import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/projects/categories - Obtener categorías de proyectos
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: categories, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error in GET /api/projects/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
