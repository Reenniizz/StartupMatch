"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter, 
  Heart, 
  X, 
  MapPin, 
  Building, 
  Star,
  Eye,
  UserPlus,
  TrendingUp,
  MessageCircle,
  Shield,
  ArrowLeft
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Types
interface UserProfile {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  bio: string;
  skills: string[];
  experience_years: number;
  avatar_url?: string;
  compatibility_score?: number;
  last_active?: string;
}

interface MatchFilters {
  industry: string;
  experience: string;
  location: string;
  sortBy: string;
}

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading_matches, setLoadingMatches] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({
    industry: "all",
    experience: "all", 
    location: "all",
    sortBy: "compatibility"
  });

  // API para obtener usuarios reales del sistema
  async function fetchRealUsers() {
    try {
      if (!user?.id) return [];
      
      console.log('=== EXPLORE DEBUG ===');
      console.log('Usuario actual logueado:', user.id);
      console.log('Email actual:', user.email);
      
      // Primero intentar con API de matches (usuarios con perfiles completos)
      const matchResponse = await fetch(`/api/matches?userId=${user.id}&limit=20`);
      const matchData = await matchResponse.json();
      
      console.log('Respuesta de matches API:', matchData);
      
      if (matchData.matches && matchData.matches.length > 0) {
        console.log('Encontrados matches:', matchData.matches.length);
        console.log('IDs de matches:', matchData.matches.map((m: any) => m.id));
        return matchData.matches;
      }
      
      // Si no hay matches, usar API de usuarios básicos
      console.log('No hay matches, intentando API de usuarios...');
      console.log('URL llamada:', `/api/users?excludeUserId=${user.id}&limit=20`);
      const usersResponse = await fetch(`/api/users?excludeUserId=${user.id}&limit=20`);
      const usersData = await usersResponse.json();
      
      console.log('Respuesta de users API:', usersData);
      console.log('Usuarios retornados:', usersData.users?.length || 0);
      console.log('IDs de usuarios:', usersData.users?.map((u: any) => u.id) || []);
      
      return usersData.users || [];
    } catch (error) {
      console.error('Error fetching real users:', error);
      return [];
    }
  }

  // Filter options
  const industries = ["all", "Tecnología", "Fintech", "Salud", "Educación", "E-commerce"];
  const experienceLevels = ["all", "0-2 años", "3-5 años", "6-10 años", "10+ años"];
  const sortOptions = [
    { value: "compatibility", label: "Compatibilidad" },
    { value: "newest", label: "Más nuevos" },
    { value: "active", label: "Más activos" }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load matches
  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user, filters]);

  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      // Obtener usuarios reales de la API
      const realUsers = await fetchRealUsers();
      
      // Convertir datos de la API al formato esperado por el componente
      const formattedUsers = realUsers.map((apiUser: any) => ({
        id: apiUser.id,
        name: `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim() || apiUser.username,
        role: apiUser.role || 'Usuario',
        company: apiUser.company || 'Sin empresa',
        industry: apiUser.industry || 'No especificada',
        location: apiUser.location || 'Ubicación no especificada',
        bio: apiUser.bio || 'Sin descripción disponible',
        skills: [], // Habría que hacer query adicional para obtener skills
        experience_years: 0, // No disponible en API actual
        compatibility_score: apiUser.compatibility_score || 0,
        last_active: 'No disponible'
      }));

      setMatches(formattedUsers);
    } catch (error) {
      console.error("Error loading matches:", error);
      setMatches([]);
      // No mostrar toast de error si simplemente no hay usuarios disponibles
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleConnect = async (profileId: string) => {
    try {
      console.log('🚀 Enviando solicitud de conexión desde /explore a usuario:', profileId);
      
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresseeId: profileId,
          connectionType: 'general',
          message: '¡Hola! Me gustaría conectar contigo a través de StartupMatch.'
        })
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      let data;
      try {
        data = await response.json();
        console.log('📦 Datos recibidos:', data);
      } catch (jsonError) {
        console.error('❌ Error parseando JSON:', jsonError);
        console.log('📄 Response text:', await response.text());
        throw new Error('Respuesta del servidor no válida');
      }

      if (response.ok) {
        toast({
          title: "¡Solicitud enviada!",
          description: "Tu solicitud de conexión ha sido enviada. El usuario la verá en su sección de Matches.",
        });
        
        // Remove from current matches
        setMatches(prev => prev.filter(match => match.id !== profileId));
      } else {
        toast({
          title: "Error al conectar",
          description: data.error || "No se pudo enviar la solicitud de conexión",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending connection:', error);
      toast({
        title: "Error",
        description: "Error de conexión al enviar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handlePass = async (profileId: string) => {
    try {
      // Remove from current matches
      setMatches(prev => prev.filter(match => match.id !== profileId));
    } catch (error) {
      console.error("Error passing profile:", error);
    }
  };

  // Filter matches based on search and filters
  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = filters.industry === "all" || match.industry === filters.industry;
    
    const matchesExperience = filters.experience === "all" || 
                             (filters.experience === "0-2 años" && match.experience_years <= 2) ||
                             (filters.experience === "3-5 años" && match.experience_years >= 3 && match.experience_years <= 5) ||
                             (filters.experience === "6-10 años" && match.experience_years >= 6 && match.experience_years <= 10) ||
                             (filters.experience === "10+ años" && match.experience_years > 10);
    
    return matchesSearch && matchesIndustry && matchesExperience;
  });

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (filters.sortBy) {
      case "compatibility":
        return (b.compatibility_score || 0) - (a.compatibility_score || 0);
      case "newest":
        return new Date(b.last_active || "").getTime() - new Date(a.last_active || "").getTime();
      case "active":
        return new Date(b.last_active || "").getTime() - new Date(a.last_active || "").getTime();
      default:
        return 0;
    }
  });

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Explorar</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-4">
              <span>{sortedMatches.length} perfiles encontrados</span>
              <span>•</span>
              <span>Conectado como: <strong>{user?.email || 'Usuario'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, rol o empresa..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Industry Filter */}
              <Select 
                value={filters.industry} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Industria" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry === "all" ? "Todas" : industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Experience Filter */}
              <Select 
                value={filters.experience} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, experience: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Experiencia" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((exp) => (
                    <SelectItem key={exp} value={exp}>
                      {exp === "all" ? "Todas" : exp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading_matches ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedMatches.map((match) => (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={match.avatar_url} />
                            <AvatarFallback>
                              {match.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{match.name}</h3>
                            <p className="text-sm text-gray-600">{match.role}</p>
                            <p className="text-xs text-gray-500">{match.company}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {match.compatibility_score}% Match
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="h-4 w-4 mr-2" />
                          {match.industry}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {match.location}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{match.bio}</p>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {match.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePass(match.id)}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Pasar
                        </Button>
                        <Button
                          onClick={() => setSelectedProfile(match)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleConnect(match.id)}
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Conectar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron perfiles' : 'Todavía no hay usuarios'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Intenta ajustar tus filtros o términos de búsqueda'
                  : 'Sé el primero en formar parte de StartupMatch. Invita a otros emprendedores a unirse a la plataforma'
                }
              </p>
              {searchTerm ? (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      industry: "all",
                      experience: "all",
                      location: "all", 
                      sortBy: "compatibility"
                    });
                  }}
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/profile')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Completar mi perfil
                  </Button>
                  <p className="text-xs text-gray-400">
                    Completa tu perfil para ser visible cuando lleguen más usuarios
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile Detail Modal */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProfile && (
            <div>
              <DialogHeader>
                <DialogTitle>Perfil de {selectedProfile.name}</DialogTitle>
              </DialogHeader>
              
              <div className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedProfile.avatar_url} />
                    <AvatarFallback>
                      {selectedProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedProfile.name}</h2>
                    <p className="text-gray-600">{selectedProfile.role} en {selectedProfile.company}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        {selectedProfile.compatibility_score}% Compatible
                      </Badge>
                      <span className="text-sm text-gray-500">{selectedProfile.last_active}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="font-semibold mb-2">Sobre mí</h3>
                  <p className="text-gray-700">{selectedProfile.bio}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Industria</h4>
                    <p>{selectedProfile.industry}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Ubicación</h4>
                    <p>{selectedProfile.location}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Experiencia</h4>
                    <p>{selectedProfile.experience_years} años</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-3">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handlePass(selectedProfile.id);
                      setSelectedProfile(null);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Pasar
                  </Button>
                  <Button
                    onClick={() => {
                      handleConnect(selectedProfile.id);
                      setSelectedProfile(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}