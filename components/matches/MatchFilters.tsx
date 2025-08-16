/**
 * MatchFilters Component - Advanced filtering for matches
 * Provides search and filtering capabilities
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useMatchesStore } from '@/store/matches';

export const MatchFilters: React.FC = () => {
  const { filters, setFilters } = useMatchesStore();

  const industries = [
    'all', 'Tecnología', 'Fintech', 'Salud', 'Educación', 'E-commerce', 
    'Marketing', 'Consultoría', 'Manufactura', 'Entretenimiento'
  ];

  const experienceLevels = [
    'all', '0-2 años', '3-5 años', '6-10 años', '10+ años'
  ];

  const locations = [
    'all', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 
    'Málaga', 'Remoto', 'Internacional'
  ];

  const sortOptions = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'compatibility', label: 'Mayor compatibilidad' },
    { value: 'mutual_connections', label: 'Más conexiones mutuas' }
  ];

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value.length > 0;
    if (key === 'compatibility') return value[0] > 0 || value[1] < 100;
    return value !== 'all';
  }).length;

  const clearFilters = () => {
    setFilters({
      search: '',
      industry: 'all',
      experience: 'all',
      location: 'all',
      compatibility: [0, 100],
      sortBy: 'recent'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, empresa o skills..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  variant="destructive"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filtros avanzados</h4>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Industry Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Industria</label>
              <Select 
                value={filters.industry} 
                onValueChange={(value) => setFilters({ industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona industria" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry === 'all' ? 'Todas las industrias' : industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Experiencia</label>
              <Select 
                value={filters.experience} 
                onValueChange={(value) => setFilters({ experience: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona experiencia" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level === 'all' ? 'Todos los niveles' : level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Select 
                value={filters.location} 
                onValueChange={(value) => setFilters({ location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location === 'all' ? 'Todas las ubicaciones' : location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compatibility Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Compatibilidad</label>
                <span className="text-sm text-gray-500">
                  {filters.compatibility[0]}% - {filters.compatibility[1]}%
                </span>
              </div>
              <Slider
                value={filters.compatibility}
                onValueChange={(value) => setFilters({ compatibility: value as [number, number] })}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value: any) => setFilters({ sortBy: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-gray-500">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpiar todo
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
