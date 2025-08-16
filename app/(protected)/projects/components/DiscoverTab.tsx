import { motion } from 'framer-motion';
import { ProjectWithOwner, ViewMode } from '../types';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { 
  Search,
  Filter,
  Plus,
  TrendingUp,
  Star,
  Clock,
  Users,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiscoverTabProps {
  projects: ProjectWithOwner[];
  loading: boolean;
  viewMode: ViewMode;
  onLike: (projectId: string) => void;
  onBookmark: (projectId: string) => void;
  onApply: (projectId: string) => void;
  onView: (project: ProjectWithOwner) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function DiscoverTab({
  projects,
  loading,
  viewMode,
  onLike,
  onBookmark,
  onApply,
  onView,
  onLoadMore,
  hasMore,
  loadingMore
}: DiscoverTabProps) {
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
        type="no-results"
        onClearFilters={() => {}}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Featured Projects Section */}
      {projects.some(p => p.is_featured) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <h3 className="text-lg font-semibold text-gray-900">
              Proyectos Destacados
            </h3>
          </div>
          
          <div className={`grid gap-6 mb-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {projects
              .filter(project => project.is_featured)
              .slice(0, 3)
              .map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onLike={onLike}
                  onBookmark={onBookmark}
                  onApply={onApply}
                  onView={onView}
                  showOwner={true}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* Regular Projects */}
      <div>
        {projects.some(p => p.is_featured) && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Todos los Proyectos
            </h3>
          </div>
        )}
        
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {projects
            .filter(project => !project.is_featured)
            .map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onLike={onLike}
                onBookmark={onBookmark}
                onApply={onApply}
                onView={onView}
                showOwner={true}
              />
            ))
          }
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Cargar Más Proyectos
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
