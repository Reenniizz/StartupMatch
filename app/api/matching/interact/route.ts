import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { targetUserId, interactionType } = await request.json()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Validar datos
    if (!targetUserId || !interactionType) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    if (!['like', 'pass', 'super_like'].includes(interactionType)) {
      return NextResponse.json({ error: 'Tipo de interacción inválido' }, { status: 400 })
    }

    // Evitar auto-interacción
    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'No puedes interactuar contigo mismo' }, { status: 400 })
    }

    // Insertar interacción (el trigger automáticamente creará match si es mutuo)
    const { data: interaction, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        interaction_type: interactionType
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Violación de unique constraint
        return NextResponse.json({ error: 'Ya has evaluado a este usuario' }, { status: 409 })
      }
      console.error('Error creating interaction:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }

    // Verificar si se creó un match mutuo
    let mutualMatch = null
    if (interactionType === 'like') {
      const user1 = user.id < targetUserId ? user.id : targetUserId
      const user2 = user.id < targetUserId ? targetUserId : user.id
      
      const { data: matchData } = await supabase
        .from('mutual_matches')
        .select('*')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single()
      
      mutualMatch = matchData
    }

    return NextResponse.json({ 
      interaction,
      mutualMatch: mutualMatch ? true : false,
      matchId: mutualMatch?.id || null
    })

  } catch (error) {
    console.error('Interaction API error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
