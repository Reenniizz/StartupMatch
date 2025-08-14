'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectFilters } from '@/components/ProjectFilters';
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

  // Load projects when tab changes or user logs in
  useEffect(() => {
    if (authLoading) return;

    if (activeTab === 'my-projects') {
      if (session) {
        loadMyProjects();
      } else {
        console.log('User not authenticated for my-projects tab');
      }
    }
  }, [activeTab, session, authLoading]);

  const handleLike = async (projectId: string) => {
    console.log('Like project:', projectId);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground mt-2">
            Descubre proyectos increíbles o comparte el tuyo con la comunidad
          </p>
        </div>
      </div>

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
          <h3 className="text-xl font-semibold">Descubrir Proyectos</h3>
          <div className="text-center py-12">
            <p>Tab de descubrir en desarrollo...</p>
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
  );
}
