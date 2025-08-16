"use client";

import Link from "next/link";

export default function ProfilePageSimple() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Dashboard
            </Link>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-gray-600">
              ¡Esta es tu página de perfil! ✅
            </p>
            <p className="text-gray-600">
              La navegación desde el dashboard está funcionando correctamente.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">
                🎉 ¡Éxito! Has navegado correctamente al perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
