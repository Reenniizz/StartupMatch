import React, { Suspense } from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsCards } from "./components/StatsCards";
import { QuickActions } from "./components/QuickActions";
import { WelcomeSection } from "./components/WelcomeSection";
import { PopularGroups } from "./components/PopularGroups";
import { RecentActivity } from "./components/RecentActivity";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

// Client Component para funcionalidad interactiva
import DashboardClient from "./components/DashboardClient";

// Server Component optimizado
export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="flex">
        {/* Sidebar y interactividad como Client Component */}
        <DashboardClient />
        
        {/* Contenido principal como Server Component */}
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <Suspense fallback={<LoadingSkeleton className="h-16" />}>
            <DashboardHeader />
          </Suspense>
          
          {/* Welcome Section */}
          <Suspense fallback={<LoadingSkeleton className="h-32" />}>
            <WelcomeSection />
          </Suspense>
          
          {/* Stats Cards */}
          <Suspense fallback={<LoadingSkeleton className="h-40" />}>
            <StatsCards />
          </Suspense>
          
          {/* Quick Actions */}
          <Suspense fallback={<LoadingSkeleton className="h-24" />}>
            <QuickActions />
          </Suspense>
          
          {/* Grid de contenido */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingSkeleton className="h-64" />}>
              <PopularGroups />
            </Suspense>
            
            <Suspense fallback={<LoadingSkeleton className="h-64" />}>
              <RecentActivity />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
