import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { addresseeId, connectionType = 'general', message } = body;

    // Validaciones
    if (!addresseeId) {
      return NextResponse.json({ error: 'ID del destinatario requerido' }, { status: 400 });
    }

    if (addresseeId === user.id) {
      return NextResponse.json({ error: 'No puedes conectarte contigo mismo' }, { status: 400 });
    }

    // Verificar que el usuario destinatario existe y es visible
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('user_id, username, profile_visibility')
      .eq('user_id', addresseeId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (targetUser.profile_visibility === 'private') {
      return NextResponse.json({ error: 'Este usuario no acepta conexiones' }, { status: 403 });
    }

    // Verificar si ya existe una conexión
    const { data: existingConnection } = await supabase
      .from('connection_requests')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
      .single();

    if (existingConnection) {
      const statusMessages = {
        'accepted': 'Ya están conectados',
        'pending': 'Ya existe una solicitud pendiente',
        'blocked': 'Conexión bloqueada',
        'rejected': 'Puedes intentar conectar nuevamente'
      };

      if (existingConnection.status !== 'rejected') {
        return NextResponse.json(
          { error: statusMessages[existingConnection.status as keyof typeof statusMessages] },
          { status: 409 }
        );
      }
    }

    // Crear solicitud de conexión
    const { data: connection, error: connectionError } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        message: message || null
      })
      .select(`
        id,
        status,
        created_at,
        addressee:user_profiles!connection_requests_addressee_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      if (connectionError.code === '23505') {
        return NextResponse.json({ error: 'Ya has enviado una solicitud a este usuario' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al enviar solicitud de conexión' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connection: connection,
      message: 'Solicitud de conexión enviada exitosamente'
    });

  } catch (error) {
    console.error('Error in connection request:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener solicitudes de conexión recibidas
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Obtener solicitudes recibidas
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select(`
        id,
        status,
        message,
        created_at,
        requester:user_profiles!connection_requests_requester_id_fkey(
          user_id,
          username,
          first_name,
          last_name,
          avatar_url,
          company,
          role,
          location
        )
      `)
      .eq('addressee_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching connection requests:', error);
      return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0
    });

  } catch (error) {
    console.error('Error in GET connection requests:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
