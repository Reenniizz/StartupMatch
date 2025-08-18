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

        {/* Main Content - Professional Dashboard Design */}
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <div className="p-8 max-w-7xl mx-auto">
            
            {/* HERO SECTION: Executive Summary */}
            <div className="mb-8">
              <div className={`relative rounded-3xl p-8 border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-slate-700' 
                  : 'bg-gradient-to-br from-slate-50 via-white to-gray-50 border-gray-200'
              } shadow-xl overflow-hidden`}>
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-500 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h1 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Welcome back, {user?.email?.split('@')[0] || 'Founder'}
                      </h1>
                      <p className={`text-lg mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Your entrepreneurial journey continues with <span className="font-semibold text-blue-600">3 potential co-founders</span> waiting to connect
                      </p>
                    </div>
                    
                    {/* Key Metrics Card */}
                    <div className={`p-6 rounded-2xl ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white/70 border-gray-200'
                    } border backdrop-blur-sm min-w-[200px]`}>
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>94%</div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Match Score</div>
                        <div className={`text-xs mt-2 px-3 py-1 rounded-full ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                        }`}>
                          2 profile views today
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => router.push('/matches')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      View Matches
                      <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">3</span>
                    </button>
                    <button 
                      onClick={() => router.push('/messages')}
                      className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                        isDarkMode 
                          ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                          : 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200'
                      } shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Messages
                      <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">2</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ANALYTICS SECTION: Professional Progress Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Progress Analytics */}
              <div className="lg:col-span-2">
                <div className={`rounded-3xl p-8 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } shadow-xl border`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Profile Optimization
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Enhance your founder profile
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">78%</div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Complete</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`w-full rounded-full h-3 mb-8 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full shadow-lg" style={{width: '78%'}}></div>
                  </div>
                  
                  {/* Optimization Suggestions */}
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                    } transition-all hover:shadow-md`}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Add technical skills
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 text-sm font-medium">+15% match rate</span>
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                    } transition-all hover:shadow-md`}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Upload pitch deck
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 text-sm font-medium">+20% engagement</span>
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className={`rounded-3xl p-8 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              } shadow-xl border`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Weekly Performance
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Your engagement metrics
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>New Matches</div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>This week</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>7</div>
                      <div className="text-xs text-emerald-600 font-medium">+2 from last week</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Conversations</div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active threads</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4</div>
                      <div className="text-xs text-blue-600 font-medium">2 new responses</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Profile Views</div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Last 7 days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>23</div>
                      <div className="text-xs text-violet-600 font-medium">+8% increase</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DISCOVERY SECTION: Opportunities & Networking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Strategic Opportunities */}
              <div className={`rounded-3xl p-8 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              } shadow-xl border`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Strategic Opportunities
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      High-potential ventures for you
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className={`group p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        FT
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            FinTech Innovation
                          </h4>
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-emerald-700 dark:text-emerald-300 text-xs font-medium">95% match</span>
                          </div>
                        </div>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Seeking experienced CTO for revolutionary payment platform
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                            React • Node.js
                          </span>
                          <span className={`px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                            Series A Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`group p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            AI Marketing Suite
                          </h4>
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">89% match</span>
                          </div>
                        </div>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Looking for senior marketing co-founder with B2B SaaS experience
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                            B2B SaaS
                          </span>
                          <span className={`px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                            Pre-Revenue
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Network */}
              <div className={`rounded-3xl p-8 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              } shadow-xl border`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Network Expansion
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Connect with industry leaders
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className={`group p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          MG
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            María González
                          </h4>
                          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Connect
                          </button>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Senior Product Manager at Stripe
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-1">
                            <div className="w-5 h-5 bg-blue-500 rounded-full border border-white"></div>
                            <div className="w-5 h-5 bg-green-500 rounded-full border border-white"></div>
                            <div className="w-5 h-5 bg-purple-500 rounded-full border border-white"></div>
                          </div>
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            3 mutual connections
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`group p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          JL
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Juan López
                          </h4>
                          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Connect
                          </button>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Former Google AI • 5 successful exits
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-lg ${isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                            Investor
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-lg ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                            Mentor
                          </span>
                        </div>
                      </div>
                    </div>
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
