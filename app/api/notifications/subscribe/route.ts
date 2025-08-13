// ==============================================
// API ENDPOINT: GESTIÓN DE SUSCRIPCIONES PUSH
// Maneja la suscripción y desuscripción de notificaciones push
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con service role para operaciones administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📱 API Push Subscribe: Iniciando suscripción...');
    
    const body = await request.json();
    const { 
      userId, 
      endpoint, 
      p256dh, 
      auth, 
      userAgent = 'Unknown' 
    } = body;

    // Validar datos requeridos
    if (!userId || !endpoint || !p256dh || !auth) {
      console.error('❌ Datos de suscripción incompletos:', { userId, endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de suscripción incompletos' 
        },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      console.error('❌ Usuario no encontrado:', userId, userError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no autorizado' 
        },
        { status: 401 }
      );
    }

    console.log('✅ Usuario validado:', user.user.email);

    // Guardar o actualizar suscripción en base de datos
    const subscriptionData = {
      user_id: userId,
      endpoint: endpoint,
      p256dh: p256dh,
      auth: auth,
      user_agent: userAgent,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,endpoint',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('❌ Error guardando suscripción:', subscriptionError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error guardando suscripción en base de datos' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Suscripción push guardada:', subscription.id);

    // Crear preferencias por defecto si no existen
    const { error: preferencesError } = await supabase
      .rpc('create_default_notification_preferences', { 
        user_id_param: userId 
      });

    if (preferencesError) {
      console.warn('⚠️ Error creando preferencias por defecto:', preferencesError);
      // No es crítico, continuamos
    } else {
      console.log('✅ Preferencias por defecto creadas/verificadas');
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción push activada exitosamente',
      subscriptionId: subscription.id
    });

  } catch (error) {
    console.error('❌ Error en API Push Subscribe:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔕 API Push Unsubscribe: Iniciando desuscripción...');
    
    const body = await request.json();
    const { userId, endpoint } = body;

    // Validar datos requeridos
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    // Si hay endpoint específico, desactivar solo esa suscripción
    // Si no, desactivar todas las suscripciones del usuario
    let query = supabase
      .from('push_subscriptions')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { error: unsubscribeError } = await query;

    if (unsubscribeError) {
      console.error('❌ Error desactivando suscripción:', unsubscribeError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error desactivando suscripción' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Suscripción push desactivada para usuario:', userId);

    return NextResponse.json({
      success: true,
      message: 'Suscripción push desactivada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en API Push Unsubscribe:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    // Obtener suscripciones activas del usuario
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error obteniendo suscripciones:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo suscripciones' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      count: subscriptions?.length || 0
    });

  } catch (error) {
    console.error('❌ Error en API Push GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
