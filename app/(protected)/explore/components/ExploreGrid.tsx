import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, ViewMode } from '../types';
import { ProfileCard } from './ProfileCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter,
  ArrowUpDown,
  Grid3X3,
  List
} from 'lucide-react';

interface ExploreGridProps {
  profiles: UserProfile[];
  loading: boolean;
  viewMode: ViewMode;
  onProfileLike?: (profileId: string) => void;
  onProfileMessage?: (profileId: string) => void;
  onProfileView?: (profileId: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  searchQuery?: string;
  filtersActive?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function ExploreGrid({
  profiles,
  loading,
  viewMode,
  onProfileLike,
  onProfileMessage,
  onProfileView,
  onViewModeChange,
  searchQuery,
  filtersActive = 0
}: ExploreGridProps) {
  // Loading state
  if (loading) {
    return <LoadingState viewMode={viewMode} />;
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <EmptyExploreState 
        searchQuery={searchQuery}
        filtersActive={filtersActive}
      />
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        {/* Results header */}
        <ResultsHeader 
          count={profiles.length}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          searchQuery={searchQuery}
          filtersActive={filtersActive}
        />
        
        {/* Grid container */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileCard
                  profile={profile}
                  viewMode="grid"
                  onLike={() => onProfileLike?.(profile.id)}
                  onMessage={() => onProfileMessage?.(profile.id)}
                  onView={() => onProfileView?.(profile.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Results header */}
      <ResultsHeader 
        count={profiles.length}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        searchQuery={searchQuery}
        filtersActive={filtersActive}
      />
      
      {/* List container */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              variants={item}
              layout
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileCard
                profile={profile}
                viewMode="list"
                onLike={() => onProfileLike?.(profile.id)}
                onMessage={() => onProfileMessage?.(profile.id)}
                onView={() => onProfileView?.(profile.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Results Header Component
function ResultsHeader({
  count,
  viewMode,
  onViewModeChange,
  searchQuery,
  filtersActive
}: {
  count: number;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  searchQuery?: string;
  filtersActive: number;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            <strong className="text-gray-900">{count.toLocaleString()}</strong> 
            {' '}emprendedores encontrados
          </span>
        </div>
        
        {searchQuery && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
            <Search className="w-3 h-3" />
            <span>"{searchQuery}"</span>
          </div>
        )}
        
        {filtersActive > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">
            <Filter className="w-3 h-3" />
            <span>{filtersActive} filtros activos</span>
          </div>
        )}
      </div>
      
      {/* View mode toggle */}
      {onViewModeChange && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Vista en cuadrícula"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Vista en lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Loading State Component
function LoadingState({ viewMode }: { viewMode: ViewMode }) {
  const skeletonCount = viewMode === 'grid' ? 12 : 8;
  
  return (
    <div className="space-y-6">
      {/* Loading header */}
      <div className="flex items-center justify-between py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
      
      {/* Loading grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-t-xl animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="flex gap-2 pt-4">
                  <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyExploreState({ 
  searchQuery, 
  filtersActive 
}: { 
  searchQuery?: string; 
  filtersActive: number; 
}) {
  const hasSearch = Boolean(searchQuery?.trim());
  const hasFilters = filtersActive > 0;
  
  if (hasSearch || hasFilters) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No encontramos resultados
          </h3>
          <p className="text-gray-600 mb-6">
            {hasSearch && hasFilters && (
              <>No hay emprendedores que coincidan con tu búsqueda "<strong>{searchQuery}</strong>" y los filtros aplicados.</>
            )}
            {hasSearch && !hasFilters && (
              <>No hay emprendedores que coincidan con "<strong>{searchQuery}</strong>".</>
            )}
            {!hasSearch && hasFilters && (
              <>No hay emprendedores que coincidan con los filtros aplicados.</>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Limpiar filtros
            </button>
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Modificar búsqueda
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          ¡Descubre emprendedores increíbles!
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Explora perfiles de emprendedores, encuentra colaboradores para tus proyectos 
          y conecta con personas que comparten tus intereses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4" />
            Usar filtros
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
            Ordenar resultados
          </button>
        </div>
      </div>
    </div>
  );
}
