import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener matches mutuos del usuario
    const { data: matches, error } = await supabase
      .from('mutual_matches')
      .select(`
        *,
        user1:user_profiles!mutual_matches_user1_id_fkey(user_id, first_name, last_name, avatar_url, role, company),
        user2:user_profiles!mutual_matches_user2_id_fkey(user_id, first_name, last_name, avatar_url, role, company)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('match_status', 'active')
      .order('matched_at', { ascending: false })

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    // Formatear matches para incluir información del otro usuario
    const formattedMatches = matches?.map((match: any) => {
      const isUser1 = match.user1_id === user.id
      const otherUser = isUser1 ? match.user2 : match.user1
      
      return {
        id: match.id,
        matchedAt: match.matched_at,
        compatibilityScore: match.compatibility_score,
        otherUser: {
          id: otherUser.user_id,
          name: `${otherUser.first_name} ${otherUser.last_name}`,
          avatar: otherUser.avatar_url,
          role: otherUser.role,
          company: otherUser.company
        }
      }
    }) || []

    return NextResponse.json({ matches: formattedMatches })

  } catch (error) {
    console.error('Matches API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
