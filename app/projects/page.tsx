'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter,
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'paused' | 'completed';
  teamSize: number;
  location: string;
  createdAt: string;
  tags: string[];
  author: {
    name: string;
    role: string;
  };
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data para proyectos
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Plataforma de E-learning',
        description: 'Una plataforma moderna para cursos online con IA integrada para personalización del aprendizaje.',
        category: 'Educación',
        status: 'active',
        teamSize: 4,
        location: 'Madrid, España',
        createdAt: '2024-01-15',
        tags: ['React', 'Node.js', 'IA', 'Educación'],
        author: {
          name: 'Ana García',
          role: 'Product Manager'
        }
      },
      {
        id: '2',
        title: 'App de Fintech',
        description: 'Aplicación móvil para gestión financiera personal con análisis predictivo.',
        category: 'Fintech',
        status: 'active',
        teamSize: 6,
        location: 'Barcelona, España',
        createdAt: '2024-02-01',
        tags: ['React Native', 'Blockchain', 'Fintech'],
        author: {
          name: 'Carlos Mendez',
          role: 'Tech Lead'
        }
      },
      {
        id: '3',
        title: 'Marketplace Sostenible',
        description: 'Marketplace para productos ecológicos y sostenibles con trazabilidad completa.',
        category: 'Sostenibilidad',
        status: 'paused',
        teamSize: 3,
        location: 'Valencia, España',
        createdAt: '2024-01-30',
        tags: ['E-commerce', 'Sostenibilidad', 'Blockchain'],
        author: {
          name: 'Laura Jiménez',
          role: 'Founder'
        }
      }
    ];

    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Mis Proyectos
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona y explora tus proyectos
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </motion.div>

        {/* Búsqueda y Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Búsqueda */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex space-x-3 flex-wrap">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'paused', label: 'Pausados' },
              { key: 'completed', label: 'Completados' }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={selectedStatus === filter.key ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(filter.key)}
                size="sm"
              >
                {filter.label} ({
                  filter.key === 'all' 
                    ? filteredProjects.length 
                    : projects.filter(p => p.status === filter.key).length
                })
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Lista de Proyectos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredProjects.length === 0 ? (
            <EmptyState />
          ) : (
            filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Badge className={`${project.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : project.status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'} border`}>
                {project.status === 'active' ? 'Activo' : project.status === 'paused' ? 'Pausado' : 'Completado'}
              </Badge>
              <Badge variant="outline">
                {project.category}
              </Badge>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors">
              {project.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {project.teamSize} miembros
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {project.location}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(project.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>

            <div className="flex items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-semibold text-xs">
                  {project.author.name.charAt(0)}
                </span>
              </div>
              <span>{project.author.name} • {project.author.role}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2 ml-6">
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No tienes proyectos aún
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Crea tu primer proyecto para empezar a conectar con otros founders
      </p>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Crear Proyecto
      </Button>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
