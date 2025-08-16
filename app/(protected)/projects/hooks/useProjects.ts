import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthProvider';
import type {
  Project,
  ProjectWithOwner,
  ProjectApplication,
  ProjectStats,
  ProjectState,
  ProjectFilters,
  ProjectFormData,
  SortBy,
  ViewMode,
  ProjectTab,
  ApplicationStatus
} from '../types';

const ITEMS_PER_PAGE = 20;

export function useProjects() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user } = useAuth();
  
  const [state, setState] = useState<ProjectState>({
    // Discover projects
    discoverProjects: [],
    discoverLoading: true,
    discoverHasMore: true,
    
    // My projects
    myProjects: [],
    myProjectsLoading: false,
    
    // Applications
    sentApplications: [],
    receivedApplications: [],
    applicationsLoading: false,
    
    // UI State
    activeTab: 'discover',
    viewMode: 'grid',
    selectedProject: null,
    isModalOpen: false,
    filters: {
      categories: [],
      skills: [],
      location: '',
      remote_only: false,
      budget_range: '',
      timeline: '',
      difficulty_level: [],
      commitment_level: [],
      collaboration_type: [],
      is_paid: false,
      has_equity: false,
      is_featured: false,
      date_range: {}
    },
    sortBy: 'newest',
    searchQuery: '',
    showFilters: false,
    
    // General
    stats: null,
    error: null
  });

  // Load discover projects
  const loadDiscoverProjects = useCallback(async (loadMore = false) => {
    if (!user) return;

    try {
      setState(prev => ({ 
        ...prev, 
        discoverLoading: true,
        error: null 
      }));

      const from = loadMore ? state.discoverProjects.length : 0;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          short_description,
          image_url,
          status,
          budget_range,
          timeline,
          location,
          remote_friendly,
          user_id,
          created_at,
          updated_at,
          skills_required,
          technologies,
          categories,
          difficulty_level,
          commitment_level,
          is_paid,
          is_featured,
          is_active,
          views_count,
          likes_count,
          applications_count,
          team_size,
          equity_percentage,
          project_url,
          github_url,
          demo_url,
          contact_email,
          external_links,
          tags,
          collaboration_type,
          owner:profiles!user_id (
            id,
            name,
            avatar_url,
            role,
            company,
            location,
            is_verified,
            is_premium
          )
        `)
        .eq('is_active', true)
        .neq('user_id', user.id);

      // Apply search
      if (state.searchQuery.trim()) {
        query = query.or(`
          title.ilike.%${state.searchQuery}%,
          description.ilike.%${state.searchQuery}%,
          skills_required.cs.{${state.searchQuery}},
          technologies.cs.{${state.searchQuery}},
          tags.cs.{${state.searchQuery}}
        `);
      }

      // Apply filters
      if (state.filters.categories.length > 0) {
        query = query.overlaps('categories', state.filters.categories);
      }
      
      if (state.filters.skills.length > 0) {
        query = query.overlaps('skills_required', state.filters.skills);
      }
      
      if (state.filters.location) {
        query = query.ilike('location', `%${state.filters.location}%`);
      }
      
      if (state.filters.remote_only) {
        query = query.eq('remote_friendly', true);
      }
      
      if (state.filters.is_paid) {
        query = query.eq('is_paid', true);
      }
      
      if (state.filters.has_equity) {
        query = query.not('equity_percentage', 'is', null);
      }
      
      if (state.filters.is_featured) {
        query = query.eq('is_featured', true);
      }
      
      if (state.filters.difficulty_level.length > 0) {
        query = query.in('difficulty_level', state.filters.difficulty_level);
      }
      
      if (state.filters.commitment_level.length > 0) {
        query = query.in('commitment_level', state.filters.commitment_level);
      }
      
      if (state.filters.collaboration_type.length > 0) {
        query = query.overlaps('collaboration_type', state.filters.collaboration_type);
      }

      // Apply sorting
      switch (state.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'most_applied':
          query = query.order('applications_count', { ascending: false });
          break;
        case 'deadline_soon':
          query = query.order('timeline', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Check for likes and bookmarks
      const projectIds = data?.map((p: any) => p.id) || [];
      const { data: likes } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('user_id', user.id)
        .in('project_id', projectIds);

      const { data: bookmarks } = await supabase
        .from('project_bookmarks')
        .select('project_id')
        .eq('user_id', user.id)
        .in('project_id', projectIds);

      const { data: applications } = await supabase
        .from('project_applications')
        .select('project_id, id, status')
        .eq('user_id', user.id)
        .in('project_id', projectIds);

      const likedProjectIds = new Set(likes?.map((l: any) => l.project_id) || []);
      const bookmarkedProjectIds = new Set(bookmarks?.map((b: any) => b.project_id) || []);
      const applicationsByProject = applications?.reduce((acc: any, app: any) => {
        acc[app.project_id] = app;
        return acc;
      }, {} as Record<string, any>) || {};

      const projectsWithExtras: ProjectWithOwner[] = data?.map((project: any) => ({
        ...project,
        owner: project.owner || {},
        is_liked: likedProjectIds.has(project.id),
        is_bookmarked: bookmarkedProjectIds.has(project.id),
        user_application: applicationsByProject[project.id]
      } as ProjectWithOwner)) || [];

      setState(prev => ({
        ...prev,
        discoverProjects: loadMore 
          ? [...prev.discoverProjects, ...projectsWithExtras]
          : projectsWithExtras,
        discoverLoading: false,
        discoverHasMore: (data?.length || 0) === ITEMS_PER_PAGE
      }));

    } catch (error) {
      console.error('Error loading discover projects:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading projects',
        discoverLoading: false
      }));
    }
  }, [user, supabase, state.searchQuery, state.filters, state.sortBy, state.discoverProjects.length]);

  // Load my projects
  const loadMyProjects = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, myProjectsLoading: true, error: null }));

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          short_description,
          image_url,
          status,
          budget_range,
          timeline,
          location,
          remote_friendly,
          user_id,
          created_at,
          updated_at,
          skills_required,
          technologies,
          categories,
          difficulty_level,
          commitment_level,
          is_paid,
          is_featured,
          is_active,
          views_count,
          likes_count,
          applications_count,
          team_size,
          equity_percentage,
          project_url,
          github_url,
          demo_url,
          contact_email,
          external_links,
          tags,
          collaboration_type,
          owner:profiles!user_id (
            id,
            name,
            avatar_url,
            role,
            company,
            location,
            is_verified,
            is_premium
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const myProjectsWithExtras: ProjectWithOwner[] = data?.map((project: any) => ({
        ...project,
        owner: project.owner || {}
      } as ProjectWithOwner)) || [];

      setState(prev => ({
        ...prev,
        myProjects: myProjectsWithExtras,
        myProjectsLoading: false
      }));

    } catch (error) {
      console.error('Error loading my projects:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading my projects',
        myProjectsLoading: false
      }));
    }
  }, [user, supabase]);

  // Load applications
  const loadApplications = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, applicationsLoading: true, error: null }));

      // Load sent applications
      const { data: sentApps, error: sentError } = await supabase
        .from('project_applications')
        .select(`
          id,
          project_id,
          user_id,
          message,
          portfolio_url,
          github_url,
          linkedin_url,
          status,
          created_at,
          updated_at,
          response_message,
          response_date,
          skills_offered,
          availability_hours,
          expected_equity,
          expected_payment,
          project:projects!project_id (
            id,
            title,
            image_url,
            status,
            user_id,
            owner:profiles!user_id (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Load received applications
      const { data: receivedApps, error: receivedError } = await supabase
        .from('project_applications')
        .select(`
          id,
          project_id,
          user_id,
          message,
          portfolio_url,
          github_url,
          linkedin_url,
          status,
          created_at,
          updated_at,
          response_message,
          response_date,
          skills_offered,
          availability_hours,
          expected_equity,
          expected_payment,
          applicant:profiles!user_id (
            id,
            name,
            avatar_url,
            role,
            company,
            location
          ),
          project:projects!project_id (
            id,
            title,
            image_url,
            user_id
          )
        `)
        .in('project_id', state.myProjects.map(p => p.id))
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const sentApplicationsTyped: ProjectApplication[] = sentApps?.map((app: any) => ({
        ...app,
        project: app.project || {}
      } as ProjectApplication)) || [];

      const receivedApplicationsTyped: ProjectApplication[] = receivedApps?.map((app: any) => ({
        ...app,
        project: app.project || {}
      } as ProjectApplication)) || [];

      setState(prev => ({
        ...prev,
        sentApplications: sentApplicationsTyped,
        receivedApplications: receivedApplicationsTyped,
        applicationsLoading: false
      }));

    } catch (error) {
      console.error('Error loading applications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading applications',
        applicationsLoading: false
      }));
    }
  }, [user, supabase, state.myProjects]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get basic counts
      const [
        { count: totalProjects },
        { count: myProjectsCount },
        { count: sentApplicationsCount },
        { count: receivedApplicationsCount }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('project_applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('project_applications').select('project_id', { count: 'exact', head: true }).in('project_id', state.myProjects.map(p => p.id))
      ]);

      const stats: ProjectStats = {
        total_projects: totalProjects || 0,
        my_projects: myProjectsCount || 0,
        applications_sent: sentApplicationsCount || 0,
        applications_received: receivedApplicationsCount || 0,
        active_collaborations: 0, // TODO: Calculate from collaborations table
        completed_projects: state.myProjects.filter(p => p.status === 'completed').length,
        success_rate: 0 // TODO: Calculate success rate
      };

      setState(prev => ({ ...prev, stats }));

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user, supabase, state.myProjects]);

  // Like project
  const likeProject = async (projectId: string) => {
    if (!user) return;

    try {
      const isLiked = state.discoverProjects.find(p => p.id === projectId)?.is_liked;
      
      if (isLiked) {
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('project_likes')
          .insert({ project_id: projectId, user_id: user.id });
      }

      // Update local state
      setState(prev => ({
        ...prev,
        discoverProjects: prev.discoverProjects.map(p =>
          p.id === projectId 
            ? { 
                ...p, 
                is_liked: !p.is_liked,
                likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
              }
            : p
        )
      }));

    } catch (error) {
      console.error('Error liking project:', error);
    }
  };

  // Bookmark project
  const bookmarkProject = async (projectId: string) => {
    if (!user) return;

    try {
      const isBookmarked = state.discoverProjects.find(p => p.id === projectId)?.is_bookmarked;
      
      if (isBookmarked) {
        await supabase
          .from('project_bookmarks')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('project_bookmarks')
          .insert({ project_id: projectId, user_id: user.id });
      }

      // Update local state
      setState(prev => ({
        ...prev,
        discoverProjects: prev.discoverProjects.map(p =>
          p.id === projectId 
            ? { ...p, is_bookmarked: !p.is_bookmarked }
            : p
        )
      }));

    } catch (error) {
      console.error('Error bookmarking project:', error);
    }
  };

  // Apply to project
  const applyToProject = async (projectId: string, application: Partial<ProjectApplication>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          user_id: user.id,
          ...application,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        discoverProjects: prev.discoverProjects.map(p =>
          p.id === projectId 
            ? { 
                ...p, 
                applications_count: p.applications_count + 1,
                user_application: { 
                  id: 'temp', 
                  status: 'pending' as ApplicationStatus,
                  ...application 
                } as any
              }
            : p
        )
      }));

      // Reload applications
      await loadApplications();

    } catch (error) {
      console.error('Error applying to project:', error);
      throw error;
    }
  };

  // Set active tab
  const setActiveTab = (tab: ProjectTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  // Set view mode
  const setViewMode = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  // Set search query
  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  // Set filters
  const setFilters = (filters: Partial<ProjectFilters>) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters }
    }));
  };

  // Set sort by
  const setSortBy = (sortBy: SortBy) => {
    setState(prev => ({ ...prev, sortBy }));
  };

  // Set show filters
  const setShowFilters = (show: boolean) => {
    setState(prev => ({ ...prev, showFilters: show }));
  };

  // Open project modal
  const openProjectModal = (project: ProjectWithOwner) => {
    setState(prev => ({ 
      ...prev, 
      selectedProject: project,
      isModalOpen: true 
    }));
  };

  // Close project modal
  const closeProjectModal = () => {
    setState(prev => ({ 
      ...prev, 
      selectedProject: null,
      isModalOpen: false 
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        categories: [],
        skills: [],
        location: '',
        remote_only: false,
        budget_range: '',
        timeline: '',
        difficulty_level: [],
        commitment_level: [],
        collaboration_type: [],
        is_paid: false,
        has_equity: false,
        is_featured: false,
        date_range: {}
      },
      searchQuery: ''
    }));
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      loadDiscoverProjects(),
      loadMyProjects(),
      loadApplications(),
      loadStats()
    ]);
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      loadDiscoverProjects();
      loadMyProjects();
      loadApplications();
      loadStats();
    }
  }, [user]);

  // Reload discover projects when filters change
  useEffect(() => {
    if (user) {
      loadDiscoverProjects();
    }
  }, [state.searchQuery, state.filters, state.sortBy]);

  return {
    ...state,
    setActiveTab,
    setViewMode,
    setSearchQuery,
    setFilters,
    setSortBy,
    setShowFilters,
    likeProject,
    bookmarkProject,
    applyToProject,
    loadDiscoverProjects,
    loadMyProjects,
    loadApplications,
    loadStats,
    openProjectModal,
    closeProjectModal,
    clearFilters,
    refreshData
  };
}
