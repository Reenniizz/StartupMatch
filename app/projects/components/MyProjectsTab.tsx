import { motion } from 'framer-motion';
import { ProjectWithOwner, ViewMode } from '../types';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { 
  Plus,
  Edit3,
  Eye,
  Heart,
  Users,
  Calendar,
  MoreHorizontal,
  Trash2,
  Settings,
  Copy,
  Archive,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectStatus } from '../types';
import Link from 'next/link';

interface MyProjectsTabProps {
  projects: ProjectWithOwner[];
  loading: boolean;
  viewMode: ViewMode;
  onLike: (projectId: string) => void;
  onBookmark: (projectId: string) => void;
  onApply: (projectId: string) => void;
  onView: (project: ProjectWithOwner) => void;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onDuplicate?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
  onStatusChange?: (projectId: string, status: ProjectStatus) => void;
}

export function MyProjectsTab({
  projects,
  loading,
  viewMode,
  onLike,
  onBookmark,
  onApply,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onStatusChange
}: MyProjectsTabProps) {
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      case 'on_hold':
        return 'En Pausa';
      case 'cancelled':
        return 'Cancelado';
      case 'draft':
        return 'Borrador';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton 
            key={i} 
            type="project-cards"
          />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <EmptyState
        type="no-my-projects"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Proyectos Activos</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {projects.reduce((acc, p) => acc + (p.applications_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Aplicaciones</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {projects.reduce((acc, p) => acc + (p.likes_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Likes</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {projects.reduce((acc, p) => acc + (p.views_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Vistas</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            {/* Owner Actions Overlay */}
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-sm"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit?.(project.id)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Proyecto
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onView(project)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {project.status === 'active' ? (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(project.id, 'on_hold')}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar Proyecto
                    </DropdownMenuItem>
                  ) : project.status === 'on_hold' ? (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(project.id, 'active')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Reactivar
                    </DropdownMenuItem>
                  ) : null}
                  
                  {project.status !== 'completed' && (
                    <DropdownMenuItem 
                      onClick={() => onStatusChange?.(project.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Completado
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => onArchive?.(project.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(project.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Enhanced Project Card with Owner Stats */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
              {/* Project Header */}
              <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white text-2xl font-bold opacity-80">
                      {project.title.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge className={`border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                {/* Featured Badge */}
                {project.is_featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      ⭐ Destacado
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 
                  className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onView(project)}
                >
                  {project.title}
                </h3>
                
                {project.short_description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {project.short_description}
                  </p>
                )}

                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {project.applications_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Aplicaciones</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {project.likes_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {project.views_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Vistas</div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Creado {formatDate(project.created_at)}</span>
                  </div>
                  
                  {project.updated_at !== project.created_at && (
                    <div className="flex items-center gap-1">
                      <span>Act. {formatDate(project.updated_at)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onView(project)}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  
                  <Button
                    onClick={() => onEdit?.(project.id)}
                    className="flex-1 text-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create New Project CTA */}
      <div className="flex justify-center pt-8">
        <Button size="lg" asChild>
          <Link href="/projects/create">
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo Proyecto
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
