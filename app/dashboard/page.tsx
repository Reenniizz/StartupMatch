"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { 
  Home, 
  Menu, 
  ChevronLeft,
  User,
  Bell,
  Moon,
  Sun,
  Search,
  Star,
  MessageSquare,
  Settings,
  BarChart3,
  Calendar,
  Heart,
  Rocket,
  Handshake,
  GraduationCap,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "matches", label: "Matches", icon: Heart, href: "/matches" },
  { id: "explore", label: "Explorar", icon: Search, href: "/explore" },
  { id: "favorites", label: "Favoritos", icon: Star, href: "/favorites" },
  { id: "messages", label: "Mensajes", icon: MessageSquare, href: "/messages", badge: "3" },
  { id: "collaborations", label: "Colaboraciones", icon: Handshake, href: "/collaborations" },
  { id: "projects", label: "Mis Proyectos", icon: Rocket, href: "/projects" },
  { id: "events", label: "Eventos", icon: Calendar, href: "/events" },
  { id: "resources", label: "Resources", icon: GraduationCap, href: "/resources" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" }
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ALL HOOKS FIRST - ALWAYS IN SAME ORDER
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('startupMatch-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('startupMatch-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showUserMenu]);

  // CONDITIONAL RENDERS AFTER ALL HOOKS
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
      <header className={`shadow-sm border-b sticky top-0 z-40 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
              <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>StartupMatch</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              {/* User Menu - SUPER SIMPLE */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Button clicked! Current state:', showUserMenu);
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  <User className="h-5 w-5" />
                </button>
                
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
                    style={{position: 'absolute', top: '100%', right: 0}}
                  >
                    <div className="p-2">
                      <p className="text-xs text-gray-500 mb-2">
                        {user?.email || 'Usuario'}
                      </p>
                      
                      <a 
                        href="/profile"
                        className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          console.log('Profile clicked!');
                          setShowUserMenu(true);
                        }}
                      >
                        Mi Perfil
                      </a>
                      
                      <a 
                        href="/settings"
                        className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          console.log('Settings clicked!');
                          setShowUserMenu(false);
                        }}
                      >
                        Configuración
                      </a>
                      
                      <hr className="my-2" />
                      
                      <button
                        onClick={async () => {
                          console.log('Logout clicked!');
                          setShowUserMenu(false);
                          await signOut();
                          window.location.href = '/login';
                        }}
                        className="block w-full text-left p-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3 }}
          className={`border-r shadow-sm h-[calc(100vh-73px)] sticky top-[73px] transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Link 
                    key={item.id}
                    href={item.href}
                    className="block"
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start relative transition-colors duration-300 ${
                        sidebarCollapsed ? "px-2" : "px-3"
                      } ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-700 hover:text-gray-900'
                      } ${
                        isActive && isDarkMode ? 'bg-gray-700 text-white' : ''
                      }`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <Icon className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>24</div>
                <p className="text-xs text-green-600 mt-1">+2 this week</p>
              </CardContent>
            </Card>
            
            <Card className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Active Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>12</div>
                <p className="text-xs text-blue-600 mt-1">+5 new matches</p>
              </CardContent>
            </Card>
            
            <Card className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>8</div>
                <p className="text-xs text-orange-600 mt-1">3 unread</p>
              </CardContent>
            </Card>

            <Card className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>67%</div>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Section */}
          <Card className={`mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={`text-xl transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ¡Bienvenido{' '}
                {user?.user_metadata?.username 
                  ? `@${user.user_metadata.username}`
                  : user?.user_metadata?.firstName
                  || 'Usuario'
                }! 🚀
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Esta es tu nueva dashboard con sidebar completamente funcional. 
                  Aquí tienes acceso rápido a todas las funcionalidades de StartupMatch.
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Dashboard Funcional</Badge>
                  <Badge variant="secondary">Sidebar Colapsable</Badge>
                  <Badge variant="secondary">Navegación Completa</Badge>
                  <Badge variant="secondary">Notificaciones</Badge>
                  <Badge variant="secondary">Tema Oscuro ✨</Badge>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link href="/projects">
                    <Button>
                      <Rocket className="mr-2 h-4 w-4" />
                      Crear Proyecto
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Buscar Matches
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline">
                      <User className="mr-2 h-4 w-4" />
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={`transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={`transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <div className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-800' : 'bg-blue-100'
                  }`}>
                    <Heart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Nuevo match encontrado</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>TechStartup busca co-founder</p>
                  </div>
                  <Badge variant="outline">Nuevo</Badge>
                </div>

                <div className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                }`}>
                  <div className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-green-800' : 'bg-green-100'
                  }`}>
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Mensaje recibido</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>De: María González</p>
                  </div>
                  <Badge variant="outline">2 min</Badge>
                </div>

                <div className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <div className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-yellow-800' : 'bg-yellow-100'
                  }`}>
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Evento próximo</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Startup Networking - Mañana</p>
                  </div>
                  <Badge variant="outline">Mañana</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
