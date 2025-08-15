/**
 * Optimized Search Component
 * Solves: Re-renders en cada keystroke + API calls excesivas
 */

'use client';

import React, { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useStableCallback } from '@/hooks/useMemoization';

interface OptimizedSearchProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  className?: string;
}

export const OptimizedSearch = memo<OptimizedSearchProps>(({
  onSearch,
  placeholder = 'Buscar proyectos...',
  debounceMs = 500,
  minLength = 2,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // OPTIMIZATION 1: Debounce del valor de búsqueda
  const debouncedSearchTerm = useDebounce(
    searchTerm,
    debounceMs,
    {
      leading: false,
      maxWait: 2000, // Máximo 2s de espera
    }
  );

  // OPTIMIZATION 2: Callback estable para evitar re-renders en padres
  const handleSearchChange = useStableCallback(
    (value: string) => {
      if (value.length === 0 || value.length >= minLength) {
        onSearch(value);
      }
    },
    [onSearch, minLength]
  );

  // Ejecutar búsqueda cuando el valor debounced cambie
  React.useEffect(() => {
    handleSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, handleSearchChange]);

  // OPTIMIZATION 3: Handler optimizado para input
  const handleInputChange = useStableCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      
      // Búsqueda inmediata si se borra el campo
      if (value === '') {
        onSearch('');
      }
    },
    [onSearch]
  );

  // OPTIMIZATION 4: Clear handler estable
  const handleClear = useStableCallback(() => {
    setSearchTerm('');
    onSearch('');
  }, [onSearch]);

  // OPTIMIZATION 5: Submit handler para evitar refresh
  const handleSubmit = useStableCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchTerm);
    },
    [onSearch, searchTerm]
  );

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Indicador visual de debounce para debugging */}
      {process.env.NODE_ENV === 'development' && searchTerm !== debouncedSearchTerm && (
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          Buscando: {searchTerm} → {debouncedSearchTerm}
        </div>
      )}
    </form>
  );
});

OptimizedSearch.displayName = 'OptimizedSearch';

// OPTIMIZATION 6: Hook personalizado para manejo de búsqueda
export function useOptimizedSearch(
  onSearch: (term: string) => void,
  options: {
    debounceMs?: number;
    minLength?: number;
    maxLength?: number;
  } = {}
) {
  const {
    debounceMs = 500,
    minLength = 2,
    maxLength = 100,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Ejecutar búsqueda cuando el término cambie
  React.useEffect(() => {
    const trimmedTerm = debouncedSearchTerm.trim();
    
    if (trimmedTerm.length === 0 || 
        (trimmedTerm.length >= minLength && trimmedTerm.length <= maxLength)) {
      setIsSearching(true);
      onSearch(trimmedTerm);
      // Simular que la búsqueda terminó después de un delay
      const timeout = setTimeout(() => setIsSearching(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [debouncedSearchTerm, onSearch, minLength, maxLength]);

  const updateSearchTerm = useStableCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useStableCallback(() => {
    setSearchTerm('');
    onSearch('');
    setIsSearching(false);
  }, [onSearch]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
  };
}
