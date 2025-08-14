import React, { useState, useEffect } from 'react';
import { ProjectSearchFilters, Project, ProjectCategory } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectFiltersProps {
  filters: ProjectSearchFilters;
  onFiltersChange: (filters: ProjectSearchFilters) => void;
  categories: ProjectCategory[];
  isLoading?: boolean;
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
  'Entertainment', 'Food & Beverage', 'Travel', 'Real Estate', 
  'Marketing', 'Consulting', 'Manufacturing', 'Other'
];

const STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launch', label: 'Launch' },
  { value: 'growth', label: 'Growth' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'exit', label: 'Exit' }
];

export function ProjectFilters({ filters, onFiltersChange, categories, isLoading }: ProjectFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProjectSearchFilters>(filters);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
    
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      onFiltersChange({ ...localFilters, search: value, page: 1 });
    }, 500);
    
    setSearchDebounce(timeout);
  };

  // Handle other filter changes
  const handleFilterChange = (key: keyof ProjectSearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: ProjectSearchFilters = { page: 1, limit: filters.limit };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Count active filters
  const activeFiltersCount = Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof ProjectSearchFilters];
    return value !== undefined && value !== '' && key !== 'page' && key !== 'limit';
  }).length;

  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar ({activeFiltersCount})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>Buscar proyectos</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripción..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select 
            value={localFilters.category || 'all'} 
            onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <div className="flex items-center gap-2">
                    <span>{category.display_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label>Industria</Label>
          <Select 
            value={localFilters.industry || 'all'} 
            onValueChange={(value) => handleFilterChange('industry', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las industrias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las industrias</SelectItem>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage */}
        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select 
            value={localFilters.stage || 'all'} 
            onValueChange={(value) => handleFilterChange('stage', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las etapas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seeking toggles */}
        <div className="space-y-4">
          <Label className="text-base">Buscando</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Co-fundadores</Label>
              <p className="text-xs text-muted-foreground">Proyectos buscando co-fundadores</p>
            </div>
            <Switch
              checked={localFilters.seeking_cofounder || false}
              onCheckedChange={(checked) => handleFilterChange('seeking_cofounder', checked || undefined)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-normal">Inversores</Label>
              <p className="text-xs text-muted-foreground">Proyectos buscando inversión</p>
            </div>
            <Switch
              checked={localFilters.seeking_investors || false}
              onCheckedChange={(checked) => handleFilterChange('seeking_investors', checked || undefined)}
            />
          </div>
        </div>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Filtros activos</Label>
            <div className="flex flex-wrap gap-2">
              {localFilters.search && (
                <Badge variant="secondary" className="text-xs">
                  Búsqueda: "{localFilters.search}"
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('search', '')}
                  />
                </Badge>
              )}
              {localFilters.category && (
                <Badge variant="secondary" className="text-xs">
                  Categoría: {categories.find(c => c.name === localFilters.category)?.display_name || localFilters.category}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('category', undefined)}
                  />
                </Badge>
              )}
              {localFilters.industry && (
                <Badge variant="secondary" className="text-xs">
                  Industria: {localFilters.industry}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('industry', undefined)}
                  />
                </Badge>
              )}
              {localFilters.stage && (
                <Badge variant="secondary" className="text-xs">
                  Etapa: {STAGES.find(s => s.value === localFilters.stage)?.label || localFilters.stage}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('stage', undefined)}
                  />
                </Badge>
              )}
              {localFilters.seeking_cofounder && (
                <Badge variant="secondary" className="text-xs">
                  Buscando co-fundadores
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('seeking_cofounder', undefined)}
                  />
                </Badge>
              )}
              {localFilters.seeking_investors && (
                <Badge variant="secondary" className="text-xs">
                  Buscando inversores
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('seeking_investors', undefined)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
