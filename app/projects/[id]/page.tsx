'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Globe, 
  Heart, 
  Bookmark, 
  Share2, 
  Eye,
  Users,
  DollarSign,
  Clock,
  MapPin,
  MessageSquare,
  Edit,
  Settings
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthProvider';
import DeleteProjectDialog from '@/components/DeleteProjectDialog';

interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: string;
  project_type: string;
  location: string;
  visibility: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  project_data: any;
  
  // Stats
  like_count: number;
  view_count: number;
  bookmark_count: number;
  
  // Creator info
  creator: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
    location?: string;
  };
  
  // User interactions
  user_interactions?: {
    has_liked: boolean;
    is_bookmarked: boolean;
    is_team_member: boolean;
  };
  
  // Files from Storage
  files: Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    public_url: string;
  }>;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is the owner
  const isOwner = user?.id === project?.creator_id;

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project');
      }

      setProject(data.project);
      
      // Track view
      if (data.project) {
        trackView();
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await fetch(`/api/projects/${projectId}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/like`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setProject(prev => prev ? {
          ...prev,
          like_count: data.likeCount,
          user_interactions: {
            ...prev.user_interactions,
            has_liked: data.isLiked,
            is_bookmarked: prev.user_interactions?.is_bookmarked ?? false,
            is_team_member: prev.user_interactions?.is_team_member ?? false,
          }
        } : null);
      }
    } catch (error) {
      console.error('Error liking project:', error);
    }
  };

  const handleBookmark = async () => {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/bookmark`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setProject(prev => prev ? {
          ...prev,
          bookmark_count: data.bookmarkCount,
          user_interactions: {
            ...prev.user_interactions,
            is_bookmarked: data.isBookmarked,
            has_liked: prev.user_interactions?.has_liked ?? false,
            is_team_member: prev.user_interactions?.is_team_member ?? false,
          }
        } : null);
      }
    } catch (error) {
      console.error('Error bookmarking project:', error);
    }
  };

  const handleDeleteSuccess = () => {
    router.push('/projects?tab=created&deleted=true');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'idea': { label: '💡 Idea', variant: 'secondary' },
      'mvp': { label: '🔧 MVP', variant: 'default' },
      'beta': { label: '🧪 Beta', variant: 'outline' },
      'production': { label: '🚀 Producción', variant: 'default' },
      'scaling': { label: '📈 Escalando', variant: 'secondary' }
    };
    
    return statusMap[status] || { label: status, variant: 'outline' };
  };

  const getTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'startup': '🚀',
      'side_project': '🛠️',
      'open_source': '🌐',
      'research': '🔬'
    };
    return typeMap[type] || '📋';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              {error || 'Proyecto no encontrado'}
            </h1>
            <Button onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const projectData = project.project_data || {};
  const logo = project.files?.find(f => f.file_type === 'logo');
  const images = project.files?.filter(f => f.mime_type.startsWith('image/') && f.file_type !== 'logo') || [];
  const presentation = project.files?.find(f => f.file_type === 'presentation');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            {/* Owner actions */}
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <DeleteProjectDialog
                  project={project as any}
                  onDelete={handleDeleteSuccess}
                  trigger={
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  }
                />
              </>
            )}
            
            <Button
              variant={project.user_interactions?.has_liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 mr-2 ${project.user_interactions?.has_liked ? 'fill-current' : ''}`} />
              {project.like_count}
            </Button>
            
            <Button
              variant={project.user_interactions?.is_bookmarked ? "default" : "outline"}
              size="sm"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${project.user_interactions?.is_bookmarked ? 'fill-current' : ''}`} />
              {project.bookmark_count}
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div className="flex items-start gap-4">
              {logo && (
                <div className="w-16 h-16 flex-shrink-0">
                  <Image
                    src={logo.public_url}
                    alt={`Logo de ${project.title}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">{project.tagline}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge {...getStatusBadge(project.status)}>
                    {getStatusBadge(project.status).label}
                  </Badge>
                  {projectData.project_type && (
                    <Badge variant="outline">
                      {getTypeIcon(projectData.project_type)} {projectData.project_type?.replace('_', ' ') || 'Proyecto'}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {project.category}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {project.view_count} vistas
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Images Gallery */}
            {images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative aspect-video">
                        <Image
                          src={image.public_url}
                          alt={image.file_name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Tabs */}
            <Tabs defaultValue="description" className="space-y-4">
              <TabsList>
                <TabsTrigger value="description">Descripción</TabsTrigger>
                <TabsTrigger value="team">Equipo</TabsTrigger>
                <TabsTrigger value="tech">Tecnología</TabsTrigger>
                {projectData.seeking_investment && (
                  <TabsTrigger value="funding">Financiamiento</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="description" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Descripción del Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
                
                {projectData.problem && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Problema que Resuelve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {projectData.problem}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {projectData.solution && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Nuestra Solución</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {projectData.solution}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Fundador</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={project.creator?.avatar_url || ''} />
                        <AvatarFallback>
                          {project.creator?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{project.creator?.full_name || 'Usuario'}</p>
                        <p className="text-sm text-muted-foreground">{project.creator?.bio || project.creator?.location || 'Creador del proyecto'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {projectData.needed_roles?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Roles Buscados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projectData.needed_roles.map((role: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{role.role}</h4>
                              <Badge variant="outline">{role.experience}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                            {role.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {role.skills.map((skill: string, skillIndex: number) => (
                                  <Badge key={skillIndex} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="tech" className="space-y-4">
                {projectData.tech_stack?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Stack Tecnológico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech_stack.map((tech: string, index: number) => (
                          <Badge key={index} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectData.repository_url && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            <span className="font-semibold">Repositorio</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={projectData.repository_url} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {projectData.demo_url && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            <span className="font-semibold">Demo</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={projectData.demo_url} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              {projectData.seeking_investment && (
                <TabsContent value="funding" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información de Inversión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectData.funding_amount && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Monto Buscado
                            </p>
                            <p className="text-lg">${projectData.funding_amount.toLocaleString()}</p>
                          </div>
                        )}
                        
                        {projectData.investment_type && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Tipo de Inversión
                            </p>
                            <p className="text-lg capitalize">{projectData.investment_type?.replace('_', ' ') || 'No especificado'}</p>
                          </div>
                        )}
                        
                        {projectData.current_revenue && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Ingresos Actuales
                            </p>
                            <p className="text-lg">${projectData.current_revenue.toLocaleString()}/mes</p>
                          </div>
                        )}
                        
                        {projectData.estimated_valuation && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Valoración Estimada
                            </p>
                            <p className="text-lg">${projectData.estimated_valuation.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {projectData.traction_metrics && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">
                            Métricas de Tracción
                          </p>
                          <p className="text-muted-foreground">{projectData.traction_metrics}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Contactar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
                
                {projectData.allow_applications && (
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Aplicar al Proyecto
                  </Button>
                )}
                
                {presentation && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={presentation.public_url} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Presentación
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vistas</span>
                    <span className="font-semibold">{project.view_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Me gusta</span>
                    <span className="font-semibold">{project.like_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Guardados</span>
                    <span className="font-semibold">{project.bookmark_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Creado</p>
                    <p className="font-semibold">
                      {new Date(project.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Última actualización</p>
                    <p className="font-semibold">
                      {new Date(project.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {projectData.looking_for?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Buscando</p>
                      <div className="flex flex-wrap gap-1">
                        {projectData.looking_for.map((item: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
