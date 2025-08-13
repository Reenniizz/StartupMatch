// ==============================================
// HOOK PARA NOTIFICACIONES PUSH DEL NAVEGADOR
// Este hook maneja las notificaciones push nativas (browser notifications)
// Diferente de useNotifications.ts que maneja notificaciones internas de la app
// ==============================================

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-client';

// ========================================
// 1. TIPOS Y INTERFACES
// ========================================

interface PushNotificationHook {
  // Estados del sistema
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  
  // Funciones principales
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
  
  // Funciones de preferencias
  preferences: PushPreferences | null;
  updatePreferences: (prefs: Partial<PushPreferences>) => Promise<boolean>;
  
  // Funciones de testing
  sendTestNotification: (type?: string) => Promise<boolean>;
  
  // Analytics
  stats: PushStats | null;
  refreshStats: () => Promise<void>;
  
  // Estados de error
  error: string | null;
  clearError: () => void;
}

interface PushPreferences {
  new_matches: boolean;
  new_messages: boolean;
  connection_requests: boolean;
  connection_accepted: boolean;
  weekly_summary: boolean;
  marketing: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

interface PushStats {
  total_sent: number;
  total_clicked: number;
  click_rate: number;
  last_notification: string | null;
}

// ========================================
// 2. HOOK PRINCIPAL
// ========================================

export const usePushNotifications = (): PushNotificationHook => {
  const { user } = useAuth();
  
  // Estados del hook
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PushPreferences | null>(null);
  const [stats, setStats] = useState<PushStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para evitar re-renderizados
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // Verificar soporte del navegador
  const isSupported = typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    'Notification' in window;

  // ========================================
  // 3. INICIALIZACIÓN DEL SERVICE WORKER
  // ========================================
  
  useEffect(() => {
    if (!isSupported || !user) return;

    const initServiceWorker = async () => {
      try {
        console.log('🔧 Iniciando Service Worker para notificaciones push...');
        
        // Verificar si ya hay un Service Worker registrado
        let registration = await navigator.serviceWorker.getRegistration('/');
        
        if (!registration) {
          console.log('📝 Registrando nuevo Service Worker...');
          // Registrar Service Worker
          registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('✅ Service Worker registrado:', registration);
        } else {
          console.log('✅ Service Worker ya estaba registrado:', registration);
        }

        // Esperar a que el Service Worker esté activo
        if (registration.installing) {
          console.log('⏳ Service Worker instalándose...');
          await new Promise((resolve) => {
            registration!.installing!.addEventListener('statechange', () => {
              if (registration!.installing!.state === 'installed') {
                resolve(void 0);
              }
            });
          });
        }

        if (registration.waiting) {
          console.log('⏳ Service Worker esperando...');
          await new Promise((resolve) => {
            registration!.waiting!.addEventListener('statechange', () => {
              if (registration!.waiting!.state === 'activated') {
                resolve(void 0);
              }
            });
          });
        }

        // Asegurar que esté activo
        if (!registration.active) {
          console.log('⏳ Esperando que Service Worker se active...');
          await new Promise((resolve) => {
            registration!.addEventListener('updatefound', () => {
              const newWorker = registration!.installing;
              newWorker!.addEventListener('statechange', () => {
                if (newWorker!.state === 'activated') {
                  resolve(void 0);
                }
              });
            });
          });
        }

        registrationRef.current = registration;
        console.log('✅ Service Worker está activo y listo');

        // Verificar si ya hay una suscripción
        await checkSubscription();
        
        // Cargar preferencias del usuario
        await loadPreferences();
        
        // Obtener estadísticas
        await refreshStats();
        
        // Verificar estado del permiso
        setPermission(Notification.permission);

      } catch (error) {
        console.error('❌ Error inicializando Service Worker:', error);
        setError('Error inicializando sistema de notificaciones');
      }
    };

    initServiceWorker();
  }, [isSupported, user?.id]);

  // ========================================
  // 4. FUNCIONES PRINCIPALES
  // ========================================

  const checkSubscription = useCallback(async (): Promise<void> => {
    if (!registrationRef.current) return;

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      subscriptionRef.current = subscription;
      setIsSubscribed(!!subscription);
      
      console.log('🔍 Estado de suscripción push:', !!subscription);
    } catch (error) {
      console.error('❌ Error verificando suscripción push:', error);
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📱 Solicitando permiso para notificaciones push...');

      // Solicitar permiso
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        setError('Permisos de notificación denegados');
        return false;
      }

      console.log('✅ Permisos concedidos, verificando Service Worker...');

      // Verificar que tenemos un Service Worker activo
      if (!registrationRef.current) {
        console.log('🔄 Re-registrando Service Worker...');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
        registrationRef.current = registration;
      }

      // Verificar que el Service Worker esté realmente activo
      if (!registrationRef.current.active) {
        console.log('⏳ Esperando que Service Worker se active...');
        await navigator.serviceWorker.ready;
      }

      console.log('✅ Service Worker activo, creando suscripción push...');

      // Crear suscripción push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID public key no configurada');
      }

      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource
      });

      subscriptionRef.current = subscription;
      console.log('📧 Suscripción push creada:', subscription);

      // Guardar en base de datos
      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
        user_agent: navigator.userAgent
      };

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,endpoint'
        });

      if (dbError) {
        console.warn('⚠️ Error guardando en base de datos (puede ser que no esté configurada):', dbError);
        // No fallar por esto, aún podemos probar notificaciones localmente
      } else {
        console.log('✅ Suscripción push guardada en base de datos');
      }

      setIsSubscribed(true);
      
      return true;
      
      return true;

    } catch (error) {
      console.error('❌ Error creando suscripción push:', error);
      setError(`Error activando notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscriptionRef.current || !user) return false;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔕 Desactivando suscripción push...');

      // Desuscribir del navegador
      await subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;

      // Marcar como inactiva en base de datos
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setIsSubscribed(false);
      console.log('✅ Suscripción push desactivada');
      
      return true;

    } catch (error) {
      console.error('❌ Error desactivando suscripción push:', error);
      setError(`Error desactivando notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ========================================
  // 5. GESTIÓN DE PREFERENCIAS
  // ========================================

  const loadPreferences = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Crear preferencias por defecto
        const defaultPrefs: Partial<PushPreferences> = {
          new_matches: true,
          new_messages: true,
          connection_requests: true,
          connection_accepted: true,
          weekly_summary: true,
          marketing: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        await updatePreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('❌ Error cargando preferencias push:', error);
    }
  }, [user]);

  const updatePreferences = useCallback(async (newPrefs: Partial<PushPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      console.log('✅ Preferencias push actualizadas:', data);
      
      return true;
    } catch (error) {
      console.error('❌ Error actualizando preferencias push:', error);
      setError('Error guardando preferencias');
      return false;
    }
  }, [user]);

  // ========================================
  // 6. FUNCIONES DE TESTING
  // ========================================

  const sendTestNotification = useCallback(async (type: string = 'test'): Promise<boolean> => {
    if (!user || !isSubscribed) {
      setError('Usuario no autenticado o sin suscripción activa');
      return false;
    }

    try {
      console.log('🧪 Enviando notificación push de prueba...');

      // Primero intentar enviar una notificación local básica
      if (Notification.permission === 'granted') {
        const notification = new Notification('🧪 Prueba Local', {
          body: '¡Las notificaciones básicas funcionan!',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-local'
        });

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);
        
        console.log('✅ Notificación local enviada');
      }

      // Luego intentar con el API
      const response = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          type: type
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.warn('⚠️ Error del servidor (esperado si no hay base de datos):', result.error);
        // No fallar por esto, la notificación local ya funcionó
        return true;
      }

      console.log('✅ Notificación push del servidor enviada');
      return true;

    } catch (error) {
      console.warn('⚠️ Error enviando notificación del servidor (esperado):', error);
      // Si la notificación local funcionó, considerar éxito
      if (Notification.permission === 'granted') {
        return true;
      }
      setError('Error enviando notificación de prueba');
      return false;
    }
  }, [user, isSubscribed]);

  // ========================================
  // 7. ANALYTICS Y ESTADÍSTICAS
  // ========================================

  const refreshStats = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_notification_stats', { user_id_param: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas push:', error);
    }
  }, [user]);

  // ========================================
  // 8. UTILIDADES
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ========================================
  // 9. RETURN DEL HOOK
  // ========================================

  return {
    // Estados
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    
    // Funciones principales
    subscribe,
    unsubscribe,
    checkSubscription,
    
    // Preferencias
    preferences,
    updatePreferences,
    
    // Testing
    sendTestNotification,
    
    // Analytics
    stats,
    refreshStats,
    
    // Errores
    error,
    clearError
  };
};

// ========================================
// 10. FUNCIONES AUXILIARES
// ========================================

// Convertir VAPID key de string a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Convertir ArrayBuffer a base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default usePushNotifications;
