import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { secureAuthService } from '@/lib/auth-security';
import { rateLimit } from '@/lib/rate-limiting';
import { inputValidationService } from '@/lib/input-validation';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GetQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional()
});

const PostSchema = z.object({
  addresseeId: z.string().min(1, 'ID del destinatario requerido'),
  message: z.string().optional()
});

// GET - Obtener todas las conexiones del usuario
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_connections_get', 200, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on connections GET', { source: 'connections', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();
    
    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    // Validar query params
    const url = new URL(request.url);
    const queryData = {
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit'),
      search: url.searchParams.get('search')
    };
    const validation = inputValidationService.validate(queryData, GetQuerySchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const status = validation.sanitizedData.status || 'accepted';
    const limit = Math.min(Math.max(parseInt(validation.sanitizedData.limit || '50') || 50, 1), 100);
    const search = validation.sanitizedData.search;

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
      logSecurityEvent('system', 'medium', 'DB error fetching connections', { source: 'connections', error: connectionsError.message, ip: clientIP, userId: user.id });
      return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500, headers: getAPISecurityHeaders() });
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
        logSecurityEvent('system', 'medium', 'DB error fetching profiles', { source: 'connections', error: profilesError.message, ip: clientIP, userId: user.id });
        return NextResponse.json({ error: 'Error al obtener perfiles' }, { status: 500, headers: getAPISecurityHeaders() });
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
          is_online: false,
          last_message: null,
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

    logSecurityEvent('system', 'low', 'Connections GET success', { source: 'connections', userId: user.id, count: filteredConnections.length, ip: clientIP });

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
    }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error connections GET', { source: 'connections', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: getAPISecurityHeaders() }
    );
  }
}

// POST - Crear solicitud de conexión
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_connections_post', 50, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on connections POST', { source: 'connections', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();
    
    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    // Validar body
    const body = await request.json();
    const validation = inputValidationService.validate(body, PostSchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input for connection POST', { source: 'connections', errors: validation.errors, ip: clientIP, userId: user.id });
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const { addresseeId, message } = validation.sanitizedData;

    // Evitar auto-conexión
    if (user.id === addresseeId) {
      return NextResponse.json({ error: 'No puedes conectar contigo mismo' }, { status: 400, headers: getAPISecurityHeaders() });
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
        return NextResponse.json({ error: 'Ya has enviado una solicitud a este usuario' }, { status: 409, headers: getAPISecurityHeaders() });
      }
      logSecurityEvent('system', 'medium', 'DB error creating connection', { source: 'connections', error: error.message, ip: clientIP, userId: user.id });
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    logSecurityEvent('system', 'low', 'Connection request created', { source: 'connections', requesterId: user.id, addresseeId, ip: clientIP });

    return NextResponse.json({ connection }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error connections POST', { source: 'connections', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}
