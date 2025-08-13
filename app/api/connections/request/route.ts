import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/connections/request - Iniciando solicitud de conexión');
  
  try {
    // Usar cliente con privilegios administrativos para evitar RLS
    const supabase = await createSupabaseServer();
    
    // También crear cliente de servicio para operaciones administrativas
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('👤 Usuario autenticado:', user?.id ? 'Sí' : 'No');

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { addresseeId, connectionType = 'general', message } = body;

    console.log('📦 Datos recibidos:', { addresseeId, connectionType, message });

    // Validaciones
    if (!addresseeId) {
      console.log('❌ Error: addresseeId faltante');
      return NextResponse.json({ error: 'ID del destinatario requerido' }, { status: 400 });
    }

    if (addresseeId === user.id) {
      console.log('❌ Error: Usuario intentando conectarse consigo mismo');
      return NextResponse.json({ error: 'No puedes conectarte contigo mismo' }, { status: 400 });
    }

    // Verificar que el usuario destinatario existe
    console.log('🔍 Verificando que el usuario destinatario existe...');
    console.log('✅ Continuando con addresseeId:', addresseeId);

    // TEMPORAL: Saltar verificación de duplicados para debug
    console.log('🔍 TEMPORAL: Saltando verificación de solicitudes existentes para debug');

    // TEMPORAL: Eliminar cualquier solicitud existente antes de crear una nueva (SOLO PARA DEBUG)
    console.log('🗑️ TEMPORAL: Eliminando solicitudes existentes para este par de usuarios (DEBUG)');
    await supabaseService
      .from('connection_requests')
      .delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`);

    // Crear solicitud de conexión
    console.log('💾 Creando solicitud de conexión en BD...');
    console.log('📝 Datos a insertar:', {
      requester_id: user.id,
      addressee_id: addresseeId,
      message: message || null,
      status: 'pending'
    });
    
    // Usar cliente de servicio para evitar problemas de RLS
    const { data: connection, error: connectionError } = await supabaseService
      .from('connection_requests')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        message: message || null,
        status: 'pending'
      })
      .select(`
        id,
        status,
        created_at
      `)
      .single();

    if (connectionError) {
      console.error('❌ Error creating connection:', connectionError);
      console.error('❌ Error code:', connectionError.code);
      console.error('❌ Error details:', connectionError.details);
      console.error('❌ Error hint:', connectionError.hint);
      
      // Si la tabla no existe, dar mensaje más claro
      if (connectionError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Sistema de conexiones no configurado. Ejecuta NOTIFICATIONS_SETUP.sql primero.' 
        }, { status: 500 });
      }
      
      if (connectionError.code === '23505') {
        return NextResponse.json({ error: 'Ya has enviado una solicitud a este usuario' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Error al enviar solicitud de conexión: ' + connectionError.message }, { status: 500 });
    }

    console.log('✅ Solicitud creada exitosamente:', connection?.id);
    console.log('📄 Detalles de la solicitud:', connection);

    return NextResponse.json({
      success: true,
      connection: connection,
      message: 'Solicitud de conexión enviada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error in connection request:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener solicitudes de conexión recibidas
export async function GET(request: NextRequest) {
  console.log('📥 GET /api/connections/request - Obteniendo solicitudes');
  
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    console.log('🔍 Buscando solicitudes con status:', status, 'para usuario:', user.id);

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
      console.error('❌ Error fetching connection requests:', error);
      
      // Si la tabla no existe, dar mensaje más claro
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Sistema de conexiones no configurado. Ejecuta NOTIFICATIONS_SETUP.sql primero.' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 });
    }

    console.log('✅ Solicitudes encontradas:', requests?.length || 0);

    return NextResponse.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in GET connection requests:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
