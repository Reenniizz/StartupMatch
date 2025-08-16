import { motion } from 'framer-motion';
import { 
  Heart,
  Bookmark,
  Eye,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  ExternalLink,
  Github,
  Send,
  CheckCircle,
  AlertCircle,
  Shield,
  Crown,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ProjectWithOwner, 
  ViewMode, 
  ProjectStatus,
  DifficultyLevel,
  CommitmentLevel 
} from '../types';
import Link from 'next/link';

interface ProjectCardProps {
  project: ProjectWithOwner;
  viewMode: ViewMode;
  onLike: (projectId: string) => void;
  onBookmark: (projectId: string) => void;
  onApply: (projectId: string) => void;
  onView: (project: ProjectWithOwner) => void;
  showOwner?: boolean;
}

export function ProjectCard({
  project,
  viewMode,
  onLike,
  onBookmark,
  onApply,
  onView,
  showOwner = true
}: ProjectCardProps) {
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

  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-blue-600';
      case 'advanced':
        return 'text-orange-600';
      case 'expert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDifficultyLabel = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      case 'expert':
        return 'Experto';
      default:
        return level;
    }
  };

  const getCommitmentLabel = (level: CommitmentLevel) => {
    switch (level) {
      case 'low':
        return 'Bajo';
      case 'medium':
        return 'Medio';
      case 'high':
        return 'Alto';
      case 'full_time':
        return 'Tiempo Completo';
      default:
        return level;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    if (diffInHours < 730) return `Hace ${Math.floor(diffInHours / 168)}sem`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getApplicationStatus = () => {
    if (!project.user_application) return null;
    
    const status = project.user_application.status;
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
      interview: 'bg-blue-100 text-blue-800 border-blue-200',
      negotiating: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      withdrawn: 'Retirada',
      interview: 'Entrevista',
      negotiating: 'Negociando'
    };

    return {
      color: colors[status] || colors.pending,
      label: labels[status] || status
    };
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (viewMode === 'list') {
    return <ListProjectCard project={project} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group"
    >
      {/* Project Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-4xl font-bold opacity-80">
              {project.title.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(project.id);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              project.is_liked
                ? 'bg-pink-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${project.is_liked ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(project.id);
            }}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              project.is_bookmarked
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${project.is_bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Featured Badge */}
        {project.is_featured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Destacado
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className={`border ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 
            className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onView(project)}
          >
            {project.title}
          </h3>
          
          {project.short_description && (
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
              {project.short_description}
            </p>
          )}
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-500">
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{project.location}</span>
            </div>
          )}
          
          {project.remote_friendly && (
            <Badge variant="outline" className="text-xs">
              Remoto
            </Badge>
          )}
          
          {project.is_paid && (
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="w-3 h-3" />
              <span>Pagado</span>
            </div>
          )}
          
          {project.equity_percentage && (
            <div className="flex items-center gap-1 text-purple-600">
              <TrendingUp className="w-3 h-3" />
              <span>{project.equity_percentage}% equity</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {project.skills_required && project.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.skills_required.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills_required.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills_required.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Difficulty & Commitment */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className={`flex items-center gap-1 ${getDifficultyColor(project.difficulty_level)}`}>
            <Star className="w-3 h-3" />
            <span>{getDifficultyLabel(project.difficulty_level)}</span>
          </div>
          
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{getCommitmentLabel(project.commitment_level)}</span>
          </div>
        </div>

        {/* Owner */}
        {showOwner && project.owner && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {project.owner.avatar_url ? (
                <img
                  src={project.owner.avatar_url}
                  alt={project.owner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {project.owner.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {project.owner.name}
                </span>
                
                {project.owner.is_verified && (
                  <Shield className="w-3 h-3 text-blue-500" />
                )}
                
                {project.owner.is_premium && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </div>
              
              {project.owner.role && (
                <div className="text-xs text-gray-500 truncate">
                  {project.owner.role}
                  {project.owner.company && ` @ ${project.owner.company}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{project.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{project.applications_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{project.views_count || 0}</span>
            </div>
          </div>
          
          <div className="text-xs">
            {formatTimeAgo(project.created_at)}
          </div>
        </div>

        {/* Application Status */}
        {getApplicationStatus() && (
          <div className="mb-4">
            <Badge className={`border ${getApplicationStatus()!.color}`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {getApplicationStatus()!.label}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onView(project)}
            variant="outline"
            className="flex-1 text-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>
          
          {!project.user_application && project.status === 'active' && (
            <Button
              onClick={() => onApply(project.id)}
              className="flex-1 text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          )}
        </div>

        {/* External Links */}
        {(project.project_url || project.github_url || project.demo_url) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="Sitio web del proyecto"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                title="Repositorio GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                title="Demo del proyecto"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// List View Component
function ListProjectCard({ project }: { project: ProjectWithOwner }) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    if (diffInHours < 730) return `Hace ${Math.floor(diffInHours / 168)}sem`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Project Avatar */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
              {project.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate mb-1">
                {project.title}
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                {project.owner && (
                  <>
                    <span>{project.owner.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatTimeAgo(project.created_at)}</span>
                {project.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <Badge className={`border ml-2 ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          
          {project.short_description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {project.short_description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{project.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{project.applications_count || 0}</span>
              </div>
              {project.is_paid && (
                <div className="flex items-center gap-1 text-green-600">
                  <DollarSign className="w-3 h-3" />
                  <span>Pagado</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                Ver
              </Button>
              {!project.user_application && project.status === 'active' && (
                <Button size="sm">
                  <Send className="w-3 h-3 mr-1" />
                  Aplicar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
