'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Project } from '@/types/projects';
import { 
  Heart, 
  Users, 
  Calendar, 
  ExternalLink, 
  Github, 
  Globe, 
  MapPin, 
  Eye,
  Bookmark,
  MessageSquare,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (projectId: string) => void;
  onBookmark?: (projectId: string) => void;
  onApply?: (projectId: string) => void;
}

export function ProjectModal({ 
  project, 
  isOpen, 
  onClose, 
  onLike, 
  onBookmark, 
  onApply 
}: ProjectModalProps) {
  if (!project) return null;

  const handleLike = () => {
    onLike?.(project.id);
  };

  const handleBookmark = () => {
    onBookmark?.(project.id);
  };

  const handleApply = () => {
    onApply?.(project.id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'draft': { label: '📝 Borrador', variant: 'secondary' },
      'active': { label: '🟢 Activo', variant: 'default' },
      'paused': { label: '⏸️ Pausado', variant: 'outline' },
      'completed': { label: '✅ Completado', variant: 'default' },
      'cancelled': { label: '❌ Cancelado', variant: 'destructive' },
    };
    
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, { label: string; variant: any }> = {
      'idea': { label: '💡 Idea', variant: 'secondary' },
      'mvp': { label: '🔧 MVP', variant: 'default' },
      'beta': { label: '🧪 Beta', variant: 'outline' },
      'launch': { label: '🚀 Lanzamiento', variant: 'default' },
      'growth': { label: '📈 Crecimiento', variant: 'default' },
      'scaling': { label: '🎯 Escalando', variant: 'secondary' }
    };
    
    return stageMap[stage] || { label: stage, variant: 'outline' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {project.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              {project.tagline && (
                <p className="text-lg text-muted-foreground">
                  {project.tagline}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge {...getStatusBadge(project.status)}>
                  {getStatusBadge(project.status).label}
                </Badge>
                <Badge {...getStageBadge(project.stage)}>
                  {getStageBadge(project.stage).label}
                </Badge>
                <Badge variant="outline">
                  {project.category}
                </Badge>
                <Badge variant="outline">
                  {project.industry}
                </Badge>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {project.view_count} vistas
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {project.like_count} likes
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {project.application_count} aplicaciones
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(project.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Creator Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={project.creator?.avatar_url} />
                <AvatarFallback>
                  {project.creator?.first_name?.[0]}{project.creator?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {project.creator?.first_name} {project.creator?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {project.creator?.role} • {project.creator?.company}
                </p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Descripción</h3>
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
              
              {project.detailed_description && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Detalles Adicionales</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.detailed_description}
                  </p>
                </div>
              )}
            </div>

            {/* Tech Stack */}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Stack Tecnológico</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Required Skills */}
            {project.required_skills && project.required_skills.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Habilidades Requeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Links and Resources */}
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Enlaces y Recursos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.website_url && (
                  <Button variant="outline" asChild>
                    <Link href={project.website_url} target="_blank">
                      <Globe className="h-4 w-4 mr-2" />
                      Sitio Web
                    </Link>
                  </Button>
                )}
                
                {project.repository_url && (
                  <Button variant="outline" asChild>
                    <Link href={project.repository_url} target="_blank">
                      <Github className="h-4 w-4 mr-2" />
                      Repositorio
                    </Link>
                  </Button>
                )}
                
                {project.demo_url && (
                  <Button variant="outline" asChild>
                    <Link href={project.demo_url} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Demo
                    </Link>
                  </Button>
                )}
                
                {project.pitch_deck_url && (
                  <Button variant="outline" asChild>
                    <Link href={project.pitch_deck_url} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pitch Deck
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Project Stats */}
            {(project.funding_goal || project.team_size_target) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Información del Proyecto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    {project.funding_goal && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Meta de Financiamiento</p>
                        <p className="text-lg font-semibold">
                          ${project.funding_goal.toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Equipo Actual</p>
                      <p className="text-lg font-semibold">
                        {project.team_size_current} miembro{project.team_size_current !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {project.team_size_target && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Equipo Objetivo</p>
                        <p className="text-lg font-semibold">
                          {project.team_size_target} miembro{project.team_size_target !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant={project.user_interactions?.has_liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-1 ${project.user_interactions?.has_liked ? 'fill-current' : ''}`} />
              {project.like_count}
            </Button>
            
            <Button
              variant={project.user_interactions?.is_bookmarked ? "default" : "outline"}
              size="sm"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-4 w-4 mr-1 ${project.user_interactions?.is_bookmarked ? 'fill-current' : ''}`} />
              Guardar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {project.accepts_applications && (
              <Button onClick={handleApply}>
                <Users className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
            )}
            
            <Button variant="outline" asChild>
              <Link href={`/projects/${project.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Completo
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
