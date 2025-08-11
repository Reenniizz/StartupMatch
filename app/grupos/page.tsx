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
  Calendar,
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

// Tipos de datos para grupos
interface GroupMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  messagesCount: number;
  isPrivate: boolean;
  coverImage: string;
  lastActivity: string;
  tags: string[];
  recentMembers: GroupMember[];
  isMember: boolean;
  isVerified: boolean;
  location?: string;
  nextEvent?: {
    title: string;
    date: string;
  };
}

// Mock data para grupos
const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Fundadores FinTech México',
    description: 'Comunidad de fundadores y emprendedores en el sector financiero. Compartimos experiencias, oportunidades y recursos para hacer crecer nuestras startups.',
    category: 'Industria',
    memberCount: 127,
    messagesCount: 2341,
    isPrivate: false,
    coverImage: 'fintech',
    lastActivity: '2 min',
    tags: ['FinTech', 'Funding', 'Banking', 'Crypto'],
    recentMembers: [
      { id: '1', name: 'María G.', role: 'CEO', avatar: 'MG', isOnline: true },
      { id: '2', name: 'Carlos R.', role: 'CTO', avatar: 'CR', isOnline: false },
      { id: '3', name: 'Ana M.', role: 'CFO', avatar: 'AM', isOnline: true }
    ],
    isMember: true,
    isVerified: true,
    location: 'CDMX',
    nextEvent: {
      title: 'Demo Day FinTech',
      date: 'Vie 15 Ago'
    }
  },
  {
    id: '2',
    name: 'AI Developers Network',
    description: 'Red de desarrolladores especializados en inteligencia artificial y machine learning. Discutimos nuevas tecnologías, compartimos proyectos y colaboramos.',
    category: 'Tecnología',
    memberCount: 234,
    messagesCount: 4567,
    isPrivate: false,
    coverImage: 'ai',
    lastActivity: '15 min',
    tags: ['AI', 'ML', 'Python', 'TensorFlow'],
    recentMembers: [
      { id: '4', name: 'Luis P.', role: 'ML Engineer', avatar: 'LP', isOnline: true },
      { id: '5', name: 'Sofia V.', role: 'Data Scientist', avatar: 'SV', isOnline: true },
      { id: '6', name: 'Diego M.', role: 'AI Researcher', avatar: 'DM', isOnline: false }
    ],
    isMember: false,
    isVerified: true
  },
  {
    id: '3',
    name: 'Startups Pre-Seed',
    description: 'Espacio para emprendedores en etapa temprana. Aquí compartimos recursos sobre validación de ideas, primeros clientes y preparación para funding.',
    category: 'Stage',
    memberCount: 89,
    messagesCount: 1234,
    isPrivate: false,
    coverImage: 'preseed',
    lastActivity: '1 hr',
    tags: ['Pre-Seed', 'MVP', 'Validation', 'Customer Development'],
    recentMembers: [
      { id: '7', name: 'Roberto S.', role: 'Founder', avatar: 'RS', isOnline: false },
      { id: '8', name: 'Carmen L.', role: 'Co-founder', avatar: 'CL', isOnline: true }
    ],
    isMember: true,
    isVerified: false
  },
  {
    id: '4',
    name: 'Women in Tech MX',
    description: 'Comunidad de mujeres líderes en tecnología y emprendimiento. Creamos un espacio seguro para el networking, mentoring y crecimiento profesional.',
    category: 'Comunidad',
    memberCount: 156,
    messagesCount: 3421,
    isPrivate: true,
    coverImage: 'women',
    lastActivity: '30 min',
    tags: ['Women', 'Leadership', 'Tech', 'Mentoring'],
    recentMembers: [
      { id: '9', name: 'Patricia H.', role: 'CTO', avatar: 'PH', isOnline: true },
      { id: '10', name: 'Isabella R.', role: 'Product Manager', avatar: 'IR', isOnline: true }
    ],
    isMember: false,
    isVerified: true,
    nextEvent: {
      title: 'Networking Breakfast',
      date: 'Mié 20 Ago'
    }
  },
  {
    id: '5',
    name: 'Guadalajara Entrepreneurs',
    description: 'Hub de emprendedores en Guadalajara. Organizamos meetups, compartimos oportunidades locales y conectamos el ecosistema tapatío.',
    category: 'Ubicación',
    memberCount: 203,
    messagesCount: 5678,
    isPrivate: false,
    coverImage: 'gdl',
    lastActivity: '5 min',
    tags: ['Guadalajara', 'Networking', 'Meetups', 'Local'],
    recentMembers: [
      { id: '11', name: 'Fernando G.', role: 'Startup Advisor', avatar: 'FG', isOnline: true },
      { id: '12', name: 'Valeria C.', role: 'Investor', avatar: 'VC', isOnline: false }
    ],
    isMember: false,
    isVerified: true,
    location: 'GDL'
  },
  {
    id: '6',
    name: 'Angel Investors Circle',
    description: 'Red privada de angel investors. Compartimos deal flow, co-invertimos y brindamos mentoría a startups en etapas tempranas.',
    category: 'Inversión',
    memberCount: 42,
    messagesCount: 892,
    isPrivate: true,
    coverImage: 'investors',
    lastActivity: '3 hr',
    tags: ['Angel Investment', 'Deal Flow', 'Due Diligence', 'Mentoring'],
    recentMembers: [
      { id: '13', name: 'Miguel A.', role: 'Angel Investor', avatar: 'MA', isOnline: false },
      { id: '14', name: 'Claudia F.', role: 'VC Partner', avatar: 'CF', isOnline: true }
    ],
    isMember: false,
    isVerified: true
  }
];

const categories = [
  { name: 'Todos', count: mockGroups.length, icon: Globe },
  { name: 'Industria', count: 4, icon: Briefcase },
  { name: 'Tecnología', count: 6, icon: Code },
  { name: 'Stage', count: 3, icon: TrendingUp },
  { name: 'Ubicación', count: 5, icon: MapPin },
  { name: 'Comunidad', count: 2, icon: Users },
  { name: 'Inversión', count: 2, icon: DollarSign }
];

export default function GruposPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [groups, setGroups] = useState(mockGroups);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const filteredGroups = groups.filter(group => {
    const matchesCategory = selectedCategory === 'Todos' || group.category === selectedCategory;
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCoverGradient = (coverImage: string) => {
    const gradients = {
      fintech: 'from-emerald-500 to-teal-600',
      ai: 'from-purple-500 to-indigo-600',
      preseed: 'from-orange-500 to-red-600',
      women: 'from-pink-500 to-rose-600',
      gdl: 'from-blue-500 to-cyan-600',
      investors: 'from-slate-600 to-gray-700'
    };
    return gradients[coverImage as keyof typeof gradients] || 'from-slate-500 to-gray-600';
  };

  const joinGroup = (groupId: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isMember: true, memberCount: group.memberCount + 1 }
          : group
      )
    );
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
              <Button className="bg-slate-900 hover:bg-slate-800">
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
                          {category.name === 'Todos' ? mockGroups.length : category.count}
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

            {/* Groups Grid */}
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
                    <div className={`h-32 bg-gradient-to-br ${getCoverGradient(group.coverImage)} relative`}>
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
                          {group.recentMembers.slice(0, 3).map((member, idx) => (
                            <div
                              key={member.id}
                              className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 border-2 border-white"
                              style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
                            >
                              {member.avatar}
                            </div>
                          ))}
                          {group.recentMembers.length > 3 && (
                            <div className="w-8 h-8 bg-white/70 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white -ml-2">
                              +{group.recentMembers.length - 3}
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
                            {group.messagesCount > 1000 ? `${Math.floor(group.messagesCount / 1000)}k` : group.messagesCount}
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

                      {/* Next Event */}
                      {group.nextEvent && (
                        <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-blue-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            <div>
                              <div className="text-xs font-medium">{group.nextEvent.title}</div>
                              <div className="text-xs">{group.nextEvent.date}</div>
                            </div>
                          </div>
                        </div>
                      )}

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
                        <Button size="sm" variant="outline" className="border-slate-300">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No se encontraron grupos</h3>
                <p className="text-slate-500 mb-6">
                  Intenta cambiar los filtros o crear un nuevo grupo
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Grupo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
