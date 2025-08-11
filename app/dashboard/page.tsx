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
  Users,
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
  { id: "grupos", label: "Grupos", icon: Users, href: "/grupos", badge: "5" },
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
          {/* Stats Cards - Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Connections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700' : 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">
                        Conexiones Activas
                      </p>
                      <p className="text-white text-3xl font-bold">142</p>
                      <p className="text-blue-200 text-xs mt-2 flex items-center">
                        ⬆️ +23 esta semana
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-full">
                      <Handshake className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Handshake className="h-20 w-20 text-white" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gradient-to-r from-purple-900 to-purple-800 border-purple-700' : 'bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium mb-1">
                        Matches Perfectos
                      </p>
                      <p className="text-white text-3xl font-bold">24</p>
                      <p className="text-purple-200 text-xs mt-2 flex items-center">
                        🎯 +7 nuevos hoy
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-full">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Heart className="h-20 w-20 text-white" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-700' : 'bg-gradient-to-r from-green-600 to-green-500 border-green-400'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium mb-1">
                        Conversaciones
                      </p>
                      <p className="text-white text-3xl font-bold">18</p>
                      <p className="text-green-200 text-xs mt-2 flex items-center">
                        💬 5 sin leer
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-full">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <MessageSquare className="h-20 w-20 text-white" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Success Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gradient-to-r from-orange-900 to-orange-800 border-orange-700' : 'bg-gradient-to-r from-orange-600 to-orange-500 border-orange-400'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium mb-1">
                        Tasa de Éxito
                      </p>
                      <p className="text-white text-3xl font-bold">89%</p>
                      <p className="text-orange-200 text-xs mt-2 flex items-center">
                        📈 +12% vs mes anterior
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-full">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <BarChart3 className="h-20 w-20 text-white" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Rocket className="mr-2 h-5 w-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/matches">
                    <div className={`p-4 rounded-lg border-2 border-dashed transition-all duration-300 hover:border-solid hover:scale-105 cursor-pointer ${
                      isDarkMode ? 'border-gray-600 hover:border-purple-500 hover:bg-purple-900/20' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                    }`}>
                      <Heart className="h-8 w-8 text-purple-500 mb-2" />
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Explorar Matches
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Encuentra personas compatibles con tus objetivos
                      </p>
                    </div>
                  </Link>

                  <Link href="/projects">
                    <div className={`p-4 rounded-lg border-2 border-dashed transition-all duration-300 hover:border-solid hover:scale-105 cursor-pointer ${
                      isDarkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/20' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}>
                      <Rocket className="h-8 w-8 text-blue-500 mb-2" />
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Crear Proyecto
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Comparte tu idea y encuentra co-fundadores
                      </p>
                    </div>
                  </Link>

                  <Link href="/profile">
                    <div className={`p-4 rounded-lg border-2 border-dashed transition-all duration-300 hover:border-solid hover:scale-105 cursor-pointer ${
                      isDarkMode ? 'border-gray-600 hover:border-green-500 hover:bg-green-900/20' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                    }`}>
                      <User className="h-8 w-8 text-green-500 mb-2" />
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Completar Perfil
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Optimiza tu perfil para mejores matches
                      </p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Welcome Section & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2"
            >
              <Card className={`transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-xl flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Star className="mr-2 h-6 w-6 text-yellow-500" />
                    ¡Hola{' '}
                    {user?.user_metadata?.firstName || user?.user_metadata?.username || 'Emprendedor'}! 🚀
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Bienvenido a tu dashboard de StartupMatch. Aquí puedes gestionar tus conexiones, 
                      explorar nuevas oportunidades y hacer crecer tu red de contactos empresariales.
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        🎯 Dashboard Moderno
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        ⚡ Super Rápido
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        🌙 Tema Oscuro
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        📱 Responsive
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Completitud del perfil
                        </span>
                        <span className="text-sm text-blue-600 font-semibold">75%</span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-2.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Completa tu perfil para mejores matches
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Grupos Populares */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className={`transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center justify-between transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Grupos Populares
                    </div>
                    <Link 
                      href="/grupos" 
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Ver todos
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Grupo 1 */}
                    <Link href="/grupos">
                      <motion.div 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                          isDarkMode ? 'bg-emerald-900/20 hover:bg-emerald-900/30' : 'bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">FT</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Fundadores FinTech México
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            127 miembros • 5 nuevos mensajes
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          isDarkMode ? 'bg-emerald-800 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          Activo
                        </div>
                      </motion.div>
                    </Link>

                    {/* Grupo 2 */}
                    <Link href="/grupos">
                      <motion.div 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                          isDarkMode ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">AI</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            AI Developers Network
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            234 miembros • Evento mañana
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          isDarkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          Unirse
                        </div>
                      </motion.div>
                    </Link>

                    {/* Grupo 3 */}
                    <Link href="/grupos">
                      <motion.div 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                          isDarkMode ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-orange-50 hover:bg-orange-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">PS</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Startups Pre-Seed
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            89 miembros • 2 nuevos mensajes
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          isDarkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'
                        }`}>
                          Miembro
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className={`transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Bell className="mr-2 h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Activity Item 1 */}
                    <motion.div 
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-blue-800' : 'bg-blue-100'
                      }`}>
                        <Heart className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Nuevo match perfecto
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          María G. busca co-founder técnico
                        </p>
                        <p className="text-xs text-blue-600 mt-1">hace 2 min</p>
                      </div>
                    </motion.div>

                    {/* Activity Item 2 */}
                    <motion.div 
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-green-50 hover:bg-green-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-green-800' : 'bg-green-100'
                      }`}>
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Mensaje recibido
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          "¡Hola! Me interesa tu proyecto..."
                        </p>
                        <p className="text-xs text-green-600 mt-1">hace 15 min</p>
                      </div>
                    </motion.div>

                    {/* Activity Item 3 */}
                    <motion.div 
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-purple-800' : 'bg-purple-100'
                      }`}>
                        <Star className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Perfil destacado
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          Tu perfil fue visto 24 veces hoy
                        </p>
                        <p className="text-xs text-purple-600 mt-1">hace 1 hora</p>
                      </div>
                    </motion.div>

                    {/* Activity Item 4 */}
                    <motion.div 
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-orange-50 hover:bg-orange-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        isDarkMode ? 'bg-orange-800' : 'bg-orange-100'
                      }`}>
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Evento próximo
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                          Startup Networking Madrid
                        </p>
                        <p className="text-xs text-orange-600 mt-1">mañana 19:00</p>
                      </div>
                    </motion.div>

                    {/* View All Button */}
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver todas las actividades
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
