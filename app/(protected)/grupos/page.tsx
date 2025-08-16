"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Users,
  MessageSquare,
  MapPin,
  Search,
  Filter,
  Plus,
  Star,
  Clock,
  Briefcase,
  Code,
  DollarSign,
  Globe,
  Target,
  TrendingUp,
  Lock,
  CheckCircle,
  Eye,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CreateGroupModal from "@/components/dashboard/CreateGroupModal";
import GroupDetailsModal from "@/components/dashboard/GroupDetailsModal";

// Tipos de datos para grupos
interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  messagesCount?: number;
  isPrivate: boolean;
  lastActivity: string;
  tags: string[];
  isMember: boolean;
  isVerified?: boolean;
  location?: string;
}

export default function GruposPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  // Calcular conteos dinámicos de categorías
  const getDynamicCategories = () => {
    const categoryCounts = groups.reduce((acc, group) => {
      acc[group.category] = (acc[group.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Todos', count: groups.length, icon: Globe },
      { name: 'Industria', count: categoryCounts['Industria'] || 0, icon: Briefcase },
      { name: 'Tecnología', count: categoryCounts['Tecnología'] || 0, icon: Code },
      { name: 'Stage', count: categoryCounts['Stage'] || 0, icon: TrendingUp },
      { name: 'Ubicación', count: categoryCounts['Ubicación'] || 0, icon: MapPin },
      { name: 'Comunidad', count: categoryCounts['Comunidad'] || 0, icon: Users },
      { name: 'Inversión', count: categoryCounts['Inversión'] || 0, icon: DollarSign }
    ];
  };

  const categories = getDynamicCategories();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Función para cargar grupos desde la API
  const loadGroups = async () => {
    if (!user) return;
    
    setIsLoadingGroups(true);
    try {
      // Usar la nueva API de descubrimiento que muestra grupos públicos + grupos del usuario
      const response = await fetch('/api/groups/discover');
      if (response.ok) {
        const groupsData = await response.json();
        // Los datos ya vienen en el formato correcto desde la nueva API
        setGroups(groupsData);
      } else {
        console.error('Error loading groups:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Cargar grupos al montar el componente
  useEffect(() => {
    if (user && !loading) {
      loadGroups();
    }
  }, [user, loading]);

  // Función para manejar cuando se crea un nuevo grupo
  const handleGroupCreated = () => {
    loadGroups(); // Recargar la lista de grupos
  };

  // Función para ver detalles del grupo
  const viewGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  // Función para cerrar detalles del grupo
  const closeGroupDetails = () => {
    setSelectedGroup(null);
    setShowGroupDetails(false);
  };

  // Función para unirse a un grupo
  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        // Recargar grupos para mostrar el estado actualizado
        loadGroups();
      } else {
        const errorData = await response.json();
        console.error('Error joining group:', errorData.error);
        // TODO: Mostrar notificación de error al usuario
      }
    } catch (error) {
      console.error('Error joining group:', error);
      // TODO: Mostrar notificación de error al usuario
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesCategory = selectedCategory === 'Todos' || group.category === selectedCategory;
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCoverGradient = (category: string, groupName?: string) => {
    // Gradientes basados en categoría
    const categoryGradients = {
      'Industria': 'from-emerald-500 to-teal-600',
      'Tecnología': 'from-purple-500 to-indigo-600', 
      'Stage': 'from-orange-500 to-red-600',
      'Inversión': 'from-green-500 to-emerald-600',
      'Ubicación': 'from-blue-500 to-cyan-600',
      'Comunidad': 'from-pink-500 to-rose-600'
    };

    // Usar gradiente de categoría si existe
    if (categoryGradients[category as keyof typeof categoryGradients]) {
      return categoryGradients[category as keyof typeof categoryGradients];
    }

    // Gradiente por defecto basado en el hash del nombre del grupo
    if (groupName) {
      const hash = groupName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const gradients = [
        'from-slate-500 to-gray-600',
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-yellow-500 to-orange-600',
        'from-red-500 to-pink-600'
      ];
      
      return gradients[Math.abs(hash) % gradients.length];
    }

    return 'from-slate-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                Grupos de Networking
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Grupo
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar grupos por nombre, descripción o tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-slate-400"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <Card className="border-slate-200 sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900">Categorías</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          selectedCategory === category.name
                            ? 'bg-slate-100 text-slate-900 border-r-2 border-slate-900'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-3" />
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-300 text-slate-600">
                          {category.count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Groups Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedCategory === 'Todos' ? 'Todos los Grupos' : `Grupos de ${selectedCategory}`}
                </h2>
                <p className="text-slate-600 mt-1">
                  {filteredGroups.length} grupos encontrados
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingGroups ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Card key={n} className="border-slate-200 overflow-hidden">
                    <div className="h-32 bg-slate-200 animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                        <div className="flex space-x-2">
                          <div className="h-6 bg-slate-200 rounded animate-pulse w-16"></div>
                          <div className="h-6 bg-slate-200 rounded animate-pulse w-16"></div>
                        </div>
                        <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Groups Grid */
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-slate-200 hover:shadow-lg transition-all duration-200 group cursor-pointer overflow-hidden">
                    {/* Cover Image */}
                    <div className={`h-32 bg-gradient-to-br ${getCoverGradient(group.category, group.name)} relative`}>
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        {group.isVerified && (
                          <Badge className="bg-white/20 text-white border-white/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        {group.isPrivate && (
                          <div className="p-1 bg-white/20 rounded-full">
                            <Lock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-center space-x-2">
                          {/* Mostrar iniciales del grupo como placeholder de avatar */}
                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 border-2 border-white">
                            {group.name.substring(0, 2).toUpperCase()}
                          </div>
                          {/* Mostrar contador de miembros si hay más de 1 */}
                          {group.memberCount > 1 && (
                            <div className="w-8 h-8 bg-white/70 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white -ml-2">
                              +{group.memberCount - 1}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {/* Group Header */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {group.memberCount}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {group.messagesCount ? (group.messagesCount > 1000 ? `${Math.floor(group.messagesCount / 1000)}k` : group.messagesCount) : 0}
                          </div>
                        </div>
                        <div className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {group.lastActivity}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {group.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-slate-300 text-slate-600">
                            {tag}
                          </Badge>
                        ))}
                        {group.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">
                            +{group.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {group.isMember ? (
                          <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Abrir Chat
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-slate-300 hover:bg-slate-50"
                            onClick={() => joinGroup(group.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Unirse
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-slate-300"
                          onClick={() => viewGroupDetails(group)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingGroups && filteredGroups.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  {searchTerm || selectedCategory !== 'Todos' 
                    ? 'No se encontraron grupos' 
                    : 'Aún no hay grupos disponibles'
                  }
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || selectedCategory !== 'Todos'
                    ? 'Prueba con otros términos de búsqueda o categorías'
                    : 'Sé el primero en crear un grupo para tu comunidad'
                  }
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Grupo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear grupo */}
      <CreateGroupModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Modal para ver detalles del grupo */}
      <GroupDetailsModal
        group={selectedGroup}
        isOpen={showGroupDetails}
        onClose={closeGroupDetails}
        onJoinGroup={joinGroup}
      />
    </div>
  );
}
