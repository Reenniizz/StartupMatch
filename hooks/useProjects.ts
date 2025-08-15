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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`/api/projects?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes cache
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    const data: ProjectsResponse = await response.json();
    return data.projects || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function createProject(projectData: Partial<Project>): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }

  return response.json();
}

async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }

  return response.json();
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete project');
  }
}

// === FASE 2: OPTIMIZED QUERY KEYS ===
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectSearchFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  infinite: (filters: ProjectSearchFilters) => [...projectKeys.all, 'infinite', filters] as const,
};

// === OPTIMIZED HOOKS WITH PERFORMANCE ENHANCEMENTS ===

export function useProjects() {
  const searchFilters = useAppStore((state) => state.searchFilters);
  const actions = useAppActions();

  const query = useQuery({
    queryKey: projectKeys.list(searchFilters),
    queryFn: () => fetchProjects(searchFilters),
    // === FASE 2: ADVANCED CACHING STRATEGIES ===
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache (was cacheTime in v4)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Keep previous data while fetching new data for better UX
    placeholderData: (previousData, previousQuery) => previousData,
    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // === OPTIMIZED SIDE EFFECTS HANDLING ===
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      actions.setProjects(query.data);
    }
  }, [query.isSuccess, query.data, actions]);

  React.useEffect(() => {
    if (query.isError && query.error) {
      actions.addNotification({
        type: 'error',
        title: 'Error loading projects',
        message: query.error instanceof Error ? query.error.message : 'Unknown error',
        read: false
      });
    }
  }, [query.isError, query.error, actions]);

  return query;
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      return response.json();
    },
    enabled: !!id, // Only run if id is provided
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const actions = useAppActions();

  return useMutation({
    mutationFn: createProject,
    // === FASE 2: OPTIMISTIC UPDATES ===
    onMutate: async (newProjectData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot the previous value for rollback
      const previousProjects = queryClient.getQueryData(projectKeys.lists());

      // Create temporary project for optimistic update
      const tempProject: Project = {
        id: `temp-${Date.now()}`,
        title: newProjectData.title || 'New Project',
        description: newProjectData.description || '',
        category: newProjectData.category || 'startup',
        stage: newProjectData.stage || 'idea',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newProjectData,
      } as Project;

      // Optimistically update cache
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: Project[] = []) => [
        tempProject,
        ...old
      ]);

      // Add to Zustand store immediately
      actions.addProject(tempProject);

      return { previousProjects, tempProject };
    },
    onSuccess: (newProject, variables, context) => {
      // Replace temp project with real project
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: Project[] = []) =>
        old.map(project => 
          project.id === context?.tempProject.id ? newProject : project
        )
      );
      
      // Update Zustand store with real project
      actions.updateProject(context?.tempProject.id || '', newProject);
      
      // Show success notification
      actions.addNotification({
        type: 'success',
        title: 'Project created',
        message: `${newProject.title} has been created successfully`,
        read: false
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }

      // Remove temp project from store
      if (context?.tempProject) {
        actions.removeProject(context.tempProject.id);
      }

      actions.addNotification({
        type: 'error',
        title: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
        read: false
      });
    },
    // Settle - called after either onSuccess or onError
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const actions = useAppActions();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      updateProject(id, updates),
    onSuccess: (updatedProject) => {
      // Update specific project cache
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id),
        updatedProject
      );
      
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Update Zustand store
      actions.updateProject(updatedProject.id, updatedProject);
      
      // Show success notification
      actions.addNotification({
        type: 'success',
        title: 'Project updated',
        message: `${updatedProject.title} has been updated`,
        read: false
      });
    },
    onError: (error) => {
      actions.addNotification({
        type: 'error',
        title: 'Failed to update project',
        message: error instanceof Error ? error.message : 'Unknown error',
        read: false
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const actions = useAppActions();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Update Zustand store
      actions.removeProject(deletedId);
      
      // Show success notification
      actions.addNotification({
        type: 'success',
        title: 'Project deleted',
        message: 'Project has been deleted successfully',
        read: false
      });
    },
    onError: (error) => {
      actions.addNotification({
        type: 'error',
        title: 'Failed to delete project',
        message: error instanceof Error ? error.message : 'Unknown error',
        read: false
      });
    },
  });
}

// Optimistic updates hook
export function useOptimisticProjectUpdate() {
  const queryClient = useQueryClient();
  const actions = useAppActions();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      updateProject(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(id));

      // Optimistically update to the new value
      if (previousProject) {
        const optimisticProject = { ...previousProject, ...updates };
        queryClient.setQueryData(projectKeys.detail(id), optimisticProject);
        actions.updateProject(id, updates);
      }

      return { previousProject };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.id),
          context.previousProject
        );
      }
      
      actions.addNotification({
        type: 'error',
        title: 'Update failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        read: false
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
}

// === FASE 2: INFINITE SCROLL OPTIMIZATION ===

async function fetchProjectsInfinite({ 
  pageParam = 1, 
  filters 
}: { 
  pageParam: number; 
  filters: ProjectSearchFilters 
}): Promise<{ projects: Project[]; nextCursor?: number; hasNextPage: boolean }> {
  const paginatedFilters = { ...filters, page: pageParam, limit: 12 };
  const projects = await fetchProjects(paginatedFilters);
  
  return {
    projects,
    nextCursor: projects.length === 12 ? pageParam + 1 : undefined,
    hasNextPage: projects.length === 12,
  };
}

export function useInfiniteProjects() {
  const searchFilters = useAppStore((state) => state.searchFilters);
  const actions = useAppActions();

  const query = useInfiniteQuery({
    queryKey: projectKeys.infinite(searchFilters),
    queryFn: ({ pageParam = 1 }) => 
      fetchProjectsInfinite({ pageParam, filters: searchFilters }),
    // === OPTIMIZED INFINITE QUERY CONFIGURATION ===
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage, pages) => {
      return pages.length > 1 ? 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    maxPages: 10, // Limit memory usage
  });

  // Flatten all pages into single array
  const allProjects = React.useMemo(
    () => query.data?.pages.flatMap(page => page.projects) ?? [],
    [query.data]
  );

  // Update store with flattened data
  React.useEffect(() => {
    if (query.isSuccess && allProjects.length > 0) {
      actions.setProjects(allProjects);
    }
  }, [query.isSuccess, allProjects, actions]);

  return {
    ...query,
    projects: allProjects,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

// === BACKGROUND REFETCH HOOK ===
export function useProjectsBackgroundSync() {
  const queryClient = useQueryClient();
  const searchFilters = useAppStore((state) => state.searchFilters);

  React.useEffect(() => {
    // Background refetch every 5 minutes when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        queryClient.invalidateQueries({ 
          queryKey: projectKeys.list(searchFilters),
          refetchType: 'active' 
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient, searchFilters]);
}
