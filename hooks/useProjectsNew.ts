/**
 * Projects Business Logic Hooks - PERFORMANCE OPTIMIZED
 * Separates API calls and business logic from UI components
 * Solves: N+1 queries, re-renders innecesarios, falta de debounce
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useProjectsStore } from '@/store/projects';
import { Project, ProjectSearchFilters } from '@/types/projects';
import { useDebounce, useDebouncedCallback } from './useDebounce';
import { useMemoObject, useStableCallback } from './useMemoization';

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook for managing "My Projects" operations
 */
export const useMyProjects = () => {
  const router = useRouter();
  const { user, session } = useAuth();
  const { 
    myProjects, 
    setMyProjects, 
    setLoading, 
    setError,
    removeProject,
    closeProjectModal 
  } = useProjectsStore();

  const loadMyProjects = useCallback(async () => {
    if (!session) {
      console.log('No session available');
      return;
    }

    setLoading('myProjects', true);
    setError(null);
    
    try {
      console.log('Loading projects for user:', session.user.id);
      const response = await fetch('/api/projects/my?tab=created');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', response.status, errorData);
        
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to login');
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load projects`);
      }

      const data = await response.json();
      console.log('My projects loaded:', data.projects?.length || 0, 'projects');
      setMyProjects(data.projects || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load my projects';
      setError(errorMessage);
      console.error('Error loading my projects:', error);
    } finally {
      setLoading('myProjects', false);
    }
  }, [session, setMyProjects, setLoading, setError, router]);

  const handleLike = useCallback(async (projectId: string) => {
    console.log('Like project:', projectId);
    // TODO: Implement like functionality
  }, []);

  const handleDelete = useCallback(async (projectId: string) => {
    // Close modal first
    closeProjectModal();
    
    // Optimistically remove from UI
    removeProject(projectId);
    
    try {
      // Make API call to delete
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      console.log('Project deleted successfully:', projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      // Reload projects to restore state if deletion failed
      loadMyProjects();
    }
  }, [closeProjectModal, removeProject, loadMyProjects]);

  const handleDeleteDialogOpen = useCallback(() => {
    closeProjectModal();
  }, [closeProjectModal]);

  return {
    myProjects,
    loadMyProjects,
    handleLike,
    handleDelete,
    handleDeleteDialogOpen
  };
};

/**
 * Hook for managing Discover Projects operations - PERFORMANCE OPTIMIZED
 */
export const useDiscoverProjects = () => {
  const { 
    projects, 
    filters, 
    pagination,
    setProjects, 
    setLoading, 
    setError,
    setPagination,
    setFilters
  } = useProjectsStore();

  // Optimizar filtros con memoización profunda
  const optimizedFilters = useMemoObject(filters, ['search', 'category', 'industry', 'stage']);

  const loadProjects = useCallback(async (newFilters?: any) => {
    setLoading('projects', true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Apply filters
      if (newFilters?.search) params.set('search', newFilters.search);
      if (newFilters?.category) params.set('category', newFilters.category);
      if (newFilters?.industry) params.set('industry', newFilters.industry);
      if (newFilters?.stage) params.set('stage', newFilters.stage);
      params.set('page', String(newFilters?.page || pagination.page));
      params.set('limit', String(newFilters?.limit || pagination.limit));

      // PERFORMANCE OPTIMIZATION: AbortController para cancelar requests anteriores
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`/api/projects?${params}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes cache
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data: ProjectsResponse = await response.json();
      
      setProjects(data.projects);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      });

      if (newFilters) {
        setFilters({ ...optimizedFilters, ...newFilters });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      setError(error.message || 'Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading('projects', false);
    }
  }, [optimizedFilters, pagination, setProjects, setLoading, setError, setPagination, setFilters]);

  // PERFORMANCE OPTIMIZATION: Debounce para búsquedas
  const debouncedLoadProjects = useDebouncedCallback(
    loadProjects,
    500, // 500ms delay
    { maxWait: 2000, deps: [loadProjects] }
  );

  const handleSearch = useStableCallback((searchTerm: string) => {
    // Si el término está vacío, hacer búsqueda inmediata
    if (!searchTerm.trim()) {
      loadProjects({ ...optimizedFilters, search: '', page: 1 });
    } else {
      // Para términos de búsqueda, usar debounce
      debouncedLoadProjects({ ...optimizedFilters, search: searchTerm, page: 1 });
    }
  }, [optimizedFilters, loadProjects, debouncedLoadProjects]);

  const handleFilterChange = useStableCallback((newFilters: any) => {
    loadProjects({ ...optimizedFilters, ...newFilters, page: 1 });
  }, [optimizedFilters, loadProjects]);

  const handlePageChange = useStableCallback((page: number) => {
    loadProjects({ ...optimizedFilters, page });
  }, [optimizedFilters, loadProjects]);

  return {
    projects,
    filters: optimizedFilters,
    pagination,
    loadProjects,
    handleSearch,
    handleFilterChange,
    handlePageChange
  };
};

/**
 * Hook for managing Projects tab logic
 */
export const useProjectsTabs = () => {
  const { activeTab, setActiveTab } = useProjectsStore();
  const { session, loading: authLoading } = useAuth();
  const { loadMyProjects } = useMyProjects();
  const { loadProjects } = useDiscoverProjects();

  // Auto-load data when tab changes
  useEffect(() => {
    if (authLoading) return;

    switch (activeTab) {
      case 'my-projects':
        if (session) {
          loadMyProjects();
        }
        break;
      case 'discover':
        loadProjects();
        break;
      case 'applications':
        // TODO: Load applications
        break;
    }
  }, [activeTab, session, authLoading, loadMyProjects, loadProjects]);

  return {
    activeTab,
    setActiveTab
  };
};
