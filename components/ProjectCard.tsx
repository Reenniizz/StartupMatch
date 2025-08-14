import { Project } from '@/types/projects';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users, Calendar, ExternalLink, Eye, ImageIcon, Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { projectStorageService, ProjectFile } from '@/lib/project-storage';
import { useAuth } from '@/contexts/AuthProvider';
import DeleteProjectDialog from '@/components/DeleteProjectDialog';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: Project;
  onLike?: (projectId: string) => void;
  onBookmark?: (projectId: string) => void;
  onClick?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onDeleteDialogOpen?: () => void;
  showActions?: boolean;
  showOwnerActions?: boolean;
}

export function ProjectCard({ 
  project, 
  onLike, 
  onBookmark, 
  onClick, 
  onDelete,
  onDeleteDialogOpen,
  showActions = true,
  showOwnerActions = true
}: ProjectCardProps) {
  const [projectImages, setProjectImages] = useState<ProjectFile[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [preventCardClick, setPreventCardClick] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Check if current user is the owner
  const isOwner = user?.id === project.creator_id;

  // Load project images
  useEffect(() => {
    const loadProjectImages = async () => {
      setLoadingImages(true);
      try {
        const files = await projectStorageService.getProjectFiles(project.id);
        // Filter only images
        const images = files.filter(file => 
          file.file_type === 'image' || file.mime_type?.startsWith('image/')
        );
        setProjectImages(images);
      } catch (error) {
        console.error('Error loading project images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    loadProjectImages();
  }, [project.id]);

  // Helper function to safely parse tech_stack
  const getTechStack = (): string[] => {
    try {
      if (!project.tech_stack) return [];
      
      // If it's already an array, return it
      if (Array.isArray(project.tech_stack)) {
        return project.tech_stack;
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof project.tech_stack === 'string') {
        return JSON.parse(project.tech_stack);
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing tech_stack:', error);
      return [];
    }
  };

  const techStack = getTechStack();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(project.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmark?.(project.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open project modal if we're interacting with dropdown or if prevented
    if (preventCardClick) {
      setPreventCardClick(false); // Reset the flag
      return;
    }
    
    // Check if click is on dropdown or its children
    const target = e.target as HTMLElement;
    if (target.closest('[data-dropdown-trigger]') || target.closest('[role="menu"]')) {
      return;
    }
    
    onClick?.(project);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/projects/${project.id}/edit`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const CardContentJSX = (
    <>
      <CardHeader className="space-y-4">
        {/* Header con logo y meta info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {project.logo_url && (
              <Avatar className="h-12 w-12 rounded-lg">
                <AvatarImage src={project.logo_url} alt={project.title} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                  {project.title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{project.creator?.first_name} {project.creator?.last_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {project.is_featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                ✨ Featured
              </Badge>
            )}
            
            {/* Owner actions */}
            {isOwner && showOwnerActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    data-dropdown-trigger="true"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar proyecto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver estadísticas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreventCardClick(true);
                      onDeleteDialogOpen?.(); // Close any open project info modal
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar proyecto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Tagline */}
        {project.tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.tagline}
          </p>
        )}
      </CardHeader>

      {/* Project Hero Image */}
      {projectImages.length > 0 && (
        <div className="relative aspect-video overflow-hidden rounded-lg mx-6 mb-4">
          <img
            src={projectImages[0].public_url || ''}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {projectImages.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              +{projectImages.length - 1} más
            </div>
          )}
        </div>
      )}

      {/* Loading state for images */}
      {loadingImages && (
        <div className="aspect-video overflow-hidden rounded-lg mx-6 mb-4 bg-gray-100 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <CardContent className="space-y-4 pt-0">
        {/* Imagen de cover */}
        {project.cover_image_url && (
          <div className="relative h-40 w-full overflow-hidden rounded-lg">
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {project.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {project.stage}
          </Badge>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {project.is_seeking_cofounder && (
            <Badge variant="secondary" className="text-xs">
              🤝 Busca Cofundador
            </Badge>
          )}
          {project.is_seeking_investors && (
            <Badge variant="secondary" className="text-xs">
              💰 Busca Inversión
            </Badge>
          )}
        </div>

        {/* Descripción */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1">
          {techStack && techStack.slice(0, 3).map((tech, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {techStack && techStack.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{techStack.length - 3} más
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{project.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{project.like_count}</span>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant={project.user_interactions?.has_liked ? "default" : "ghost"}
                size="sm"
                onClick={handleLike}
                className="h-8 w-8 p-0"
              >
                <Heart className={`h-4 w-4 ${project.user_interactions?.has_liked ? 'fill-current' : ''}`} />
              </Button>
              
              {project.demo_url && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <a 
                    href={project.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </>
  );

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
        {onClick ? (
          <div onClick={handleCardClick} className="cursor-pointer">
            {CardContentJSX}
          </div>
        ) : (
          <Link href={`/projects/${project.id}`}>
            {CardContentJSX}
          </Link>
        )}
      </Card>

      {/* Delete Modal - Rendered outside the card to avoid event conflicts */}
      <DeleteProjectDialog
        project={project}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onDelete={handleDelete}
      />
    </>
  );
}
