/**
 * Global State Management with Zustand
 * Replaces excessive local useState with centralized state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project, ProjectCategory, ProjectSearchFilters, ProjectsResponse } from '@/types/projects';

// Projects State Interface
interface ProjectsState {
  // Data
  projects: Project[];
  myProjects: Project[];
  myApplications: Project[];
  recommendedProjects: Project[];
  categories: ProjectCategory[];
  
  // UI State
  activeTab: 'discover' | 'my-projects' | 'applications';
  selectedProject: Project | null;
  isModalOpen: boolean;
  
  // Filters & Pagination
  filters: ProjectSearchFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Loading & Error states
  loading: {
    projects: boolean;
    myProjects: boolean;
    categories: boolean;
  };
  error: string | null;
  
  // Actions
  setActiveTab: (tab: 'discover' | 'my-projects' | 'applications') => void;
  setProjects: (projects: Project[]) => void;
  setMyProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setModalOpen: (open: boolean) => void;
  setFilters: (filters: ProjectSearchFilters) => void;
  setPagination: (pagination: Partial<ProjectsState['pagination']>) => void;
  setLoading: (key: keyof ProjectsState['loading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex actions
  openProjectModal: (project: Project) => void;
  closeProjectModal: () => void;
  removeProject: (projectId: string) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  projects: [],
  myProjects: [],
  myApplications: [],
  recommendedProjects: [],
  categories: [],
  
  activeTab: 'discover' as const,
  selectedProject: null,
  isModalOpen: false,
  
  filters: {
    page: 1,
    limit: 12
  },
  
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  },
  
  loading: {
    projects: false,
    myProjects: false,
    categories: false
  },
  
  error: null
};

// Zustand Store
export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Simple setters
      setActiveTab: (tab) => set({ activeTab: tab }, false, 'setActiveTab'),
      
      setProjects: (projects) => set({ projects }, false, 'setProjects'),
      
      setMyProjects: (myProjects) => set({ myProjects }, false, 'setMyProjects'),
      
      setSelectedProject: (project) => set({ selectedProject: project }, false, 'setSelectedProject'),
      
      setModalOpen: (open) => set({ isModalOpen: open }, false, 'setModalOpen'),
      
      setFilters: (filters) => set({ filters }, false, 'setFilters'),
      
      setPagination: (newPagination) => 
        set((state) => ({
          pagination: { ...state.pagination, ...newPagination }
        }), false, 'setPagination'),
      
      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading }
        }), false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      // Complex actions
      openProjectModal: (project) => {
        set({
          selectedProject: project,
          isModalOpen: true
        }, false, 'openProjectModal');
      },
      
      closeProjectModal: () => {
        set({
          selectedProject: null,
          isModalOpen: false
        }, false, 'closeProjectModal');
      },
      
      removeProject: (projectId) => {
        const { myProjects } = get();
        set({
          myProjects: myProjects.filter(p => p.id !== projectId),
          // Close modal if the deleted project was selected
          ...(get().selectedProject?.id === projectId && {
            selectedProject: null,
            isModalOpen: false
          })
        }, false, 'removeProject');
      },
      
      reset: () => set(initialState, false, 'reset')
    }),
    {
      name: 'projects-store', // DevTools name
    }
  )
);

// Selectors for better performance
export const useProjectsData = () => useProjectsStore((state) => ({
  projects: state.projects,
  myProjects: state.myProjects,
  myApplications: state.myApplications,
  recommendedProjects: state.recommendedProjects,
  categories: state.categories
}));

export const useProjectsUI = () => useProjectsStore((state) => ({
  activeTab: state.activeTab,
  selectedProject: state.selectedProject,
  isModalOpen: state.isModalOpen,
  setActiveTab: state.setActiveTab,
  openProjectModal: state.openProjectModal,
  closeProjectModal: state.closeProjectModal
}));

export const useProjectsLoading = () => useProjectsStore((state) => ({
  loading: state.loading,
  error: state.error,
  setLoading: state.setLoading,
  setError: state.setError
}));

export const useProjectsFilters = () => useProjectsStore((state) => ({
  filters: state.filters,
  pagination: state.pagination,
  setFilters: state.setFilters,
  setPagination: state.setPagination
}));
