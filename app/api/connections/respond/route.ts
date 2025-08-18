// ==============================================
// API: Respond to Connection Request (Responder solicitud de conexión)
// PUT /api/connections/respond - Aceptar o rechazar solicitudes
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 PUT /api/connections/respond - Respondiendo a solicitud de conexión');

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

    // Obtener token de autorización del header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No se encontró token de autorización');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar usuario con el token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Token inválido o usuario no encontrado:', authError?.message);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('👤 Usuario autenticado:', user.id);

    const body = await request.json();
    const { connectionRequestId, response } = body; // response: 'accepted' | 'rejected'

    if (!connectionRequestId || !response || !['accepted', 'rejected'].includes(response)) {
      return NextResponse.json({ 
        error: 'Datos inválidos. Se requiere connectionRequestId y response (accepted/rejected)' 
      }, { status: 400 });
    }

    console.log('📦 Datos recibidos:', { connectionRequestId, response });

    // Verificar que la solicitud existe y pertenece al usuario actual (como addressee)
    const { data: existingRequest, error: checkError } = await supabaseService
      .from('connection_requests')
      .select('*')
      .eq('id', connectionRequestId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .single();

    if (checkError || !existingRequest) {
      console.log('❌ Solicitud no encontrada o no pertenece al usuario:', checkError);
      return NextResponse.json({ 
        error: 'Solicitud de conexión no encontrada o ya procesada' 
      }, { status: 404 });
    }

    console.log('✅ Solicitud encontrada, actualizando estado...');

    // Actualizar el estado de la solicitud
    const { data: updatedRequest, error: updateError } = await supabaseService
      .from('connection_requests')
      .update({ 
        status: response,
        responded_at: new Date().toISOString()
      })
      .eq('id', connectionRequestId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando solicitud:', updateError);
      return NextResponse.json({ 
        error: 'Error al procesar la respuesta' 
      }, { status: 500 });
    }

    console.log(`✅ Solicitud ${response} exitosamente`);

    // Si fue aceptada, crear notificación para el requester
    if (response === 'accepted') {
      console.log('📬 Creando notificación de conexión aceptada...');
      
      const { error: notificationError } = await supabaseService
        .from('notifications')
        .insert({
          user_id: existingRequest.requester_id,
          type: 'connection_accepted',
          title: '¡Conexión aceptada!',
          message: 'Tu solicitud de conexión ha sido aceptada',
          data: {
            connection_request_id: connectionRequestId,
            connected_user_id: user.id
          },
          related_user_id: user.id,
          action_url: '/matches?tab=connections'
        });

      if (notificationError) {
        console.error('⚠️ Error creando notificación (no crítico):', notificationError);
      } else {
        console.log('✅ Notificación de conexión aceptada creada');
      }
    }

    return NextResponse.json({
      success: true,
      connectionRequest: updatedRequest,
      message: response === 'accepted' 
        ? 'Conexión aceptada exitosamente'
        : 'Solicitud rechazada'
    });

  } catch (error) {
    console.error('❌ Error inesperado en /api/connections/respond:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
