import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowUpDown, TrendingUp, Calendar, Heart, Eye, Users, SortAsc } from 'lucide-react';

interface ProjectSortingProps {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const SORT_OPTIONS = [
  {
    value: 'recent',
    label: 'Más Recientes',
    icon: Calendar,
    description: 'Proyectos creados recientemente'
  },
  {
    value: 'popular',
    label: 'Más Populares',
    icon: TrendingUp,
    description: 'Proyectos con más interacciones'
  },
  {
    value: 'trending',
    label: 'Tendencia',
    icon: TrendingUp,
    description: 'Proyectos con crecimiento rápido'
  },
  {
    value: 'views',
    label: 'Más Vistos',
    icon: Eye,
    description: 'Ordenar por número de vistas'
  },
  {
    value: 'likes',
    label: 'Más Gustados',
    icon: Heart,
    description: 'Ordenar por likes recibidos'
  },
  {
    value: 'applications',
    label: 'Más Solicitados',
    icon: Users,
    description: 'Proyectos con más aplicaciones'
  },
  {
    value: 'alphabetical',
    label: 'Alfabético',
    icon: SortAsc,
    description: 'Ordenar por nombre del proyecto'
  }
];

export function ProjectSorting({ sortBy = 'recent', sortOrder = 'desc', onSortChange }: ProjectSortingProps) {
  const handleSortChange = (value: string) => {
    // Determine default sort order for each sort type
    let defaultOrder: 'asc' | 'desc' = 'desc';
    if (value === 'alphabetical') {
      defaultOrder = 'asc';
    }
    
    // If same sort type is selected, toggle order, otherwise use default
    const newOrder = value === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : defaultOrder;
    
    onSortChange(value, newOrder);
  };

  const currentOption = SORT_OPTIONS.find(option => option.value === sortBy);

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium whitespace-nowrap">Ordenar por:</Label>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            {currentOption && <currentOption.icon className="h-4 w-4" />}
            <SelectValue placeholder="Seleccionar orden" />
            <ArrowUpDown className={`h-3 w-3 ml-auto transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
