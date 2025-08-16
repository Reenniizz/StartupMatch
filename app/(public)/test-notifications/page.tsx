// ==============================================
// PÁGINA DE PRUEBA PARA NOTIFICACIONES PUSH
// Página dedicada para probar el sistema de notificaciones
// ==============================================

import { Metadata } from 'next';
import PushNotificationTester from '@/components/shared/PushNotificationTester';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Test de Notificaciones Push | StartupMatch',
  description: 'Prueba y configura las notificaciones push de StartupMatch',
};

export default function TestNotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PushNotificationTester />
      </div>
    </ProtectedRoute>
  );
}
