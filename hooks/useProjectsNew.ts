/**
 * Projects Business Logic Hooks
 * Separates API calls and business logic from UI components
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useProjectsStore } from '@/store/projects';

// Type definitions (if not available, we'll use basic types)
interface Project {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

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
 * Hook for managing Discover Projects operations
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

      const response = await fetch(`/api/projects?${params}`);
      
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
        setFilters({ ...filters, ...newFilters });
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading('projects', false);
    }
  }, [filters, pagination, setProjects, setLoading, setError, setPagination, setFilters]);

  const handleSearch = useCallback((searchTerm: string) => {
    loadProjects({ ...filters, search: searchTerm, page: 1 });
  }, [filters, loadProjects]);

  const handleFilterChange = useCallback((newFilters: any) => {
    loadProjects({ ...filters, ...newFilters, page: 1 });
  }, [filters, loadProjects]);

  const handlePageChange = useCallback((page: number) => {
    loadProjects({ ...filters, page });
  }, [filters, loadProjects]);

  return {
    projects,
    filters,
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
