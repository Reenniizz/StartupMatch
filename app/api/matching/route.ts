import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const limit = parseInt(searchParams.get('limit') || '10')
    const minCompatibility = parseInt(searchParams.get('min_compatibility') || '50')

    // Obtener usuarios potenciales usando la función SQL
    const { data: matches, error } = await supabase
      .rpc('get_potential_matches', {
        p_target_user_id: user.id,
        p_limit_count: limit,
        p_min_compatibility: minCompatibility
      })

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    return NextResponse.json({ matches })

  } catch (error) {
    console.error('Matching API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
