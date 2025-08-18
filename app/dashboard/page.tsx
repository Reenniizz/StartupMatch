"use client";

// ✅ DASHBOARD CLIENT COMPONENT
// Nota: Existía una versión server-side (page-server.tsx) pero fue eliminada
// porque no se estaba utilizando y faltaban dependencias (DashboardClient).
// Si en el futuro necesitamos server-side rendering para SEO/performance,
// implementar con los componentes correctos y Suspense boundaries.

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import dynamic from "next/dynamic";

// Dashboard Components - Lazy loading los más pesados
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardSidebar } from "./components/DashboardSidebar";

// Dynamic imports para componentes pesados
const NotificationCenter = dynamic(() => import("@/components/NotificationCenter"), {
  loading: () => <div className="h-8 w-8 animate-pulse bg-gray-200 rounded"></div>
});

const StatsCards = dynamic(() => import("./components/StatsCards").then(mod => ({ default: mod.StatsCards })), {
  loading: () => <div className="h-32 animate-pulse bg-gray-200 rounded-lg"></div>
});

const QuickActions = dynamic(() => import("./components/QuickActions").then(mod => ({ default: mod.QuickActions })), {
  loading: () => <div className="h-24 animate-pulse bg-gray-200 rounded-lg"></div>
});

const WelcomeSection = dynamic(() => import("./components/WelcomeSection").then(mod => ({ default: mod.WelcomeSection })), {
  loading: () => <div className="h-20 animate-pulse bg-gray-200 rounded-lg"></div>
});

const PopularGroups = dynamic(() => import("./components/PopularGroups").then(mod => ({ default: mod.PopularGroups })), {
  loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>
});

const RecentActivity = dynamic(() => import("./components/RecentActivity").then(mod => ({ default: mod.RecentActivity })), {
  loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>
});

// Dashboard Hooks
import { useTheme } from "./hooks/useTheme";
import { useSidebar } from "./hooks/useSidebar";
import { useDashboardState } from "./hooks/useDashboardState";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const {
    stats,
    activities,
    groups,
    sidebarItems,
    quickActions,
    statsLoading,
    activitiesLoading,
    groupsLoading,
    userMenuOpen,
    setUserMenuOpen,
    activeSection,
    handleSignOut
  } = useDashboardState();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Simplified Header */}
      <DashboardHeader
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        user={user}
        userMenuOpen={userMenuOpen}
        onToggleUserMenu={() => setUserMenuOpen(!userMenuOpen)}
        onCloseUserMenu={() => setUserMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar
          collapsed={isCollapsed}
          activeSection={activeSection}
          onSetActiveSection={() => {}}
          isDarkMode={isDarkMode}
          items={sidebarItems}
        />

        {/* Main Content - Rediseñado para focus en matching */}
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <div className="p-6 max-w-7xl mx-auto">
            
            {/* HERO SECTION: CORE VALUE FRONT & CENTER */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        ¡Hola {user?.email?.split('@')[0] || 'Founder'}! 👋
                      </h1>
                      <p className="text-blue-100 text-lg mb-4">
                        3 co-founders perfectos están esperándote
                      </p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => router.push('/matches')}
                          className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                          🚀 Ver mis matches
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                        </button>
                        <button 
                          onClick={() => router.push('/messages')}
                          className="border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          💬 Mensajes activos
                          <span className="bg-green-400 text-white text-xs px-2 py-1 rounded-full">2</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">94%</div>
                      <div className="text-blue-100 text-sm">Tu puntuación de match</div>
                      <div className="text-xs text-blue-200 mt-1">2 founders vieron tu perfil hoy</div>
                    </div>
                  </div>
                </div>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              </div>
            </div>

            {/* PROGRESS SECTION: Achievement & Next Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      🎯 Tu progreso como founder
                    </h3>
                    <span className="text-sm text-green-600 font-medium">78% completado</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  
                  {/* Quick improvements */}
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Añade 2 skills más</span>
                      <span className="text-blue-600 text-sm">+15% match rate</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Completa tu pitch deck</span>
                      <span className="text-green-600 text-sm">+20% conversión</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Esta semana
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nuevos matches</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Conversaciones</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Perfil visitado</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>23</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DISCOVERY SECTION: Secondary Value */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommended Projects */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🚀 Proyectos recomendados
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      FT
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>FinTech Startup</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Busca CTO con React</div>
                    </div>
                    <div className="text-green-600 text-sm font-medium">95% match</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Marketing Tool</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Necesita CMO Senior</div>
                    </div>
                    <div className="text-green-600 text-sm font-medium">89% match</div>
                  </div>
                </div>
              </div>

              {/* Network Growth */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🌐 Expande tu red
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      MG
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>María González</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>3 conexiones mutuas</div>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:underline">
                      Conectar
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      JL
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Juan López</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ex-Google, 5 startups</div>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:underline">
                      Conectar
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
