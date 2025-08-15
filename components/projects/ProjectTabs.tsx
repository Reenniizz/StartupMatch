/**
 * Projects Tab Content Components - PERFORMANCE OPTIMIZED
 * Separates UI logic for better maintainability
 * Solves: Re-renders innecesarios + optimizaciones de memoria
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProjectCard } from '@/components/ProjectCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthProvider';
import { useMyProjects, useDiscoverProjects } from '@/hooks/useProjectsNew';
import { useProjectsUI, useProjectsLoading } from '@/store/projects';
import { OptimizedSearch } from '@/components/OptimizedSearch';
import { OptimizedProjectList } from '@/components/LazyProjectList';

// Loading skeleton component
const ProjectLoadingSkeleton = () => (
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
);

// Error state component
const ProjectErrorState = ({ error, onRetry, onCreate }: { 
  error: string; 
  onRetry: () => void;
  onCreate?: () => void;
}) => (
  <div className="text-center py-12">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
    <p className="text-muted-foreground mb-4">{error}</p>
    <div className="space-x-4">
      <Button onClick={onRetry} variant="outline">
        Reintentar
      </Button>
      {onCreate && (
        <Button asChild>
          <Link href="/projects/create">Crear Mi Primer Proyecto</Link>
        </Button>
      )}
    </div>
  </div>
);

// My Projects Tab Component - PERFORMANCE OPTIMIZED
export const MyProjectsTab = memo(() => {
  const { session } = useAuth();
  const { loading, error } = useProjectsLoading();
  const { openProjectModal } = useProjectsUI();
  const { myProjects, loadMyProjects, handleLike, handleDelete, handleDeleteDialogOpen } = useMyProjects();

  // Not authenticated state
  if (!session) {
    return (
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
    );
  }

  // Loading state
  if (loading.myProjects) {
    return <ProjectLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ProjectErrorState 
        error={error} 
        onRetry={loadMyProjects}
        onCreate={() => {}} // We have the create button in header already
      />
    );
  }

  // Projects found state
  if (myProjects.length > 0) {
    return (
      <div className="space-y-4">
        {/* Header con estadísticas */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Mis Proyectos</h3>
            <p className="text-sm text-muted-foreground">
              {myProjects.length} proyecto{myProjects.length !== 1 ? 's' : ''} encontrado{myProjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              Crear Proyecto
            </Link>
          </Button>
        </div>

        {/* Lista optimizada de proyectos */}
        <OptimizedProjectList
          projects={myProjects}
          onProjectClick={openProjectModal}
          onProjectLike={handleLike}
        />
      </div>
    );
  }

  // Empty state
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Usuario: {session?.user?.email || 'No disponible'}
      </div>
      <EmptyState type="no-my-projects" />
    </div>
  );
});

MyProjectsTab.displayName = 'MyProjectsTab';

// Discover Projects Tab Component - PERFORMANCE OPTIMIZED
export const DiscoverProjectsTab = memo(() => {
  const { projects, handleSearch, handleFilterChange, handlePageChange } = useDiscoverProjects();
  const { loading, error } = useProjectsLoading();
  const { openProjectModal } = useProjectsUI();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Descubrir Proyectos</h3>
      </div>

      {/* OPTIMIZATION: Búsqueda optimizada con debounce */}
      <OptimizedSearch
        onSearch={handleSearch}
        placeholder="Buscar proyectos por nombre, descripción o tecnología..."
        debounceMs={500}
        minLength={2}
        className="max-w-md"
      />

      {/* Content */}
      {loading.projects ? (
        <ProjectLoadingSkeleton />
      ) : error ? (
        <ProjectErrorState 
          error={error} 
          onRetry={() => window.location.reload()}
        />
      ) : (
        <OptimizedProjectList
          projects={projects}
          onProjectClick={openProjectModal}
          onProjectLike={(id) => console.log('Like:', id)}
        />
      )}
    </div>
  );
});

DiscoverProjectsTab.displayName = 'DiscoverProjectsTab';

// Applications Tab Component - PERFORMANCE OPTIMIZED
export const ApplicationsTab = memo(() => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Mis Aplicaciones</h3>
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Esta funcionalidad estará disponible próximamente.
        </p>
      </div>
    </div>
  );
});

ApplicationsTab.displayName = 'ApplicationsTab';
