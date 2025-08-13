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

    // Usar función de base de datos para obtener conexiones
    const { data: connections, error } = await supabase
      .rpc('get_user_connections', {
        p_target_user_id: user.id
      });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500 });
    }

    let filteredConnections = connections || [];

    // Filtrar por búsqueda si se proporciona
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

    // Obtener estadísticas adicionales usando cliente de servicio
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
