/**
 * Optimized Project List Component
 * Solves: Re-renders innecesarios + lazy loading de datos
 */

'use client';

import React, { memo } from 'react';
import { ProjectCard } from '@/components/ProjectCard';
import { LoadingStates } from '@/components/ui/loading';
import { useLazyLoad } from '@/hooks/useLazyLoading';
import { useMemoArray } from '@/hooks/useMemoization';
import { Project } from '@/types/projects';

interface OptimizedProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectLike: (projectId: string) => void;
  className?: string;
}

/**
 * Componente de proyecto individual optimizado con lazy loading
 */
const OptimizedProjectCard = memo<{
  project: Project;
  onProjectClick: (project: Project) => void;
  onProjectLike: (projectId: string) => void;
}>(({ project, onProjectClick, onProjectLike }) => {
  const { ref, shouldLoad } = useLazyLoad(0.1, '200px');

  // OPTIMIZATION 1: Solo renderizar cuando sea visible en viewport
  if (!shouldLoad) {
    return (
      <div ref={ref} className="h-64 w-full bg-muted animate-pulse rounded-lg" />
    );
  }

  return (
    <div ref={ref}>
      <ProjectCard
        project={project}
        onClick={onProjectClick}
        onLike={onProjectLike}
      />
    </div>
  );
});

OptimizedProjectCard.displayName = 'OptimizedProjectCard';

/**
 * Grid de proyectos con optimizaciones de memoria
 */
const OptimizedProjectGrid = memo<{
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectLike: (projectId: string) => void;
}>(({ projects, onProjectClick, onProjectLike }) => {
  // OPTIMIZATION 2: Memoizar array solo si los IDs cambiaron
  const optimizedProjects = useMemoArray(projects, (a, b) => a.id === b.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {optimizedProjects.map((project) => (
        <OptimizedProjectCard
          key={project.id}
          project={project}
          onProjectClick={onProjectClick}
          onProjectLike={onProjectLike}
        />
      ))}
    </div>
  );
});

OptimizedProjectGrid.displayName = 'OptimizedProjectGrid';

/**
 * Lista principal optimizada
 */
export const OptimizedProjectList = memo<OptimizedProjectListProps>(({
  projects,
  onProjectClick,
  onProjectLike,
  className = '',
}) => {
  const { ref: containerRef, shouldLoad: shouldLoadContainer } = useLazyLoad(0, '50px');

  return (
    <div ref={containerRef} className={className}>
      {/* OPTIMIZATION 3: Lazy loading del contenedor completo */}
      {shouldLoadContainer ? (
        <>
          {projects.length > 0 ? (
            <OptimizedProjectGrid
              projects={projects}
              onProjectClick={onProjectClick}
              onProjectLike={onProjectLike}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron proyectos</p>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
});

OptimizedProjectList.displayName = 'OptimizedProjectList';

/**
 * Hook para manejo optimizado de listas grandes (virtualización)
 */
export function useOptimizedProjectList(
  projects: Project[],
  options: {
    pageSize?: number;
    virtualizeThreshold?: number;
  } = {}
) {
  const { pageSize = 12, virtualizeThreshold = 50 } = options;
  
  // OPTIMIZATION 4: Paginación virtual para listas grandes
  const [visibleProjects, setVisibleProjects] = React.useState<Project[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);

  const optimizedProjects = useMemoArray(projects);
  const shouldVirtualize = optimizedProjects.length > virtualizeThreshold;

  React.useEffect(() => {
    if (shouldVirtualize) {
      const startIndex = 0;
      const endIndex = currentPage * pageSize;
      setVisibleProjects(optimizedProjects.slice(startIndex, endIndex));
    } else {
      setVisibleProjects(optimizedProjects);
    }
  }, [optimizedProjects, currentPage, pageSize, shouldVirtualize]);

  const loadMore = React.useCallback(() => {
    if (shouldVirtualize && visibleProjects.length < optimizedProjects.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [shouldVirtualize, visibleProjects.length, optimizedProjects.length]);

  const hasMore = shouldVirtualize && visibleProjects.length < optimizedProjects.length;

  return {
    visibleProjects,
    hasMore,
    loadMore,
    shouldVirtualize,
    totalCount: optimizedProjects.length,
  };
}
