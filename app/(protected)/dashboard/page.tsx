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
const NotificationCenter = dynamic(() => import("@/components/messaging/NotificationCenter"), {
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
          <p className="text-gray-600">Cargando...</p>
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
      {/* Header */}
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
          onSetActiveSection={() => {}} // TODO: implement
          isDarkMode={isDarkMode}
          items={sidebarItems}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <div className="p-6">
            {/* Stats Cards */}
            <StatsCards
              stats={stats}
              loading={statsLoading}
              isDarkMode={isDarkMode}
            />

            {/* Quick Actions */}
            <QuickActions 
              isDarkMode={isDarkMode}
              actions={quickActions}
            />

            {/* Welcome Section & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Welcome Section */}
              <div className="lg:col-span-2">
                <WelcomeSection
                  user={user}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Popular Groups */}
              <PopularGroups
                groups={groups}
                loading={groupsLoading}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <RecentActivity
                activities={activities}
                loading={activitiesLoading}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
