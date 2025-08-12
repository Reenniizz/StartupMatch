"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Search,
  Filter,
  MapPin,
  Users,
  Building2,
  Award,
  TrendingUp,
  Clock,
  Globe,
  Heart,
  X,
  MessageCircle,
  UserPlus,
  Eye,
  Star,
  Target,
  Briefcase,
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// Tipos para perfiles
interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  company: string;
  location: string;
  bio: string;
  skills: string[];
  objectives: string[];
  experience: 'junior' | 'mid' | 'senior' | 'lead';
  industry: string;
  lookingFor: string[];
  isVerified: boolean;
  isOnline: boolean;
  joinedDate: string;
  compatibility: number;
  mutualConnections: number;
  projects: number;
  isNew: boolean;
  isActive: boolean;
  responseRate: number;
}

// Mock data para exploración
const mockProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Sofía Ramírez',
    username: 'sofiar',
    avatar: 'SR',
    title: 'Senior Product Manager',
    company: 'TechFlow Solutions',
    location: 'Ciudad de México',
    bio: 'Product Manager con 6+ años creando productos digitales que impactan. Especialista en metodologías ágiles y crecimiento de productos B2B.',
    skills: ['Product Management', 'Scrum', 'Data Analytics', 'UX Research'],
    objectives: ['Co-founder', 'Product Lead', 'Startup Advisor'],
    experience: 'senior',
    industry: 'SaaS',
    lookingFor: ['Technical Co-founder', 'Investment'],
    isVerified: true,
    isOnline: true,
    joinedDate: '2024-01-15',
    compatibility: 94,
    mutualConnections: 12,
    projects: 3,
    isNew: false,
    isActive: true,
    responseRate: 98
  },
  {
    id: '2',
    name: 'Carlos Mendoza',
    username: 'carlosm',
    avatar: 'CM',
    title: 'Full Stack Developer',
    company: 'Freelancer',
    location: 'Guadalajara',
    bio: 'Desarrollador full-stack apasionado por crear soluciones innovadoras. 4 años de experiencia en React, Node.js y arquitecturas cloud.',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'PostgreSQL'],
    objectives: ['Technical Co-founder', 'CTO', 'Lead Developer'],
    experience: 'mid',
    industry: 'FinTech',
    lookingFor: ['Co-founder', 'Technical Team', 'Funding'],
    isVerified: false,
    isOnline: false,
    joinedDate: '2024-01-10',
    compatibility: 89,
    mutualConnections: 8,
    projects: 5,
    isNew: true,
    isActive: true,
    responseRate: 92
  },
  {
    id: '3',
    name: 'Dr. Elena Vásquez',
    username: 'elenav',
    avatar: 'EV',
    title: 'Healthcare Innovation Director',
    company: 'MedTech Ventures',
    location: 'Monterrey',
    bio: 'Doctora e innovadora en HealthTech con 10+ años transformando la atención médica a través de la tecnología y datos clínicos.',
    skills: ['Healthcare', 'Data Science', 'Regulatory', 'Innovation'],
    objectives: ['Founder', 'Healthcare Advisor', 'Angel Investor'],
    experience: 'lead',
    industry: 'HealthTech',
    lookingFor: ['Technical Partner', 'Investment Opportunities'],
    isVerified: true,
    isOnline: true,
    joinedDate: '2023-12-20',
    compatibility: 91,
    mutualConnections: 15,
    projects: 2,
    isNew: false,
    isActive: true,
    responseRate: 95
  },
  {
    id: '4',
    name: 'Miguel Torres',
    username: 'miguelt',
    avatar: 'MT',
    title: 'UX/UI Designer',
    company: 'Design Studio Pro',
    location: 'Puebla',
    bio: 'Diseñador UX/UI con ojo para crear experiencias digitales que enamoran. Especializado en design systems y metodologías de diseño centrado en el usuario.',
    skills: ['UI/UX Design', 'Figma', 'Design Systems', 'User Research'],
    objectives: ['Design Lead', 'Co-founder', 'Product Designer'],
    experience: 'mid',
    industry: 'Design',
    lookingFor: ['Product Team', 'Startup Projects'],
    isVerified: false,
    isOnline: true,
    joinedDate: '2024-01-08',
    compatibility: 87,
    mutualConnections: 6,
    projects: 7,
    isNew: true,
    isActive: false,
    responseRate: 88
  },
  {
    id: '5',
    name: 'Andrea López',
    username: 'andreal',
    avatar: 'AL',
    title: 'Marketing Growth Specialist',
    company: 'Growth Hacker MX',
    location: 'Tijuana',
    bio: 'Growth marketer enfocada en startups B2B. Experta en adquisición de usuarios, funnels de conversión y estrategias de retención.',
    skills: ['Growth Marketing', 'SEO', 'PPC', 'Analytics', 'Content'],
    objectives: ['CMO', 'Growth Lead', 'Marketing Partner'],
    experience: 'senior',
    industry: 'Marketing',
    lookingFor: ['Startup to Join', 'Advisory Roles'],
    isVerified: true,
    isOnline: false,
    joinedDate: '2024-01-12',
    compatibility: 85,
    mutualConnections: 10,
    projects: 4,
    isNew: false,
    isActive: true,
    responseRate: 90
  },
  {
    id: '6',
    name: 'Roberto Kim',
    username: 'robertok',
    avatar: 'RK',
    title: 'Data Scientist',
    company: 'AI Innovations Lab',
    location: 'Querétaro',
    bio: 'Científico de datos con PhD en Machine Learning. Especialista en AI aplicada a problemas de negocio complejos y modelos predictivos.',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Statistics', 'Big Data'],
    objectives: ['Chief Data Officer', 'AI Consultant', 'Research Lead'],
    experience: 'senior',
    industry: 'AI/ML',
    lookingFor: ['AI Projects', 'Research Collaborations'],
    isVerified: true,
    isOnline: true,
    joinedDate: '2023-11-30',
    compatibility: 93,
    mutualConnections: 9,
    projects: 6,
    isNew: false,
    isActive: true,
    responseRate: 97
  }
];

const industries = ['Todos', 'SaaS', 'FinTech', 'HealthTech', 'AI/ML', 'E-commerce', 'EdTech', 'CleanTech', 'Marketing', 'Design'];
const experiences = ['Todos', 'Junior', 'Mid', 'Senior', 'Lead'];
const objectives = ['Todos', 'Co-founder', 'CTO', 'CMO', 'Investment', 'Advisory', 'Technical Team'];

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // States
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>(mockProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('Todos');
  const [selectedExperience, setSelectedExperience] = useState('Todos');
  const [selectedObjective, setSelectedObjective] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'compatibility' | 'newest' | 'active'>('compatibility');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Filter and search logic
  useEffect(() => {
    let filtered = profiles;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        profile.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Industry filter
    if (selectedIndustry !== 'Todos') {
      filtered = filtered.filter(profile => profile.industry === selectedIndustry);
    }
    
    // Experience filter
    if (selectedExperience !== 'Todos') {
      filtered = filtered.filter(profile => profile.experience === selectedExperience.toLowerCase());
    }
    
    // Objective filter
    if (selectedObjective !== 'Todos') {
      filtered = filtered.filter(profile => 
        profile.objectives.some(obj => obj.includes(selectedObjective))
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'compatibility':
          return b.compatibility - a.compatibility;
        case 'newest':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        case 'active':
          return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
        default:
          return 0;
      }
    });
    
    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, selectedIndustry, selectedExperience, selectedObjective, sortBy]);

  const handleConnect = (profileId: string) => {
    // Lógica para conectar
    console.log('Connecting with:', profileId);
  };

  const handleMessage = (profileId: string) => {
    router.push(`/messages?user=${profileId}`);
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'junior': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'mid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'senior': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'lead': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getIndustryColor = (industry: string) => {
    const colors = {
      'SaaS': 'bg-blue-50 text-blue-700 border-blue-200',
      'FinTech': 'bg-green-50 text-green-700 border-green-200',
      'HealthTech': 'bg-red-50 text-red-700 border-red-200',
      'AI/ML': 'bg-purple-50 text-purple-700 border-purple-200',
      'E-commerce': 'bg-orange-50 text-orange-700 border-orange-200',
      'EdTech': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'CleanTech': 'bg-teal-50 text-teal-700 border-teal-200',
      'Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
      'Design': 'bg-violet-50 text-violet-700 border-violet-200',
    };
    return colors[industry as keyof typeof colors] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    total: filteredProfiles.length,
    new: filteredProfiles.filter(p => p.isNew).length,
    verified: filteredProfiles.filter(p => p.isVerified).length,
    active: filteredProfiles.filter(p => p.isActive).length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
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
                <Sparkles className="h-6 w-6 mr-2 text-slate-600" />
                Explorar Perfiles
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/matches">
                <Button variant="outline" className="border-slate-200">
                  <Users className="h-4 w-4 mr-2" />
                  Mis Matches
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, skills, empresa, rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-slate-400"
              />
            </div>

            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedExperience} onValueChange={setSelectedExperience}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="Experiencia" />
              </SelectTrigger>
              <SelectContent>
                {experiences.map(exp => (
                  <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatibility">Compatibilidad</SelectItem>
                <SelectItem value="newest">Más nuevos</SelectItem>
                <SelectItem value="active">Más activos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-700 mb-1">{stats.total}</div>
              <div className="text-sm text-slate-500">Perfiles encontrados</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.verified}</div>
              <div className="text-sm text-slate-500">Verificados</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.new}</div>
              <div className="text-sm text-slate-500">Nuevos</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.active}</div>
              <div className="text-sm text-slate-500">Activos</div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No se encontraron perfiles
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Intenta ajustar tus filtros o términos de búsqueda
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedIndustry('Todos');
                      setSelectedExperience('Todos');
                      setSelectedObjective('Todos');
                    }}
                    variant="outline"
                    className="border-slate-200"
                  >
                    Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <AnimatePresence>
              {filteredProfiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-lg group">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                              {profile.avatar}
                            </div>
                            {profile.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                              {profile.isVerified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                              {profile.isNew && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                  Nuevo
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{profile.title}</p>
                            <p className="text-xs text-slate-500">{profile.company} • {profile.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-700">{profile.compatibility}%</div>
                          <div className="text-xs text-slate-500">match</div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-slate-700 mb-4 line-clamp-2">
                        {profile.bio}
                      </p>

                      {/* Tags */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className={`${getIndustryColor(profile.industry)} border text-xs`}>
                            {profile.industry}
                          </Badge>
                          <Badge className={`${getExperienceColor(profile.experience)} border text-xs`}>
                            {profile.experience}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-slate-300 text-slate-600">
                              {skill}
                            </Badge>
                          ))}
                          {profile.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                              +{profile.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                        <span>{profile.mutualConnections} conexiones mutuas</span>
                        <span>{profile.responseRate}% respuesta</span>
                        <span>{profile.projects} proyectos</span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="sm"
                          onClick={() => handleConnect(profile.id)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Conectar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessage(profile.id)}
                          className="border-slate-200"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Mensaje
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProfile(profile)}
                          className="border-slate-200 px-3"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load More */}
        {filteredProfiles.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="border-slate-200">
              <TrendingUp className="h-4 w-4 mr-2" />
              Cargar más perfiles
            </Button>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProfile && (
            <>
              <DialogHeader>
                <DialogTitle>Perfil de {selectedProfile.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      {selectedProfile.avatar}
                    </div>
                    {selectedProfile.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedProfile.name}</h2>
                      {selectedProfile.isVerified && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-slate-600 mb-1">{selectedProfile.title}</p>
                    <p className="text-slate-500">{selectedProfile.company} • {selectedProfile.location}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                      <span>{selectedProfile.compatibility}% compatibilidad</span>
                      <span>•</span>
                      <span>{selectedProfile.mutualConnections} conexiones mutuas</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Acerca de</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedProfile.bio}</p>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="border-slate-300 text-slate-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Objectives */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Objetivos</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.objectives.map((obj, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-700 border-blue-200">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Looking For */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Buscando</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.lookingFor.map((item, idx) => (
                      <Badge key={idx} className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => handleConnect(selectedProfile.id)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                  <Button
                    onClick={() => handleMessage(selectedProfile.id)}
                    variant="outline"
                    className="flex-1 border-slate-200"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
