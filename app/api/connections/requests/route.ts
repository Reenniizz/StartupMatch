// ==============================================
// API: Get Connection Requests (Solicitudes de conexión recibidas)
// GET /api/connections/requests - Obtener solicitudes pendientes
// ==============================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 GET /api/connections/requests - Obteniendo solicitudes recibidas');

    // Crear cliente de servicio para evitar problemas con RLS
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

    // También necesitamos el cliente regular para validar auth
    const { supabase } = await import('@/lib/supabase-client');

    // Obtener token de autorización del header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No se encontró token de autorización');
      return NextResponse.json({ 
        error: 'No autorizado',
        requests: [],
        total: 0
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar usuario con el token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Token inválido o usuario no encontrado:', authError?.message);
      return NextResponse.json({ 
        error: 'No autorizado',
        requests: [],
        total: 0
      }, { status: 401 });
    }

    console.log('👤 Usuario autenticado:', user.id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'pending';

    // Obtener solicitudes recibidas usando el cliente de servicio
    const { data: requests, error: requestsError } = await supabaseService
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        message,
        status,
        created_at
      `)
      .eq('addressee_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (requestsError) {
      console.error('❌ Error obteniendo solicitudes:', requestsError);
      return NextResponse.json({ 
        error: 'Error al obtener solicitudes',
        requests: [],
        total: 0
      }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      console.log('✅ No hay solicitudes pendientes');
      return NextResponse.json({
        requests: [],
        total: 0,
        status: status
      });
    }

    // Obtener información de los perfiles de los remitentes usando cliente de servicio
    const requesterIds = requests.map(r => r.requester_id);
    
    const { data: profiles, error: profilesError } = await supabaseService
      .from('user_profiles')
      .select(`
        user_id,
        username,
        first_name,
        last_name,
        email,
        role,
        company,
        industry,
        location,
        bio
      `)
      .in('user_id', requesterIds);

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      // Continuar sin perfiles detallados
    }

    // Combinar solicitudes con información de perfiles
    const formattedRequests = requests.map(request => {
      const profile = profiles?.find(p => p.user_id === request.requester_id);
      
      return {
        id: request.id,
        message: request.message,
        status: request.status,
        created_at: request.created_at,
        requester: {
          user_id: request.requester_id,
          username: profile?.username || 'usuario',
          first_name: profile?.first_name || 'Usuario',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
          role: profile?.role || 'Usuario',
          company: profile?.company || 'Sin empresa',
          industry: profile?.industry || 'No especificada',
          location: profile?.location || 'Ubicación no especificada',
          bio: profile?.bio || 'Sin descripción'
        }
      };
    });

    console.log(`✅ ${formattedRequests.length} solicitudes encontradas`);

    return NextResponse.json({
      requests: formattedRequests,
      total: formattedRequests.length,
      status: status
    });

  } catch (error) {
    console.error('❌ Error inesperado en /api/connections/requests:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      requests: [],
      total: 0
    }, { status: 500 });
  }
}
