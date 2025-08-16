import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus,
  SlidersHorizontal,
  X,
  Grid3X3,
  List,
  TrendingUp,
  Rocket,
  Users,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ProjectFilters, 
  SortBy, 
  ViewMode, 
  ProjectStats 
} from '../types';
import { useState } from 'react';

interface ProjectsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: ProjectFilters;
  onFiltersChange: (filters: Partial<ProjectFilters>) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFilters: boolean;
  onToggleFilters: (show: boolean) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  stats: ProjectStats | null;
  onCreateProject?: () => void;
}

export function ProjectsHeader({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearFilters,
  stats,
  onCreateProject
}: ProjectsHeaderProps) {
  const sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'most_liked', label: 'Más populares' },
    { value: 'most_applied', label: 'Más aplicaciones' },
    { value: 'deadline_soon', label: 'Fecha límite' },
    { value: 'relevance', label: 'Más relevantes' }
  ];

  const getCurrentSortLabel = () => {
    return sortOptions.find(opt => opt.value === sortBy)?.label || 'Ordenar';
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Proyectos
              </h1>
              <p className="text-gray-600">
                Descubre proyectos emocionantes o comparte los tuyos con la comunidad
              </p>
            </div>

            {/* Create Project Button */}
            {onCreateProject && (
              <Button
                onClick={onCreateProject}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                Crear Proyecto
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatsCard
                icon={Rocket}
                label="Proyectos Totales"
                value={stats.total_projects}
                color="blue"
              />
              <StatsCard
                icon={BookOpen}
                label="Mis Proyectos"
                value={stats.my_projects}
                color="green"
              />
              <StatsCard
                icon={Users}
                label="Aplicaciones Enviadas"
                value={stats.applications_sent}
                color="purple"
              />
              <StatsCard
                icon={TrendingUp}
                label="Colaboraciones Activas"
                value={stats.active_collaborations}
                color="orange"
              />
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar proyectos por título, descripción, tecnologías..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {/* Filters Button */}
              <button
                onClick={() => onToggleFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors text-sm ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortBy)}
                  className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm min-w-[160px]"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-3 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-3 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mt-4"
            >
              <span className="text-sm text-gray-600">Filtros activos:</span>
              
              {filters.categories.length > 0 && (
                <FilterTag
                  label={`${filters.categories.length} categoría${filters.categories.length > 1 ? 's' : ''}`}
                  onRemove={() => onFiltersChange({ categories: [] })}
                />
              )}
              
              {filters.skills.length > 0 && (
                <FilterTag
                  label={`${filters.skills.length} habilidad${filters.skills.length > 1 ? 'es' : ''}`}
                  onRemove={() => onFiltersChange({ skills: [] })}
                />
              )}
              
              {filters.location && (
                <FilterTag
                  label={`Ubicación: ${filters.location}`}
                  onRemove={() => onFiltersChange({ location: '' })}
                />
              )}
              
              {filters.remote_only && (
                <FilterTag
                  label="Solo remoto"
                  onRemove={() => onFiltersChange({ remote_only: false })}
                />
              )}
              
              {filters.is_paid && (
                <FilterTag
                  label="Solo pagados"
                  onRemove={() => onFiltersChange({ is_paid: false })}
                />
              )}
              
              {filters.has_equity && (
                <FilterTag
                  label="Con equity"
                  onRemove={() => onFiltersChange({ has_equity: false })}
                />
              )}
              
              {filters.is_featured && (
                <FilterTag
                  label="Destacados"
                  onRemove={() => onFiltersChange({ is_featured: false })}
                />
              )}

              <button
                onClick={onClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Limpiar todo
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: typeof Rocket;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <div className="text-2xl font-bold">
            {value.toLocaleString()}
          </div>
          <div className="text-sm opacity-80">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter Tag Component
function FilterTag({ 
  label, 
  onRemove 
}: { 
  label: string; 
  onRemove: () => void; 
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full border border-blue-200">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
