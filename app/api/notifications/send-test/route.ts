// ==============================================
// API ENDPOINT: ENVÍO DE NOTIFICACIONES PUSH DE PRUEBA
// Permite enviar notificaciones push de prueba para testing
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurar web-push con las VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Plantillas de notificaciones - FASE 1: Solo críticas
const NOTIFICATION_TEMPLATES = {
  match: {
    title: '💖 ¡Nuevo Match!',
    body: 'Tienes un nuevo match esperándote. ¡Ve a conocerlo!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'new-match',
    requireInteraction: true,
    actions: [
      {
        action: 'view_match',
        title: 'Ver Match',
        icon: '/icon-heart.png'
      }
    ],
    data: {
      type: 'new_match',
      url: '/matches',
      timestamp: Date.now(),
      priority: 'high'
    }
  },
  message: {
    title: '� Nuevo Mensaje',
    body: 'Tienes un nuevo mensaje de uno de tus matches.',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'new-message',
    requireInteraction: false,
    actions: [
      {
        action: 'view_message',
        title: 'Ver Mensaje',
        icon: '/icon-message.png'
      }
    ],
    data: {
      type: 'new_message',
      url: '/messages',
      timestamp: Date.now(),
      priority: 'high'
    }
  },
  // Solo para testing interno
  test: {
    title: '🧪 Test Sistema',
    body: '¡Sistema de notificaciones funcionando!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'test-notification',
    requireInteraction: false,
    data: {
      type: 'test',
      url: '/dashboard',
      timestamp: Date.now(),
      priority: 'normal'
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 API Send Test: Iniciando envío de notificación de prueba...');
    
    const body = await request.json();
    const { userId, type = 'test' } = body;

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

    // Verificar que el tipo de notificación existe
    if (!NOTIFICATION_TEMPLATES[type as keyof typeof NOTIFICATION_TEMPLATES]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tipo de notificación '${type}' no válido. Tipos disponibles: ${Object.keys(NOTIFICATION_TEMPLATES).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Obtener suscripciones activas del usuario
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subscriptionsError) {
      console.error('❌ Error obteniendo suscripciones:', subscriptionsError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo suscripciones del usuario' 
        },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no tiene suscripciones push activas' 
        },
        { status: 404 }
      );
    }

    console.log(`📧 Enviando notificación tipo '${type}' a ${subscriptions.length} dispositivo(s)...`);

    // Preparar la notificación
    const notificationTemplate = NOTIFICATION_TEMPLATES[type as keyof typeof NOTIFICATION_TEMPLATES];
    const notification = {
      ...notificationTemplate,
      timestamp: Date.now()
    };

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Enviar a cada suscripción
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        // Enviar notificación push
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notification),
          {
            TTL: 86400, // 24 horas
            urgency: 'normal',
            topic: notification.tag
          }
        );

        successCount++;
        results.push({
          subscriptionId: subscription.id,
          success: true,
          endpoint: subscription.endpoint.substring(0, 50) + '...'
        });

        // Registrar en historial de notificaciones
        await supabase
          .from('notification_history')
          .insert({
            user_id: userId,
            subscription_id: subscription.id,
            type: type,
            title: notification.title,
            body: notification.body,
            sent_at: new Date().toISOString(),
            status: 'sent'
          });

        console.log(`✅ Notificación enviada a suscripción ${subscription.id}`);

      } catch (error: any) {
        failureCount++;
        console.error(`❌ Error enviando a suscripción ${subscription.id}:`, error.message);
        
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
          endpoint: subscription.endpoint.substring(0, 50) + '...'
        });

        // Si la suscripción es inválida (410 Gone), marcarla como inactiva
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
          
          console.log(`🔕 Suscripción ${subscription.id} marcada como inactiva (410 Gone)`);
        }

        // Registrar el fallo en el historial
        await supabase
          .from('notification_history')
          .insert({
            user_id: userId,
            subscription_id: subscription.id,
            type: type,
            title: notification.title,
            body: notification.body,
            sent_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message
          });
      }
    }

    console.log(`📊 Resultados: ${successCount} enviadas, ${failureCount} fallidas`);

    return NextResponse.json({
      success: successCount > 0,
      message: `Notificación enviada a ${successCount} de ${subscriptions.length} dispositivos`,
      stats: {
        total: subscriptions.length,
        success: successCount,
        failures: failureCount
      },
      notification: {
        type: type,
        title: notification.title,
        body: notification.body
      },
      results: results
    });

  } catch (error) {
    console.error('❌ Error en API Send Test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// GET: Listar tipos de notificaciones disponibles
export async function GET() {
  return NextResponse.json({
    success: true,
    availableTypes: Object.keys(NOTIFICATION_TEMPLATES),
    templates: Object.entries(NOTIFICATION_TEMPLATES).map(([key, template]) => ({
      type: key,
      title: template.title,
      body: template.body,
      description: getTemplateDescription(key)
    }))
  });
}

// Función auxiliar para describir cada tipo de notificación
function getTemplateDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    test: 'Notificación técnica para verificar que el sistema funciona',
    match: 'Notificación crítica cuando hay un nuevo match (Fase 1)',
    message: 'Notificación crítica cuando llega un nuevo mensaje (Fase 1)'
  };
  
  return descriptions[type] || 'Descripción no disponible';
}
