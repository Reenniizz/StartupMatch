// ==============================================
// SERVICE WORKER PARA NOTIFICACIONES PUSH
// Este archivo maneja las notificaciones en el navegador
// ==============================================

console.log('🔧 Service Worker: Iniciando...');

// ========================================
// 1. CONFIGURACIÓN INICIAL
// ========================================

const CACHE_NAME = 'startupmatch-notifications-v1';
const APP_NAME = 'StartupMatch';

// URLs que el SW puede manejar offline
const CACHED_URLS = [
  '/',
  '/messages',
  '/matches',
  '/dashboard',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// ========================================
// 2. INSTALACIÓN DEL SERVICE WORKER
// ========================================

self.addEventListener('install', function(event) {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('💾 Service Worker: Precargando recursos...');
        return cache.addAll(CACHED_URLS);
      })
      .then(function() {
        console.log('✅ Service Worker: Instalado correctamente');
        // Activar inmediatamente el nuevo SW
        return self.skipWaiting();
      })
  );
});

// ========================================
// 3. ACTIVACIÓN DEL SERVICE WORKER
// ========================================

self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    // Limpiar cachés antiguos
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('✅ Service Worker: Activado correctamente');
      // Tomar control de todas las pestañas abiertas
      return self.clients.claim();
    })
  );
});

// ========================================
// 4. MANEJO DE NOTIFICACIONES PUSH - EVENTO PRINCIPAL
// ========================================

self.addEventListener('push', function(event) {
  console.log('📨 Notificación push recibida:', event);

  // Verificar que la notificación tiene datos
  if (!event.data) {
    console.warn('⚠️ Notificación sin datos recibida');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
    console.log('📝 Datos de la notificación:', notificationData);
  } catch (error) {
    console.error('❌ Error parseando datos de notificación:', error);
    notificationData = {
      title: APP_NAME,
      body: 'Nueva notificación',
      type: 'generic'
    };
  }

  // Configurar la notificación según el tipo
  const notificationOptions = createNotificationOptions(notificationData);

  // Mostrar la notificación
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
      .then(function() {
        console.log('✅ Notificación mostrada exitosamente');
        
        // Opcional: Enviar confirmación de entrega al servidor
        return sendDeliveryConfirmation(notificationData.id);
      })
      .catch(function(error) {
        console.error('❌ Error mostrando notificación:', error);
      })
  );
});

// ========================================
// 5. FUNCIÓN PARA CONFIGURAR NOTIFICACIONES
// ========================================

function createNotificationOptions(data) {
  const baseOptions = {
    body: data.body,
    icon: '/icon-192x192.png',      // Icono grande
    badge: '/badge-72x72.png',      // Icono pequeño en la barra de estado
    vibrate: [200, 100, 200],       // Patrón de vibración (móviles)
    timestamp: Date.now(),
    
    // Datos que podemos usar cuando el usuario haga clic
    data: {
      url: data.url || '/',
      notificationId: data.id,
      type: data.type,
      userId: data.userId,
      originalData: data
    },
    
    // Configuración visual y comportamiento
    requireInteraction: false,      // Si requiere interacción para cerrarse
    silent: false,                  // Si debe hacer sonido
    renotify: true,                // Si debe notificar aunque ya exista una similar
    tag: data.type || 'general'    // Agrupar notificaciones similares
  };

  // Personalizar según el tipo de notificación
  switch (data.type) {
    case 'new_message':
      return {
        ...baseOptions,
        icon: '/icon-message.png',
        requireInteraction: true,    // Los mensajes requieren atención
        actions: [
          {
            action: 'reply',
            title: '💬 Responder',
            icon: '/icon-reply.png'
          },
          {
            action: 'view',
            title: '👀 Ver conversación',
            icon: '/icon-view.png'
          },
          {
            action: 'dismiss',
            title: '❌ Cerrar',
            icon: '/icon-close.png'
          }
        ],
        vibrate: [300, 100, 300, 100, 300]  // Vibración más intensa para mensajes
      };

    case 'new_match':
      return {
        ...baseOptions,
        icon: '/icon-match.png',
        actions: [
          {
            action: 'view_profile',
            title: '👤 Ver perfil',
            icon: '/icon-profile.png'
          },
          {
            action: 'connect',
            title: '🤝 Conectar',
            icon: '/icon-connect.png'
          },
          {
            action: 'dismiss',
            title: '❌ Cerrar',
            icon: '/icon-close.png'
          }
        ],
        vibrate: [500, 200, 500]  // Vibración especial para matches
      };

    case 'connection_request':
      return {
        ...baseOptions,
        icon: '/icon-request.png',
        requireInteraction: true,
        actions: [
          {
            action: 'accept',
            title: '✅ Aceptar',
            icon: '/icon-accept.png'
          },
          {
            action: 'view_request',
            title: '👀 Ver solicitud',
            icon: '/icon-view.png'
          },
          {
            action: 'dismiss',
            title: '❌ Cerrar',
            icon: '/icon-close.png'
          }
        ]
      };

    case 'connection_accepted':
      return {
        ...baseOptions,
        icon: '/icon-success.png',
        actions: [
          {
            action: 'send_message',
            title: '💬 Enviar mensaje',
            icon: '/icon-message.png'
          },
          {
            action: 'view_connection',
            title: '👀 Ver conexión',
            icon: '/icon-view.png'
          },
          {
            action: 'dismiss',
            title: '❌ Cerrar',
            icon: '/icon-close.png'
          }
        ]
      };

    default:
      return {
        ...baseOptions,
        actions: [
          {
            action: 'view',
            title: '👀 Ver',
            icon: '/icon-view.png'
          },
          {
            action: 'dismiss',
            title: '❌ Cerrar',
            icon: '/icon-close.png'
          }
        ]
      };
  }
}

// ========================================
// 6. MANEJO DE CLICS EN NOTIFICACIONES
// ========================================

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Clic en notificación:', {
    action: event.action,
    notification: event.notification.data
  });

  // Cerrar la notificación
  event.notification.close();

  // Si el usuario solo quiere cerrar, no hacer nada más
  if (event.action === 'dismiss') {
    console.log('👋 Usuario cerró la notificación');
    return;
  }

  // Registrar el clic para analytics
  const notificationData = event.notification.data;
  event.waitUntil(
    trackNotificationClick(notificationData.notificationId, event.action || 'click')
  );

  // Determinar qué URL abrir según la acción
  const urlToOpen = getUrlForAction(event.action, notificationData);

  // Abrir la URL apropiada
  event.waitUntil(
    openUrlInApp(urlToOpen)
      .then(function() {
        console.log('✅ URL abierta exitosamente:', urlToOpen);
      })
      .catch(function(error) {
        console.error('❌ Error abriendo URL:', error);
      })
  );
});

// ========================================
// 7. FUNCIONES AUXILIARES
// ========================================

// Determinar qué URL abrir según la acción
function getUrlForAction(action, data) {
  const baseUrl = self.location.origin;
  
  switch (action) {
    case 'reply':
    case 'send_message':
      return `${baseUrl}/messages?conversation=${data.originalData.conversationId || ''}`;
    
    case 'view':
    case 'view_profile':
      return data.url || `${baseUrl}/matches`;
    
    case 'view_request':
      return `${baseUrl}/matches?tab=requests`;
    
    case 'view_connection':
      return `${baseUrl}/matches?tab=connections`;
    
    case 'connect':
      return `${baseUrl}/matches?user=${data.originalData.fromUserId || ''}`;
    
    case 'accept':
      // Para aceptar solicitudes, podríamos enviar una acción al servidor
      return `${baseUrl}/matches?tab=requests&action=accept&id=${data.originalData.requestId || ''}`;
    
    default:
      return data.url || `${baseUrl}/dashboard`;
  }
}

// Abrir URL en la aplicación (reusar pestaña existente o crear nueva)
function openUrlInApp(url) {
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(function(clientList) {
    console.log('🔍 Buscando ventana existente para:', url);
    
    // Buscar si ya hay una pestaña abierta con StartupMatch
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      console.log('🪟 Ventana encontrada:', client.url);
      
      // Si encontramos una ventana de StartupMatch, navegarla y enfocarla
      if (client.url.includes(self.location.origin)) {
        console.log('✅ Reutilizando ventana existente');
        return client.navigate(url).then(function() {
          return client.focus();
        });
      }
    }
    
    // Si no hay ventana existente, abrir una nueva
    console.log('🆕 Abriendo nueva ventana');
    return clients.openWindow(url);
  });
}

// Enviar confirmación de entrega al servidor
function sendDeliveryConfirmation(notificationId) {
  if (!notificationId) return Promise.resolve();
  
  return fetch('/api/notifications/track-delivery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      notificationId: notificationId,
      deliveredAt: new Date().toISOString()
    })
  }).catch(function(error) {
    console.error('❌ Error enviando confirmación de entrega:', error);
  });
}

// Registrar clic para analytics
function trackNotificationClick(notificationId, action) {
  if (!notificationId) return Promise.resolve();
  
  return fetch('/api/notifications/track-click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      notificationId: notificationId,
      action: action,
      clickedAt: new Date().toISOString()
    })
  }).catch(function(error) {
    console.error('❌ Error registrando clic:', error);
  });
}

// ========================================
// 8. MANEJO DE ERRORES GLOBALES
// ========================================

self.addEventListener('error', function(event) {
  console.error('❌ Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('❌ Promise rechazada en Service Worker:', event.reason);
});

// ========================================
// 9. LOGS DE ESTADO
// ========================================

console.log('✅ Service Worker: Configuración completada');
console.log('📋 Service Worker: Eventos registrados - install, activate, push, notificationclick');
console.log('🎯 Service Worker: Listo para recibir notificaciones push');
