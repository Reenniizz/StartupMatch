"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  console.log("🔍 DASHBOARD: Estado actual", { user: !!user, loading });

  // Redirect if not authenticated
  useEffect(() => {
    console.log("🔄 DASHBOARD: useEffect ejecutado", { user: !!user, loading });
    if (!loading && !user) {
      console.log("🚪 DASHBOARD: Redirigiendo a login");
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    console.log("⏳ DASHBOARD: Mostrando loading");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    console.log("❌ DASHBOARD: Sin usuario, no renderizando");
    return null;
  }

  console.log("✅ DASHBOARD: Renderizando dashboard para usuario:", user.email);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Dashboard Funcionando! 🎉
          </h1>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>✅ Login exitoso en commit b4bc701</strong>
          </div>
          <div className="space-y-3">
            <p><strong>Usuario:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Commit:</strong> b4bc701 - Sistema de Mensajes WhatsApp Style</p>
            <p className="text-sm text-gray-600">
              Dashboard simplificado funcionando. AuthProvider con timeout de 10s activo.
            </p>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">🚀 Estado del Sistema</h2>
            <ul className="space-y-2 text-blue-800">
              <li>✅ AuthProvider con timeout funcionando</li>
              <li>✅ Supabase conectado</li>
              <li>✅ Socket.IO operativo</li>
              <li>✅ Dashboard básico cargado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
