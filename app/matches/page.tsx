"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  MessageCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  Calendar,
  Eye,
  Trash2,
  Heart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos para matches
interface Match {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  company: string;
  location: string;
  status: 'pending' | 'accepted' | 'connected' | 'declined';
  matchDate: string;
  lastActivity: string;
  mutualConnections: number;
  skills: string[];
  isOnline: boolean;
  hasUnreadMessages?: boolean;
  connectionStrength: number; // 1-100
}

// API para obtener matches reales del usuario
async function fetchUserMatches(userId: string) {
  try {
    const response = await fetch(`/api/mutual-matches?userId=${userId}&status=active`);
    if (!response.ok) {
      throw new Error('Error fetching matches');
    }
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return [];
  }
}

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'connected' | 'pending' | 'accepted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch real matches from API
  useEffect(() => {
    async function loadMatches() {
      if (!user?.id) return;
      
      setIsLoadingMatches(true);
      try {
        const realMatches = await fetchUserMatches(user.id);
        
        // Convertir datos de la API al formato esperado por el componente
        const formattedMatches = realMatches.map((match: any) => ({
          id: match.match_id,
          userId: match.other_user.id,
          name: `${match.other_user.first_name || ''} ${match.other_user.last_name || ''}`.trim() || match.other_user.username,
          username: match.other_user.username,
          avatar: `${match.other_user.first_name?.[0] || ''}${match.other_user.last_name?.[0] || ''}` || match.other_user.username?.[0]?.toUpperCase() || 'U',
          title: match.other_user.role || 'Usuario',
          company: match.other_user.company || 'Sin empresa',
          location: match.other_user.location || 'Ubicación no especificada',
          status: match.match_status === 'active' ? 'connected' : 'pending',
          matchDate: match.matched_at,
          lastActivity: match.matched_at,
          mutualConnections: 0, // No disponible en API actual
          skills: [], // Habría que hacer query adicional para obtener skills
          isOnline: false, // No disponible en API actual
          hasUnreadMessages: false, // Habría que hacer query adicional
          connectionStrength: match.compatibility_score || 0
        }));

        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error loading matches:', error);
        setMatches([]);
      } finally {
        setIsLoadingMatches(false);
      }
    }

    loadMatches();
  }, [user]);

  // Filter and search logic
  useEffect(() => {
    let filtered = matches;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(match => match.status === activeFilter);
    }
    
    // Search by name or company
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredMatches(filtered);
  }, [matches, activeFilter, searchTerm]);

  const getStatusConfig = (status: Match['status']) => {
    switch (status) {
      case 'connected':
        return {
          label: 'Conectado',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: CheckCircle
        };
      case 'accepted':
        return {
          label: 'Aceptado',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: UserCheck
        };
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: Clock
        };
      case 'declined':
        return {
          label: 'Rechazado',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: XCircle
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleStartConversation = (match: Match) => {
    router.push(`/messages?user=${match.userId}`);
  };

  if (loading || isLoadingMatches) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando tus matches...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    total: matches.length,
    connected: matches.filter(m => m.status === 'connected').length,
    pending: matches.filter(m => m.status === 'pending').length,
    accepted: matches.filter(m => m.status === 'accepted').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-slate-300">|</div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-slate-600" />
                Mis Conexiones
              </h1>
            </div>

            <Link href="/explore">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Encontrar más personas
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, empresa o username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className={activeFilter === 'all' ? 'bg-slate-900 text-white' : 'border-slate-200'}
              >
                Todos ({stats.total})
              </Button>
              <Button
                variant={activeFilter === 'connected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('connected')}
                className={activeFilter === 'connected' ? 'bg-emerald-600 text-white' : 'border-slate-200'}
              >
                Conectados ({stats.connected})
              </Button>
              <Button
                variant={activeFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('pending')}
                className={activeFilter === 'pending' ? 'bg-amber-600 text-white' : 'border-slate-200'}
              >
                Pendientes ({stats.pending})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-700 mb-1">{stats.total}</div>
              <div className="text-sm text-slate-500">Total Matches</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.connected}</div>
              <div className="text-sm text-slate-500">Conectados</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">{stats.pending}</div>
              <div className="text-sm text-slate-500">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {matches.filter(m => m.hasUnreadMessages).length}
              </div>
              <div className="text-sm text-slate-500">Sin Leer</div>
            </CardContent>
          </Card>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm ? 'No se encontraron matches' : 'No tienes matches'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm 
                    ? 'Intenta buscar con otros términos'
                    : 'Explora perfiles y conecta con otros emprendedores para generar matches'
                  }
                </p>
                {!searchTerm && (
                  <Link href="/explore">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Explorar Perfiles
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredMatches.map((match, index) => {
                const statusConfig = getStatusConfig(match.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Left: Avatar and Info */}
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                                {match.avatar}
                              </div>
                              {match.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                              )}
                              {match.hasUnreadMessages && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{match.name}</h3>
                                <span className="text-slate-400">@{match.username}</span>
                                {match.status === 'connected' && (
                                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                                )}
                              </div>
                              
                              <p className="text-slate-600 mb-2">{match.title} • {match.company}</p>
                              <p className="text-sm text-slate-500 mb-3">{match.location}</p>
                              
                              {/* Skills */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {match.skills.slice(0, 3).map((skill, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs border-slate-300 text-slate-700"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {match.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
                                    +{match.skills.length - 3}
                                  </Badge>
                                )}
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <span>Match: {formatDate(match.matchDate)}</span>
                                <span>•</span>
                                <span>{match.mutualConnections} conexiones mutuas</span>
                                <span>•</span>
                                <span>{match.connectionStrength}% compatibilidad</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Status and Actions */}
                          <div className="flex flex-col items-end space-y-3">
                            <Badge className={`${statusConfig.color} border`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>

                            <div className="flex items-center space-x-2">
                              {match.status === 'connected' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartConversation(match)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white"
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Chatear
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/profile/${match.userId}`)}
                                className="border-slate-200"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver perfil
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="border-slate-200 p-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Agendar reunión
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar match
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
