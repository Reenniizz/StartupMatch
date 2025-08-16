import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Grid3X3,
  List,
  Settings,
  MapPin,
  Briefcase,
  Star,
  X
} from 'lucide-react';
import { SortBy, ViewMode, ExploreFilters } from '../types';

interface ExploreHeaderProps {
  profilesCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: ExploreFilters;
  onFiltersChange: (filters: Partial<ExploreFilters>) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

export function ExploreHeader({
  profilesCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh
}: ExploreHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  const filterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (Array.isArray(value)) {
      return count + (value.length > 0 ? 1 : 0);
    }
    return count + (value ? 1 : 0);
  }, 0);

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Title & Stats */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              Explorar
            </h1>
            <p className="text-gray-600 mt-1">
              Descubre {profilesCount.toLocaleString()} emprendedores y creadores
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa, skills..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Sort */}
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          >
            <option value="recent">Más recientes</option>
            <option value="match_percentage">Mejor match</option>
            <option value="connections">Más conectados</option>
            <option value="name">Por nombre</option>
          </select>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-3 border rounded-lg transition-all duration-200 min-w-[120px] ${
              showFilters || hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {filterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            
            {filters.location && (
              <FilterTag 
                label={`📍 ${filters.location}`}
                onRemove={() => onFiltersChange({ location: undefined })}
              />
            )}
            
            {filters.role && (
              <FilterTag 
                label={`💼 ${filters.role}`}
                onRemove={() => onFiltersChange({ role: undefined })}
              />
            )}
            
            {filters.skills && filters.skills.length > 0 && (
              <FilterTag 
                label={`🔧 ${filters.skills.length} skill${filters.skills.length > 1 ? 's' : ''}`}
                onRemove={() => onFiltersChange({ skills: [] })}
              />
            )}
            
            {filters.isVerified && (
              <FilterTag 
                label="✅ Verificado"
                onRemove={() => onFiltersChange({ isVerified: undefined })}
              />
            )}
            
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filtros avanzados</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ubicación
                </label>
                <select 
                  value={filters.location || ''} 
                  onChange={(e) => onFiltersChange({ location: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas</option>
                  <option value="Madrid">Madrid</option>
                  <option value="Barcelona">Barcelona</option>
                  <option value="Valencia">Valencia</option>
                  <option value="Sevilla">Sevilla</option>
                  <option value="Bilbao">Bilbao</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Rol
                </label>
                <select 
                  value={filters.role || ''} 
                  onChange={(e) => onFiltersChange({ role: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="Founder">Fundador</option>
                  <option value="Co-founder">Co-fundador</option>
                  <option value="CTO">CTO</option>
                  <option value="CEO">CEO</option>
                  <option value="Developer">Desarrollador</option>
                  <option value="Designer">Diseñador</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Investor">Inversor</option>
                </select>
              </div>

              {/* Looking For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Busca
                </label>
                <select 
                  value={filters.lookingFor || ''} 
                  onChange={(e) => onFiltersChange({ lookingFor: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todo</option>
                  <option value="Co-founder">Co-fundador</option>
                  <option value="Investor">Inversor</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Developer">Desarrollador</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Clients">Clientes</option>
                </select>
              </div>

              {/* Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-1" />
                  Estado
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.isVerified || false}
                      onChange={(e) => onFiltersChange({ isVerified: e.target.checked || undefined })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Solo verificados
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-3">
              <button 
                onClick={onClearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar todo
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Tag Component
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
