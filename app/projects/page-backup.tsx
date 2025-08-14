'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectFilters } from '@          {/* My Projects Tab */}
          <TabsContent value="my-projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Mis Proyectos</h3>
              {session && (
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Proyecto
                  </Link>
                </Button>
              )}
            </div>

            {!session ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inicia sesión para ver tus proyectos</h3>
                <p className="text-muted-foreground mb-6">
                  Necesitas estar autenticado para ver y gestionar tus proyectos.
                </p>
                <Button asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              </div>
            ) : loading ? (rojectFilters';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Rocket, Users, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, ProjectCategory, ProjectSearchFilters, ProjectsResponse } from '@/types/projects';
import { useProjectRealtime, ProjectRealtimeData } from '@/hooks/useProjectRealtime';
import { useAuth } from '@/contexts/AuthProvider';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState('discover');
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [myApplications, setMyApplications] = useState<Project[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  
  const [filters, setFilters] = useState<ProjectSearchFilters>({
    page: 1,
    limit: 12
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Realtime handlers
  const handleProjectUpdate = useCallback((projectId: string, data: Partial<ProjectRealtimeData>) => {
    const updateProject = (project: Project): Project => {
      if (project.id === projectId) {
        return {
          ...project,
          ...data,
          like_count: data.like_count ?? project.like_count,
          view_count: data.view_count ?? project.view_count,
          bookmark_count: data.bookmark_count ?? project.bookmark_count,
          application_count: data.application_count ?? project.application_count,
        };
      }
      return project;
    };

    setProjects(prev => prev.map(updateProject));
    setMyProjects(prev => prev.map(updateProject));
    setRecommendedProjects(prev => prev.map(updateProject));
  }, []);

  const handleProjectLike = useCallback((projectId: string, likeCount: number) => {
    handleProjectUpdate(projectId, { id: projectId, like_count: likeCount, updated_at: new Date().toISOString() });
  }, [handleProjectUpdate]);

  const handleProjectBookmark = useCallback((projectId: string, bookmarkCount: number) => {
    handleProjectUpdate(projectId, { id: projectId, bookmark_count: bookmarkCount, updated_at: new Date().toISOString() });
  }, [handleProjectUpdate]);

  const handleProjectView = useCallback((projectId: string, viewCount: number) => {
    handleProjectUpdate(projectId, { id: projectId, view_count: viewCount, updated_at: new Date().toISOString() });
  }, [handleProjectUpdate]);

  // Modal handlers
  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // Action handlers
  const handleLike = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        handleProjectLike(projectId, data.likeCount);
      }
    } catch (error) {
      console.error('Error liking project:', error);
    }
  };

  const handleBookmark = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/bookmark`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        handleProjectBookmark(projectId, data.bookmarkCount);
      }
    } catch (error) {
      console.error('Error bookmarking project:', error);
    }
  };

  const handleApply = (projectId: string) => {
    router.push(`/projects/${projectId}/apply`);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12
    });
    loadProjects();
  };

  const retryLoad = () => {
    setError(null);
    loadProjects();
  };

  const handleNewApplication = useCallback((projectId: string, applicationData: any) => {
    console.log('New application received for project:', projectId, applicationData);
    // Optionally show a toast notification
  }, []);

  // Initialize realtime
  useProjectRealtime({
    onProjectUpdate: handleProjectUpdate,
    onProjectLike: handleProjectLike,
    onProjectBookmark: handleProjectBookmark,
    onProjectView: handleProjectView,
    onNewApplication: handleNewApplication,
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load projects when filters change or auth state changes
  useEffect(() => {
    // Skip if authentication is still loading
    if (authLoading) return;

    if (activeTab === 'discover') {
      loadProjects();
    } else if (activeTab === 'my-projects') {
      // Only load my projects if user is authenticated
      if (session) {
        loadMyProjects();
      } else {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
      }
    } else if (activeTab === 'applications') {
      // Only load applications if user is authenticated
      if (session) {
        loadMyApplications();
      } else {
        router.push('/login');
      }
    }
  }, [filters, activeTab, session, authLoading]);

  // Load recommended projects
  useEffect(() => {
    if (activeTab === 'discover') {
      loadRecommendedProjects();
    }
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/projects/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/projects?${params}`);
      const data: ProjectsResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects');
      }

      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProjects = async () => {
    if (!session) {
      console.log('No session available, redirecting to login');
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading projects for user:', session.user.id);
      const response = await fetch('/api/projects/my?tab=created');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', response.status, errorData);
        
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to login');
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load projects`);
      }

      const data = await response.json();
      console.log('My projects loaded:', data.projects?.length || 0, 'projects');
      setMyProjects(data.projects || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load my projects';
      setError(errorMessage);
      console.error('Error loading my projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/projects/my?tab=applied');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load applications');
      }

      setMyApplications(data.projects);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedProjects = async () => {
    try {
      const response = await fetch('/api/projects/recommended?limit=6');
      const data = await response.json();
      
      if (response.ok && data.projects) {
        setRecommendedProjects(data.projects);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleFiltersChange = (newFilters: ProjectSearchFilters) => {
    setFilters(newFilters);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset filters when changing tabs
    setFilters({ page: 1, limit: 12 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
            <p className="text-muted-foreground mt-2">
              Descubre proyectos increíbles y encuentra tu próxima oportunidad
            </p>
          </div>
          
          <Button asChild size="lg">
            <Link href="/projects/create">
              <Plus className="h-5 w-5 mr-2" />
              Crear Proyecto
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Descubrir</span>
            </TabsTrigger>
            <TabsTrigger value="my-projects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Mis Proyectos</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Aplicaciones</span>
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <ProjectFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  categories={categories}
                  isLoading={loading}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Recommended Section */}
                {recommendedProjects.length > 0 && filters.search === undefined && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        ✨ Recomendados para ti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {recommendedProjects.map((project) => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onLike={handleLike}
                            showActions={true}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projects Grid */}
                {error ? (
                  <EmptyState type="network-error" onRetry={retryLoad} />
                ) : (
                  <>
                    {loading ? (
                      <LoadingSkeleton type="project-cards" count={6} />
                    ) : projects.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            {pagination.total} proyectos encontrados
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {projects.map((project) => (
                            <ProjectCard
                              key={project.id}
                              project={project}
                              onLike={handleLike}
                              onBookmark={handleBookmark}
                              onClick={openProjectModal}
                              showActions={true}
                            />
                          ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="flex justify-center space-x-2">
                            {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  variant={pagination.page === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleFiltersChange({ ...filters, page })}
                                >
                                  {page}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState type="no-results" onClearFilters={clearFilters} />
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* My Projects Tab */}
          <TabsContent value="my-projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Mis Proyectos</h3>
              <Button asChild>
                <Link href="/projects/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Proyecto
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={handleLike}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="no-my-projects" />
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <h3 className="text-xl font-semibold">Mis Aplicaciones</h3>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myApplications.length > 0 ? (
              <div className="space-y-4">
                {myApplications.map((project) => (
                  <Card key={project.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{project.title}</h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                project.application?.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : project.application?.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : project.application?.status === 'under_review'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {project.application?.status === 'accepted'
                                ? '✅ Aceptada'
                                : project.application?.status === 'rejected'
                                ? '❌ Rechazada'
                                : project.application?.status === 'under_review'
                                ? '⏳ En revisión'
                                : '⏳ Pendiente'
                              }
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Rol deseado: <span className="font-medium">{project.application?.desired_role}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Aplicado el {new Date(project.application?.applied_at || '').toLocaleDateString()}
                          </p>
                          
                          {project.application?.response_message && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                <strong>Respuesta:</strong> {project.application?.response_message}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="outline" asChild>
                          <Link href={`/projects/${project.id}`}>
                            Ver proyecto
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState type="no-applications" />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={closeProjectModal}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onApply={handleApply}
      />
    </div>
  );
}
