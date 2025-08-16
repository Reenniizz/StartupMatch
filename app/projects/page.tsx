'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectFilters } from '@/components/ProjectFilters';
import { ProjectSorting } from '@/components/ProjectSorting';
import { Pagination } from '@/components/ProjectPagination';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Rocket, Users, BookOpen, AlertCircle, BarChart3, ArrowLeft, Grid3X3, List, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, ProjectCategory, ProjectSearchFilters, ProjectsResponse } from '@/types/projects';
import { useProjectRealtime, ProjectRealtimeData } from '@/hooks/useProjectRealtime';
import { useProjectSearch } from '@/hooks/useProjectSearch';
import { useAuth } from '@/contexts/AuthProvider';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState('discover');
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [myApplications, setMyApplications] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use custom hook for discover projects search
  const discoverSearch = useProjectSearch({
    initialFilters: {
      page: 1,
      limit: 12,
      sort_by: 'recent',
      sort_order: 'desc'
    },
    apiEndpoint: '/api/projects/search',
    autoSearch: activeTab === 'discover'
  });

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/projects/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Modal handlers
  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const loadMyProjects = async () => {
    if (!session) {
      console.log('No session available');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading projects for user:', session.user.id);
      
      // Prepare headers with authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if access token exists
      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      // Fallback: add userId as query parameter for development
      const url = `/api/projects/my?tab=created&userId=${session.user.id}`;
      
      const response = await fetch(url, {
        headers
      });
      
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

  // Load projects when tab changes or user logs in
  useEffect(() => {
    if (authLoading) return;

    if (activeTab === 'my-projects') {
      if (session) {
        loadMyProjects();
      } else {
        console.log('User not authenticated for my-projects tab');
      }
    } else if (activeTab === 'discover') {
      // Trigger discover search if not auto-searching
      if (!discoverSearch.loading && discoverSearch.projects.length === 0) {
        discoverSearch.searchProjects();
      }
    }
  }, [activeTab, session, authLoading]);

  const handleLike = async (projectId: string) => {
    console.log('Like project:', projectId);
  };

  const handleDelete = async (projectId: string) => {
    // Close the project info modal if it's open
    closeProjectModal();
    
    // Remove the project from the current list
    setMyProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleDeleteDialogOpen = () => {
    // Close the project info modal when delete dialog opens
    closeProjectModal();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Rocket className="h-6 w-6 mr-2 text-blue-600" />
                Proyectos
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {session && (
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Proyecto
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-8">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Descubrir
          </TabsTrigger>
          <TabsTrigger value="my-projects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mis Proyectos
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Aplicaciones
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar with Filters */}
            <div className={`lg:w-80 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <ProjectFilters
                filters={discoverSearch.filters}
                onFiltersChange={(newFilters) => discoverSearch.updateFilters(newFilters)}
                categories={categories}
                isLoading={discoverSearch.loading}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4">
              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">Descubrir Proyectos</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showFilters ? 'Ocultar' : 'Filtros'}
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sorting */}
                  <ProjectSorting
                    sortBy={discoverSearch.filters.sort_by}
                    sortOrder={discoverSearch.filters.sort_order}
                    onSortChange={(sortBy, sortOrder) => 
                      discoverSearch.updateFilters({ 
                        sort_by: sortBy as typeof discoverSearch.filters.sort_by, 
                        sort_order: sortOrder 
                      })
                    }
                  />

                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {discoverSearch.loading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {Array.from({ length: discoverSearch.filters.limit || 6 }).map((_, i) => (
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
              ) : discoverSearch.error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
                  <p className="text-muted-foreground mb-4">{discoverSearch.error}</p>
                  <Button onClick={() => discoverSearch.searchProjects()} variant="outline">
                    Reintentar
                  </Button>
                </div>
              ) : discoverSearch.projects.length > 0 ? (
                <div className="space-y-6">
                  {/* Results info */}
                  <div className="text-sm text-muted-foreground">
                    {discoverSearch.pagination.total} proyecto{discoverSearch.pagination.total !== 1 ? 's' : ''} encontrado{discoverSearch.pagination.total !== 1 ? 's' : ''}
                  </div>

                  {/* Projects grid */}
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {discoverSearch.projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onLike={handleLike}
                        onClick={openProjectModal}
                        showActions={false}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={discoverSearch.pagination.page}
                    totalPages={discoverSearch.pagination.totalPages}
                    totalItems={discoverSearch.pagination.total}
                    itemsPerPage={discoverSearch.pagination.limit}
                    onPageChange={(page) => discoverSearch.updateFilters({ page })}
                    onItemsPerPageChange={(limit) => discoverSearch.updateFilters({ limit, page: 1 })}
                  />
                </div>
              ) : (
                // Show different empty states based on filters
                <>
                  {Object.keys(discoverSearch.filters).some(key => 
                    key !== 'page' && key !== 'limit' && key !== 'sort_by' && key !== 'sort_order' && 
                    discoverSearch.filters[key as keyof typeof discoverSearch.filters]
                  ) ? (
                    <EmptyState 
                      type="no-results" 
                      onClearFilters={() => discoverSearch.resetFilters()}
                    />
                  ) : (
                    <EmptyState 
                      type="no-projects-system"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* My Projects Tab */}
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
          ) : loading ? (
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
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={loadMyProjects} variant="outline">
                  Reintentar
                </Button>
                <Button asChild>
                  <Link href="/projects/create">Crear Mi Primer Proyecto</Link>
                </Button>
              </div>
            </div>
          ) : myProjects.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {myProjects.length} proyecto{myProjects.length !== 1 ? 's' : ''} encontrado{myProjects.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLike={handleLike}
                    onClick={openProjectModal}
                    onDelete={handleDelete}
                    onDeleteDialogOpen={handleDeleteDialogOpen}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Usuario: {session?.user?.email || 'No disponible'}
              </div>
              <EmptyState type="no-my-projects" />
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <h3 className="text-xl font-semibold">Mis Aplicaciones</h3>
          <div className="text-center py-12">
            <p>Tab de aplicaciones en desarrollo...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={closeProjectModal}
        onLike={handleLike}
        onBookmark={(id) => console.log('Bookmark:', id)}
        onApply={(projectId) => console.log('Apply:', projectId)}
      />
      </div>
    </div>
  );
}
