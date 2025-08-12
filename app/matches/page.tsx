"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMatches, useConnections, type MatchUser } from "@/hooks/useMatches";
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
  Users,
  Sparkles,
  Target,
  Mail,
  Phone,
  Star,
  RefreshCw,
  Settings,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Hooks para matches y conexiones
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    hasMore,
    totalFound,
    totalPotential,
    discoverMatches,
    sendConnectionRequest,
    calculateCompatibility,
    refreshMatches
  } = useMatches();

  const {
    connections,
    connectionRequests,
    loading: connectionsLoading,
    stats: connectionStats,
    fetchConnections,
    fetchConnectionRequests,
    respondToConnection,
    refreshAll: refreshConnections
  } = useConnections();

  // Estados locales
  const [activeTab, setActiveTab] = useState('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMatches, setFilteredMatches] = useState<MatchUser[]>([]);
  const [filteredConnections, setFilteredConnections] = useState(connections);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchUser | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectionType, setConnectionType] = useState('general');
  const [sendingConnection, setSendingConnection] = useState<string | null>(null);

  // Filtros para descubrimiento
  const [filters, setFilters] = useState({
    min_compatibility: 40,
    industry: '',
    location: '',
    connection_type: '',
    limit: 20
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchConnectionRequests();
    }
  }, [user]); // Solo depende de user, no de las funciones

  // Filter matches based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMatches(matches);
      return;
    }

    const filtered = matches.filter(match =>
      match.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredMatches(filtered);
  }, [matches, searchTerm]);

  // Filter connections based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredConnections(connections);
      return;
    }

    const filtered = connections.filter(conn =>
      conn.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredConnections(filtered);
  }, [connections, searchTerm]);

  const handleSendConnection = async (match: MatchUser, message: string = '', type: string = 'general') => {
    if (!match.matched_user_id) return;
    
    setSendingConnection(match.matched_user_id);
    
    try {
      const result = await sendConnectionRequest(match.matched_user_id, type, message);
      
      if (result.success) {
        toast({
          title: "¡Solicitud enviada!",
          description: `Tu solicitud de conexión ha sido enviada a ${match.first_name || match.username}.`,
        });
        setSelectedMatch(null);
        setConnectionMessage('');
      } else {
        toast({
          title: "Error al enviar solicitud",
          description: result.error || "Hubo un problema al enviar la solicitud.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado al enviar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setSendingConnection(null);
    }
  };

  const handleRespondConnection = async (connectionId: string, response: 'accepted' | 'rejected') => {
    try {
      const result = await respondToConnection(connectionId, response);
      
      if (result.success) {
        toast({
          title: response === 'accepted' ? "¡Conexión aceptada!" : "Conexión rechazada",
          description: response === 'accepted' 
            ? "Ahora pueden comenzar a conversar." 
            : "La solicitud ha sido rechazada.",
        });
        
        // Refresh both connections and requests
        await refreshConnections();
      } else {
        toast({
          title: "Error",
          description: result.error || "Hubo un problema al procesar la respuesta.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error inesperado al procesar la respuesta.",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = () => {
    discoverMatches(filters);
    setShowFilters(false);
  };

  const handleStartConversation = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-slate-600';
  };

  const getCompatibilityBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-slate-100';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
                Matches & Conexiones
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshMatches();
                  refreshConnections();
                }}
                disabled={matchesLoading || connectionsLoading}
                className="border-slate-200"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${(matchesLoading || connectionsLoading) ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Link href="/explore">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  <Target className="h-4 w-4 mr-2" />
                  Descubrir más
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar personas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover" className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Descubrir ({totalFound})
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Conexiones ({connectionStats.total_accepted})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Solicitudes ({connectionStats.pending_received})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Enviadas ({connectionStats.pending_sent})
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{totalFound}</div>
                    <div className="text-sm text-slate-500">Matches encontrados</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{totalPotential}</div>
                    <div className="text-sm text-slate-500">Potenciales</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      {Math.round((totalFound / Math.max(totalPotential, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-slate-500">Compatibilidad</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">{connectionStats.weekly_new}</div>
                    <div className="text-sm text-slate-500">Esta semana</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Mostrando {filteredMatches.length} de {totalFound} matches compatibles
                </p>
                
                <Dialog open={showFilters} onOpenChange={setShowFilters}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-200">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filtros de búsqueda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Compatibilidad mínima: {filters.min_compatibility}%</Label>
                        <Slider
                          value={[filters.min_compatibility]}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, min_compatibility: value[0] }))}
                          max={100}
                          min={0}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="industry">Industria</Label>
                        <Input
                          id="industry"
                          value={filters.industry}
                          onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Ej: Tecnología, Fintech..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                          id="location"
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Ej: México, España..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="limit">Límite de resultados</Label>
                        <Select value={filters.limit.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 resultados</SelectItem>
                            <SelectItem value="20">20 resultados</SelectItem>
                            <SelectItem value="50">50 resultados</SelectItem>
                            <SelectItem value="100">100 resultados</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-2 pt-4">
                        <Button onClick={handleApplyFilters} className="flex-1">
                          Aplicar filtros
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setFilters({
                            min_compatibility: 40,
                            industry: '',
                            location: '',
                            connection_type: '',
                            limit: 20
                          })}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Matches Grid */}
              {matchesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-16 w-16 bg-slate-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredMatches.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No hay matches disponibles</h3>
                    <p className="text-slate-500 mb-4">
                      Ajusta tus filtros o explora más perfiles para encontrar conexiones compatibles
                    </p>
                    <Button onClick={() => discoverMatches()} className="bg-slate-900 hover:bg-slate-800 text-white">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Buscar matches
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredMatches.map((match, index) => (
                      <motion.div
                        key={match.matched_user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-slate-300">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start space-x-3">
                                <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    {match.first_name?.[0]}{match.last_name?.[0]}
                                  </div>
                                  {match.is_online && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900 mb-1">
                                    {match.first_name} {match.last_name}
                                  </h3>
                                  <p className="text-sm text-slate-600">@{match.username}</p>
                                </div>
                              </div>
                              
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityBg(match.compatibility_score)} ${getCompatibilityColor(match.compatibility_score)}`}>
                                {match.compatibility_score}% match
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <p className="text-sm text-slate-700">
                                <strong>{match.role}</strong> en {match.company}
                              </p>
                              <p className="text-sm text-slate-500">{match.location}</p>
                              {match.bio && (
                                <p className="text-sm text-slate-600 line-clamp-2">{match.bio}</p>
                              )}
                            </div>

                            {/* Match reasons */}
                            {match.match_reasons && match.match_reasons.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {match.match_reasons.slice(0, 2).map((reason, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs border-slate-300">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Common skills */}
                            {match.common_skills > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-slate-500 mb-2">
                                  {match.common_skills} habilidades en común
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {match.common_skills_details?.slice(0, 3).map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {skill.skill_name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                                    onClick={() => setSelectedMatch(match)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Conectar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Conectar con {match.first_name} {match.last_name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="connectionType">Tipo de conexión</Label>
                                      <Select value={connectionType} onValueChange={setConnectionType}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="general">General</SelectItem>
                                          <SelectItem value="business">Negocios</SelectItem>
                                          <SelectItem value="mentor">Mentoría</SelectItem>
                                          <SelectItem value="investor">Inversión</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor="message">Mensaje (opcional)</Label>
                                      <Textarea
                                        id="message"
                                        value={connectionMessage}
                                        onChange={(e) => setConnectionMessage(e.target.value)}
                                        placeholder="Escribe un mensaje personalizado..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex space-x-2">
                                      <Button 
                                        onClick={() => handleSendConnection(match, connectionMessage, connectionType)}
                                        disabled={sendingConnection === match.matched_user_id}
                                        className="flex-1"
                                      >
                                        {sendingConnection === match.matched_user_id ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Enviando...
                                          </>
                                        ) : (
                                          <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Enviar solicitud
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => router.push(`/profile/${match.matched_user_id}`)}
                                className="border-slate-200"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <div className="space-y-6">
              {connectionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredConnections.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tienes conexiones aún</h3>
                    <p className="text-slate-500 mb-4">
                      Explora perfiles y conecta con otros emprendedores para construir tu red
                    </p>
                    <Link href="/explore">
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                        <Target className="h-4 w-4 mr-2" />
                        Explorar perfiles
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredConnections.map((connection) => (
                    <Card key={connection.connection_id} className="hover:shadow-md transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {connection.first_name?.[0]}{connection.last_name?.[0]}
                              </div>
                              {connection.is_online && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 mb-1">
                                {connection.first_name} {connection.last_name}
                              </h3>
                              <p className="text-sm text-slate-600 mb-1">
                                {connection.role} • {connection.company}
                              </p>
                              <div className="flex items-center text-xs text-slate-500 space-x-2">
                                <span>Conectados {formatDate(connection.connected_at)}</span>
                                {connection.last_message && (
                                  <>
                                    <span>•</span>
                                    <span>Último mensaje: {formatDate(connection.last_message_at || connection.connected_at)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleStartConversation(connection.connected_user_id)}
                              className="bg-slate-900 hover:bg-slate-800 text-white"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chatear
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="border-slate-200 p-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => router.push(`/profile/${connection.connected_user_id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Agendar reunión
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Connection Requests Tab */}
          <TabsContent value="requests">
            <div className="space-y-6">
              {connectionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : connectionRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tienes solicitudes pendientes</h3>
                    <p className="text-slate-500">Las nuevas solicitudes de conexión aparecerán aquí</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {connectionRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-amber-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {request.requester.first_name?.[0]}{request.requester.last_name?.[0]}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 mb-1">
                                {request.requester.first_name} {request.requester.last_name}
                              </h3>
                              <p className="text-sm text-slate-600 mb-1">
                                {request.requester.role} • {request.requester.company}
                              </p>
                              <p className="text-xs text-slate-500 mb-2">
                                Solicitud enviada {formatDate(request.created_at)}
                              </p>
                              {request.message && (
                                <div className="bg-slate-50 p-3 rounded-lg mt-2">
                                  <p className="text-sm text-slate-700">"{request.message}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondConnection(request.id, 'accepted')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceptar
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondConnection(request.id, 'rejected')}
                              className="border-slate-200 text-slate-600 hover:text-slate-800"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent">
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Solicitudes enviadas</h3>
                <p className="text-slate-500">
                  Aquí verás el estado de las solicitudes que has enviado
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
