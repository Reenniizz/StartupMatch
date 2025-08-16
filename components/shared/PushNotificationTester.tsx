// ==============================================
// COMPONENTE DE PRUEBA PARA NOTIFICACIONES PUSH
// Permite probar y verificar el sistema de notificaciones push
// ==============================================

"use client";

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Send, 
  Settings, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Heart,
  MessageSquare,
  UserPlus,
  TrendingUp
} from 'lucide-react';

export default function PushNotificationTester() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    preferences,
    updatePreferences,
    stats,
    refreshStats,
    error,
    clearError
  } = usePushNotifications();

  const [testType, setTestType] = useState<string>('test');
  const [sending, setSending] = useState(false);

  // Refrescar stats al montar el componente
  useEffect(() => {
    if (isSubscribed) {
      refreshStats();
    }
  }, [isSubscribed, refreshStats]);

  // ========================================
  // MANEJADORES DE EVENTOS
  // ========================================

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      await refreshStats();
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      await refreshStats();
    }
  };

  const handleSendTest = async (type: string) => {
    setSending(true);
    try {
      const success = await sendTestNotification(type);
      if (success) {
        await refreshStats();
      }
    } finally {
      setSending(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (preferences) {
      await updatePreferences({
        [key]: value
      });
    }
  };

  // ========================================
  // FUNCIONES DE RENDERIZADO
  // ========================================

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Concedido</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Denegado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    return isSubscribed ? <Bell className="w-5 h-5 text-green-600" /> : <BellOff className="w-5 h-5 text-gray-400" />;
  };

  // ========================================
  // COMPONENTE PRINCIPAL
  // ========================================

  if (!isSupported) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Safari.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Notificaciones Push - Fase 1
        </h1>
        <p className="text-gray-600 mb-2">
          Sistema enfocado en notificaciones críticas: <strong>Matches y Mensajes</strong>
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Estrategia conservadora para máximo impacto
        </div>
      </div>

      {/* ========================================
          ESTADO DEL SISTEMA
          ======================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Soporte</div>
              <div className="font-semibold">
                {isSupported ? '✅ Disponible' : '❌ No disponible'}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Permisos</div>
              <div>{getPermissionBadge()}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Suscripción</div>
              <div className="font-semibold">
                {isSubscribed ? '🔔 Activa' : '🔕 Inactiva'}
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={clearError}
                  className="ml-2 p-0 h-auto text-red-600"
                >
                  Cerrar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-center">
            {!isSubscribed ? (
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading || permission === 'denied'}
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Activar Notificaciones
              </Button>
            ) : (
              <Button 
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
                Desactivar Notificaciones
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================
          PRUEBAS DE NOTIFICACIONES - FASE 1
          ======================================== */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Notificaciones Críticas (Fase 1)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleSendTest('match')}
                disabled={sending}
                className="flex items-center gap-2 h-20 flex-col bg-pink-600 hover:bg-pink-700"
              >
                <Heart className="w-6 h-6" />
                <span>💖 Nuevo Match</span>
              </Button>

              <Button
                onClick={() => handleSendTest('message')}
                disabled={sending}
                className="flex items-center gap-2 h-20 flex-col bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-6 h-6" />
                <span>💬 Nuevo Mensaje</span>
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🎯 Estrategia Fase 1:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Solo notificaciones de alta prioridad</li>
                <li>✅ Matches inmediatos para aprovechar momentum</li>
                <li>✅ Mensajes directos para mantener conversaciones</li>
                <li>⏳ Más tipos vendrán en futuras fases</li>
              </ul>
            </div>

            {sending && (
              <div className="text-center mt-4">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando notificación crítica...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================
          PREFERENCIAS - FASE 1
          ======================================== */}
      {isSubscribed && preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferencias de Notificación (Fase 1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-pink-800">💖 Nuevos matches</label>
                  <p className="text-xs text-pink-600">Notificar cuando alguien haga match contigo</p>
                </div>
                <Switch
                  checked={preferences.new_matches}
                  onCheckedChange={(checked) => handlePreferenceChange('new_matches', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-blue-800">💬 Nuevos mensajes</label>
                  <p className="text-xs text-blue-600">Notificar cuando recibas mensajes directos</p>
                </div>
                <Switch
                  checked={preferences.new_messages}
                  onCheckedChange={(checked) => handlePreferenceChange('new_messages', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">🚀 Próximamente en Fase 2:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>🤝 Solicitudes de conexión</div>
                <div>✅ Conexión aceptada</div>
                <div>📊 Resumen semanal</div>
                <div>⏰ Horarios silenciosos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================
          ESTADÍSTICAS
          ======================================== */}
      {isSubscribed && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_sent}
                </div>
                <div className="text-sm text-blue-800">Enviadas</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_clicked}
                </div>
                <div className="text-sm text-green-800">Clickeadas</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.click_rate}%
                </div>
                <div className="text-sm text-purple-800">Tasa de Click</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600">
                  Última notificación
                </div>
                <div className="text-xs text-gray-500">
                  {stats.last_notification 
                    ? new Date(stats.last_notification).toLocaleString()
                    : 'Ninguna'
                  }
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button 
                onClick={refreshStats} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Actualizar Estadísticas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================
          INFORMACIÓN TÉCNICA
          ======================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Información Técnica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div>🔧 <strong>Service Worker:</strong> {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Disponible' : 'No disponible'}</div>
          <div>🌐 <strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'N/A'}</div>
          <div>📱 <strong>Plataforma:</strong> {typeof window !== 'undefined' ? navigator.platform : 'N/A'}</div>
          <div>🔔 <strong>API Push:</strong> {typeof window !== 'undefined' && 'PushManager' in window ? 'Disponible' : 'No disponible'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
