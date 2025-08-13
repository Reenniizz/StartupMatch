// ==============================================
// API ENDPOINT: ESTADÍSTICAS DE NOTIFICACIONES PUSH
// Proporciona análytics y estadísticas de notificaciones
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30'; // días por defecto

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 Obteniendo estadísticas de notificaciones para usuario ${userId} (${period} días)`);

    // Obtener estadísticas usando la función de base de datos
    const { data: stats, error: statsError } = await supabase
      .rpc('get_notification_stats', { user_id_param: userId });

    if (statsError) {
      console.error('❌ Error obteniendo estadísticas:', statsError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo estadísticas' 
        },
        { status: 500 }
      );
    }

    // Obtener historial reciente
    const periodDays = parseInt(period);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - periodDays);

    const { data: recentHistory, error: historyError } = await supabase
      .from('notification_history')
      .select(`
        id,
        type,
        title,
        body,
        sent_at,
        clicked_at,
        status,
        error_message
      `)
      .eq('user_id', userId)
      .gte('sent_at', dateFrom.toISOString())
      .order('sent_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('❌ Error obteniendo historial:', historyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo historial' 
        },
        { status: 500 }
      );
    }

    // Calcular estadísticas del período
    const periodStats = calculatePeriodStats(recentHistory || []);

    // Obtener conteo de suscripciones activas
    const { count: activeSubscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subscriptionsError) {
      console.warn('⚠️ Error obteniendo conteo de suscripciones:', subscriptionsError);
    }

    console.log('✅ Estadísticas obtenidas exitosamente');

    return NextResponse.json({
      success: true,
      stats: {
        // Estadísticas generales (de la función de base de datos)
        overall: stats && stats.length > 0 ? stats[0] : {
          total_sent: 0,
          total_clicked: 0,
          click_rate: 0,
          last_notification: null
        },
        
        // Estadísticas del período solicitado
        period: {
          days: periodDays,
          ...periodStats
        },
        
        // Información de suscripciones
        subscriptions: {
          active: activeSubscriptions || 0
        }
      },
      
      // Historial reciente
      recentNotifications: recentHistory || [],
      
      // Metadatos
      metadata: {
        period_days: periodDays,
        generated_at: new Date().toISOString(),
        total_history_items: recentHistory?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Error en API Stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// POST: Registrar click en notificación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, action = 'click' } = body;

    if (!notificationId || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'NotificationId y UserId requeridos' 
        },
        { status: 400 }
      );
    }

    console.log(`📱 Registrando ${action} en notificación:`, notificationId);

    // Actualizar historial con el click
    const { error } = await supabase
      .from('notification_history')
      .update({ 
        clicked_at: new Date().toISOString(),
        click_action: action
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error registrando click:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error registrando click' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Click registrado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Click registrado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en API Track Click:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular estadísticas del período
function calculatePeriodStats(notifications: any[]) {
  const total = notifications.length;
  const sent = notifications.filter(n => n.status === 'sent').length;
  const failed = notifications.filter(n => n.status === 'failed').length;
  const clicked = notifications.filter(n => n.clicked_at !== null).length;
  
  // Agrupar por tipo
  const byType = notifications.reduce((acc, notification) => {
    const type = notification.type || 'unknown';
    if (!acc[type]) {
      acc[type] = { total: 0, sent: 0, clicked: 0 };
    }
    acc[type].total++;
    if (notification.status === 'sent') acc[type].sent++;
    if (notification.clicked_at) acc[type].clicked++;
    return acc;
  }, {});

  // Agrupar por día
  const byDay = notifications.reduce((acc, notification) => {
    const date = new Date(notification.sent_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { total: 0, sent: 0, clicked: 0 };
    }
    acc[date].total++;
    if (notification.status === 'sent') acc[date].sent++;
    if (notification.clicked_at) acc[date].clicked++;
    return acc;
  }, {});

  return {
    total_notifications: total,
    sent_successfully: sent,
    failed: failed,
    clicked: clicked,
    click_rate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    success_rate: total > 0 ? Math.round((sent / total) * 100) : 0,
    by_type: byType,
    by_day: byDay,
    most_recent: notifications.length > 0 ? notifications[0].sent_at : null
  };
}
