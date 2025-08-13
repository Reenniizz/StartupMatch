import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener todas las conexiones del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'accepted';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');

    // Obtener conexiones aceptadas directamente usando cliente de servicio
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🚀 GET /api/connections - Obteniendo conexiones del usuario:', user.id);

    // Obtener conexiones aceptadas con detalles de perfiles
    const { data: connectionsData, error: connectionsError } = await supabaseService
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        connection_type,
        created_at,
        responded_at
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false });

    if (connectionsError) {
      console.error('❌ Error obteniendo conexiones:', connectionsError);
      return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500 });
    }

    let filteredConnections: any[] = [];

    if (connectionsData && connectionsData.length > 0) {
      // Obtener IDs de los otros usuarios en las conexiones
      const otherUserIds = connectionsData.map(conn => 
        conn.requester_id === user.id ? conn.addressee_id : conn.requester_id
      );

      // Obtener perfiles de los otros usuarios
      const { data: profiles, error: profilesError } = await supabaseService
        .from('user_profiles')
        .select(`
          user_id,
          username,
          first_name,
          last_name,
          avatar_url,
          company,
          role,
          location,
          bio
        `)
        .in('user_id', otherUserIds);

      if (profilesError) {
        console.error('❌ Error obteniendo perfiles:', profilesError);
        return NextResponse.json({ error: 'Error al obtener perfiles' }, { status: 500 });
      }

      // Combinar datos de conexiones con perfiles
      filteredConnections = connectionsData.map(conn => {
        const otherUserId = conn.requester_id === user.id ? conn.addressee_id : conn.requester_id;
        const profile = profiles?.find(p => p.user_id === otherUserId);

        return {
          connection_id: conn.id,
          connected_user_id: otherUserId,
          username: profile?.username || 'usuario',
          first_name: profile?.first_name || 'Usuario',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null,
          company: profile?.company || 'Sin empresa',
          role: profile?.role || 'Usuario',
          location: profile?.location || 'Ubicación no especificada',
          bio: profile?.bio || '',
          connection_type: conn.connection_type || 'general',
          connected_at: conn.responded_at || conn.created_at,
          is_online: false, // TODO: Implementar estado online
          last_message: null, // TODO: Implementar último mensaje
          last_message_at: null
        };
      });

      // Aplicar filtro de búsqueda si se proporciona
      if (search) {
        const searchLower = search.toLowerCase();
        filteredConnections = filteredConnections.filter((conn: any) =>
          conn.first_name?.toLowerCase().includes(searchLower) ||
          conn.last_name?.toLowerCase().includes(searchLower) ||
          conn.username?.toLowerCase().includes(searchLower) ||
          conn.company?.toLowerCase().includes(searchLower) ||
          conn.role?.toLowerCase().includes(searchLower)
        );
      }

      // Limitar resultados
      filteredConnections = filteredConnections.slice(0, limit);
    }

    // Calcular estadísticas reales
    const stats = {
      total_accepted: 0,
      pending_received: 0,
      pending_sent: 0,
      weekly_new: 0
    };

    // Obtener solicitudes pendientes recibidas
    const { data: pendingReceived } = await supabaseService
      .from('connection_requests')
      .select('id')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    stats.pending_received = pendingReceived?.length || 0;

    // Obtener solicitudes pendientes enviadas
    const { data: pendingSent } = await supabaseService
      .from('connection_requests')
      .select('id')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    stats.pending_sent = pendingSent?.length || 0;

    // Obtener conexiones aceptadas
    const { data: accepted } = await supabaseService
      .from('connection_requests')
      .select('id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    stats.total_accepted = accepted?.length || 0;

    // Obtener nuevas conexiones de esta semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: weeklyNew } = await supabaseService
      .from('connection_requests')
      .select('id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .gte('updated_at', oneWeekAgo.toISOString());

    stats.weekly_new = weeklyNew?.length || 0;

    console.log(`📊 Estadísticas calculadas para usuario ${user.id}:`, stats);
    console.log(`✅ ${filteredConnections.length} conexiones encontradas`);

    return NextResponse.json({
      success: true,
      connections: filteredConnections,
      total_found: filteredConnections.length,
      stats,
      filters_applied: {
        status,
        search,
        limit
      }
    });

  } catch (error) {
    console.error('Error in GET connections:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear solicitud de conexión
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { addresseeId, message } = await request.json();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar datos
    if (!addresseeId) {
      return NextResponse.json({ error: 'ID del destinatario requerido' }, { status: 400 });
    }

    // Evitar auto-conexión
    if (user.id === addresseeId) {
      return NextResponse.json({ error: 'No puedes conectar contigo mismo' }, { status: 400 });
    }

    // Crear solicitud de conexión
    const { data: connection, error } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        message: message || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Violación de unique constraint
        return NextResponse.json({ error: 'Ya has enviado una solicitud a este usuario' }, { status: 409 });
      }
      console.error('Error creating connection request:', error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }

    return NextResponse.json({ connection });

  } catch (error) {
    console.error('Connection request API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
