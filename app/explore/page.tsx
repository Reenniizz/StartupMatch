'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter,
  MapPin,
  Users,
  Briefcase,
  Star,
  Heart,
  MessageCircle,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  stage: string;
  location: string;
  team_size: number;
  looking_for: string[];
  tags: string[];
  created_at: string;
  author: {
    name: string;
    role: string;
  };
}

interface Founder {
  id: string;
  name: string;
  role: string;
  industry: string;
  location: string;
  experience_years: number;
  skills: string[];
  looking_for: string;
  bio: string;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=20');
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  // Fetch founders
  const fetchFounders = async () => {
    try {
      const response = await fetch('/api/users?type=founders&limit=20');
      if (response.ok) {
        const data = await response.json();
        setFounders(Array.isArray(data) ? data : []);
      } else {
        setFounders([]);
      }
    } catch (error) {
      console.error('Error fetching founders:', error);
      setFounders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchFounders();
    }
  }, [user]);

  // Filter data based on search
  const filteredProjects = Array.isArray(projects) ? projects.filter(project =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredFounders = Array.isArray(founders) ? founders.filter(founder =>
    founder.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    founder.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    founder.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Explorar
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Descubre proyectos increíbles y founders talentosos
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar proyectos, founders o tecnologías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Proyectos ({filteredProjects.length})
            </TabsTrigger>
            <TabsTrigger value="founders" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Founders ({filteredFounders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectsGrid projects={filteredProjects} />
          </TabsContent>

          <TabsContent value="founders">
            <FoundersGrid founders={filteredFounders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Projects Grid Component
function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No hay proyectos disponibles
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sé el primero en publicar tu proyecto
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {project.title || 'Proyecto sin título'}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {project.tagline || 'Sin descripción disponible'}
            </p>
          </div>
          <Badge variant="secondary" className="ml-2">
            {project.stage || 'Idea'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4 mr-2" />
            {project.category || 'Sin categoría'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            {project.location || 'Ubicación no especificada'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            Equipo de {project.team_size || 1} personas
          </div>
        </div>

        {project.looking_for && Array.isArray(project.looking_for) && project.looking_for.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscando:
            </p>
            <div className="flex flex-wrap gap-1">
              {project.looking_for.slice(0, 2).map((role) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))}
              {project.looking_for.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{project.looking_for.length - 2} más
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {project.author?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {project.author?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {project.author?.role || 'Founder'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Founders Grid Component
function FoundersGrid({ founders }: { founders: Founder[] }) {
  if (founders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No hay founders disponibles
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Únete a la comunidad y conecta con otros emprendedores
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {founders.map((founder, index) => (
        <motion.div
          key={founder.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <FounderCard founder={founder} />
        </motion.div>
      ))}
    </div>
  );
}

// Founder Card Component
function FounderCard({ founder }: { founder: Founder }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {founder.name?.charAt(0) || 'F'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {founder.name || 'Founder anónimo'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {founder.role || 'Emprendedor'}
            </p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1">
              <Star className="w-3 h-3 mr-1" />
              {founder.experience_years || 0} años de experiencia
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Industria:</strong> {founder.industry || 'No especificada'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ubicación:</strong> {founder.location || 'No especificada'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Busca:</strong> {founder.looking_for || 'Oportunidades'}
          </p>
        </div>

        {founder.bio && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {founder.bio}
          </p>
        )}

        {founder.skills && Array.isArray(founder.skills) && founder.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Habilidades:
            </p>
            <div className="flex flex-wrap gap-1">
              {founder.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {founder.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{founder.skills.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
            <Users className="w-4 h-4 mr-2" />
            Conectar
          </Button>
          <Button variant="outline" size="icon">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              <div>
                <div className="h-8 bg-gray-300 rounded w-48"></div>
                <div className="h-4 bg-gray-300 rounded w-64 mt-2"></div>
              </div>
            </div>
          </div>

          {/* Search skeleton */}
          <div className="h-12 bg-gray-300 rounded"></div>

          {/* Tabs skeleton */}
          <div className="h-12 bg-gray-300 rounded"></div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
