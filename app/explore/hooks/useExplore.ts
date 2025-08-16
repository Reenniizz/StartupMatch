import { useState, useEffect, useCallback } from 'react';
import { UserProfile, ExploreState, ExploreFilters, SortBy } from '../types';

export function useExplore() {
  const [state, setState] = useState<ExploreState>({
    profiles: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 1
  });

  const [filters, setFilters] = useState<ExploreFilters>({});
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  // Load profiles
  const loadProfiles = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : state.page;
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        page: currentPage 
      }));

      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        sort: sortBy,
        limit: '12'
      });

      // Add filters to search params
      if (filters.location) searchParams.set('location', filters.location);
      if (filters.role) searchParams.set('role', filters.role);
      if (filters.lookingFor) searchParams.set('looking_for', filters.lookingFor);
      if (filters.experience) searchParams.set('experience', filters.experience);
      if (filters.company) searchParams.set('company', filters.company);
      if (filters.isVerified) searchParams.set('verified', 'true');
      if (filters.skills && filters.skills.length > 0) {
        searchParams.set('skills', filters.skills.join(','));
      }

      const response = await fetch(`/api/explore?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar perfiles');
      }

      const data = await response.json();
      const newProfiles: UserProfile[] = data.profiles || [];

      setState(prev => ({
        ...prev,
        profiles: reset ? newProfiles : [...prev.profiles, ...newProfiles],
        loading: false,
        hasMore: data.hasMore || false,
        page: currentPage
      }));

    } catch (error) {
      console.error('Error loading profiles:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, [state.page, sortBy, filters]);

  // Load more profiles (pagination)
  const loadMore = () => {
    if (!state.loading && state.hasMore) {
      setState(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // Refresh profiles
  const refresh = () => {
    loadProfiles(true);
  };

  // Update filters
  const updateFilters = (newFilters: Partial<ExploreFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setState(prev => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setState(prev => ({ ...prev, page: 1 }));
  };

  // Update sort
  const updateSort = (newSort: SortBy) => {
    setSortBy(newSort);
    setState(prev => ({ ...prev, page: 1 }));
  };

  // Load profiles when dependencies change
  useEffect(() => {
    loadProfiles(true);
  }, [sortBy, filters]);

  return {
    ...state,
    filters,
    sortBy,
    loadMore,
    refresh,
    updateFilters,
    clearFilters,
    updateSort
  };
}
