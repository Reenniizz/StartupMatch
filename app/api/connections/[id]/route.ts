import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const connectionId = params.id;
    const body = await request.json();
    const { response } = body; // 'accepted' or 'rejected'

    // Validaciones
    if (!connectionId) {
      return NextResponse.json({ error: 'ID de conexión requerido' }, { status: 400 });
    }

    if (!response || !['accepted', 'rejected'].includes(response)) {
      return NextResponse.json({ error: 'Respuesta debe ser "accepted" o "rejected"' }, { status: 400 });
    }

    // Verificar que la solicitud existe y el usuario puede responderla
    const { data: connection, error: fetchError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        message,
        requester:user_profiles!connection_requests_requester_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('id', connectionId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !connection) {
      return NextResponse.json({ 
        error: 'Solicitud de conexión no encontrada o ya procesada' 
      }, { status: 404 });
    }

    // Actualizar el status de la solicitud
    const { data: updatedConnection, error: updateError } = await supabase
      .from('connection_requests')
      .update({ 
        status: response,
        responded_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .eq('addressee_id', user.id)
      .select(`
        id,
        status,
        created_at,
        responded_at,
        requester:user_profiles!connection_requests_requester_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url,
          company,
          role
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating connection:', updateError);
      return NextResponse.json({ error: 'Error al procesar respuesta' }, { status: 500 });
    }

    const responseMessage = response === 'accepted' 
      ? 'Conexión aceptada exitosamente' 
      : 'Conexión rechazada';

    // Si es aceptada, crear conversación
    let conversationId = null;
    if (response === 'accepted') {
      // Verificar si ya existe una conversación
      const { data: existingConversation } = await supabase
        .from('group_conversations')
        .select('id')
        .or(`participant_1.eq.${connection.requester_id},participant_2.eq.${user.id}`)
        .or(`participant_1.eq.${user.id},participant_2.eq.${connection.requester_id}`)
        .limit(1)
        .single();

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Crear nueva conversación
        const { data: newConversation, error: convError } = await supabase
          .from('group_conversations')
          .insert({
            name: 'Conexión Privada',
            description: 'Conversación iniciada por conexión',
            participant_1: connection.requester_id,
            participant_2: user.id,
            group_type: 'private'
          })
          .select('id')
          .single();
        
        if (!convError && newConversation) {
          conversationId = newConversation.id;
        }
      }
    }

    return NextResponse.json({
      success: true,
      connection: updatedConnection,
      conversationId: conversationId,
      message: responseMessage
    });

  } catch (error) {
    console.error('Error in connection response:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener detalles de una conexión específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const connectionId = params.id;

    const { data: connection, error } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        message,
        created_at,
        responded_at,
        requester:user_profiles!connection_requests_requester_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url,
          company,
          role,
          bio
        ),
        addressee:user_profiles!connection_requests_addressee_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url,
          company,
          role,
          bio
        )
      `)
      .eq('id', connectionId)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .single();

    if (error || !connection) {
      return NextResponse.json({ 
        error: 'Conexión no encontrada o no tienes acceso' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      connection
    });

  } catch (error) {
    console.error('Error fetching connection details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
