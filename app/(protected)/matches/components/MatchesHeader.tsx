import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Heart,
  Settings,
  RotateCcw
} from 'lucide-react';
import { TabType } from '../types';

interface MatchesHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  discoverCount: number;
  mutualCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh?: () => void;
}

export function MatchesHeader({
  activeTab,
  onTabChange,
  discoverCount,
  mutualCount,
  searchQuery,
  onSearchChange,
  onRefresh
}: MatchesHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-pink-500" />
              Matches
            </h1>
            <p className="text-gray-600 mt-1">
              Descubre conexiones perfectas para tu startup
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar matches"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'text-blue-600 bg-blue-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Filtros"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => onTabChange('discover')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'discover'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Descubrir</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'discover' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {discoverCount}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('mutual')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'mutual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Conexiones</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'mutual' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {mutualCount}
              </span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, skills, empresa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Filtros avanzados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Todas las ubicaciones</option>
                  <option value="madrid">Madrid</option>
                  <option value="barcelona">Barcelona</option>
                  <option value="valencia">Valencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Todos los sectores</option>
                  <option value="tech">Tecnología</option>
                  <option value="fintech">Fintech</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Todos los roles</option>
                  <option value="founder">Fundador</option>
                  <option value="cto">CTO</option>
                  <option value="investor">Inversor</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <button 
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
