import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectSearchFilters, Project, ProjectsResponse } from '@/types/projects';

interface UseProjectSearchResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  filters: ProjectSearchFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchProjects: (newFilters?: Partial<ProjectSearchFilters>) => Promise<void>;
  updateFilters: (newFilters: Partial<ProjectSearchFilters>) => void;
  resetFilters: () => void;
}

interface UseProjectSearchOptions {
  initialFilters?: Partial<ProjectSearchFilters>;
  apiEndpoint?: string;
  autoSearch?: boolean;
}

export function useProjectSearch({
  initialFilters = {},
  apiEndpoint = '/api/projects/search',
  autoSearch = true
}: UseProjectSearchOptions = {}): UseProjectSearchResult {
  const defaultFilters: ProjectSearchFilters = {
    page: 1,
    limit: 12,
    sort_by: 'recent',
    sort_order: 'desc',
    ...initialFilters
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectSearchFilters>(defaultFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const searchProjects = useCallback(async (newFilters?: Partial<ProjectSearchFilters>) => {
    const searchFilters = newFilters ? { ...filters, ...newFilters } : filters;
    
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Add all filter parameters
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.set(key, value.toString());
        }
      });

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: Failed to search projects`);
      }

      const data: ProjectsResponse = await response.json();

      setProjects(data.projects || []);
      setPagination(data.pagination || {
        page: searchFilters.page || 1,
        limit: searchFilters.limit || 12,
        total: 0,
        totalPages: 0
      });

      // Update filters if new ones were provided
      if (newFilters) {
        setFilters(searchFilters);
      }

    } catch (err: any) {
      let errorMessage = 'Error al buscar proyectos';
      
      // Handle different error types
      if (err.message) {
        if (err.message.includes('404')) {
          errorMessage = 'No se encontraron proyectos';
        } else if (err.message.includes('500')) {
          errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error searching projects:', err);
      
      // Reset projects and pagination on error
      setProjects([]);
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters, apiEndpoint]);

  const updateFilters = useCallback((newFilters: Partial<ProjectSearchFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      // Reset to first page when filters change (except when changing page)
      page: newFilters.page !== undefined ? newFilters.page : 1
    };

    setFilters(updatedFilters);

    if (autoSearch) {
      searchProjects(updatedFilters);
    }
  }, [filters, autoSearch, searchProjects]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setProjects([]);
    setPagination({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    });
    setError(null);

    if (autoSearch) {
      searchProjects(defaultFilters);
    }
  }, [defaultFilters, autoSearch, searchProjects]);

  // Auto search on mount if enabled
  useEffect(() => {
    if (autoSearch) {
      searchProjects();
    }
  }, []);

  // Memoized values
  const result = useMemo((): UseProjectSearchResult => ({
    projects,
    loading,
    error,
    filters,
    pagination,
    searchProjects,
    updateFilters,
    resetFilters
  }), [projects, loading, error, filters, pagination, searchProjects, updateFilters, resetFilters]);

  return result;
}
