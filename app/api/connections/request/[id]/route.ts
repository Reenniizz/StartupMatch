import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// PUT - Responder a una solicitud de conexión (aceptar/rechazar)
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

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Validaciones
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido. Use "accepted" o "rejected"' }, { status: 400 });
    }

    // Verificar que la solicitud existe y el usuario es el destinatario
    const { data: connectionRequest, error: fetchError } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
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
      .eq('id', id)
      .eq('addressee_id', user.id)
      .single();

    if (fetchError || !connectionRequest) {
      return NextResponse.json({ error: 'Solicitud de conexión no encontrada' }, { status: 404 });
    }

    if (connectionRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitud ya ha sido procesada' }, { status: 409 });
    }

    // Actualizar el estado de la solicitud
    const { data: updatedRequest, error: updateError } = await supabase
      .from('connection_requests')
      .update({
        status: status,
        responded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        responded_at,
        created_at,
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
      console.error('Error updating connection request:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection_request: updatedRequest,
      message: status === 'accepted' 
        ? 'Solicitud de conexión aceptada. Se ha creado una conversación automáticamente.'
        : 'Solicitud de conexión rechazada.'
    });

  } catch (error) {
    console.error('Error in PUT connection request:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener detalles de una solicitud específica
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

    const { id } = params;

    // Obtener la solicitud de conexión
    const { data: connectionRequest, error } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        connection_type,
        message,
        created_at,
        updated_at,
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
      .eq('id', id)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .single();

    if (error || !connectionRequest) {
      return NextResponse.json({ error: 'Solicitud de conexión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      connection_request: connectionRequest
    });

  } catch (error) {
    console.error('Error in GET connection request:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
