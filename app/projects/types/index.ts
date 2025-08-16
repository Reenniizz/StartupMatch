// Project related types
export interface Project {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  image_url?: string;
  status: ProjectStatus;
  budget_range?: string;
  timeline?: string;
  location?: string;
  remote_friendly: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  skills_required: string[];
  technologies: string[];
  categories: ProjectCategory[];
  difficulty_level: DifficultyLevel;
  commitment_level: CommitmentLevel;
  is_paid: boolean;
  is_featured: boolean;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  applications_count: number;
  team_size?: number;
  equity_percentage?: number;
  project_url?: string;
  github_url?: string;
  demo_url?: string;
  contact_email?: string;
  external_links?: ExternalLink[];
  tags?: string[];
  collaboration_type: CollaborationType[];
}

export interface ProjectOwner {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
  company?: string;
  location?: string;
  is_verified?: boolean;
  is_premium?: boolean;
}

export interface ProjectWithOwner extends Project {
  owner: ProjectOwner;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  user_application?: ProjectApplication;
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  response_message?: string;
  response_date?: string;
  skills_offered: string[];
  availability_hours?: number;
  expected_equity?: number;
  expected_payment?: string;
  role?: string; // Adding missing role property
  project?: ProjectWithOwner; // Adding missing project relation
}

export interface ProjectStats {
  total_projects: number;
  my_projects: number;
  applications_sent: number;
  applications_received: number;
  active_collaborations: number;
  completed_projects: number;
  success_rate: number;
}

export type ProjectStatus = 
  | 'draft'
  | 'active' 
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'
  | 'archived';

export type ApplicationStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'interview'
  | 'negotiating';

export type ProjectCategory = 
  | 'web_development'
  | 'mobile_development'
  | 'ai_ml'
  | 'blockchain'
  | 'e_commerce'
  | 'fintech'
  | 'health_tech'
  | 'edu_tech'
  | 'social_media'
  | 'gaming'
  | 'iot'
  | 'saas'
  | 'marketplace'
  | 'analytics'
  | 'other';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CommitmentLevel = 'low' | 'medium' | 'high' | 'full_time';

export type CollaborationType = 
  | 'co_founder'
  | 'freelance'
  | 'partnership' 
  | 'volunteer'
  | 'internship'
  | 'full_time'
  | 'part_time'
  | 'contract';

export type ViewMode = 'grid' | 'list';

export type ProjectTab = 'discover' | 'my-projects' | 'applications';

export type SortBy = 
  | 'newest'
  | 'oldest' 
  | 'most_liked'
  | 'most_applied'
  | 'budget_high'
  | 'budget_low'
  | 'deadline_soon'
  | 'relevance';

export interface ProjectFilters {
  categories: ProjectCategory[];
  skills: string[];
  location: string;
  remote_only: boolean;
  budget_range: string;
  timeline: string;
  difficulty_level: DifficultyLevel[];
  commitment_level: CommitmentLevel[];
  collaboration_type: CollaborationType[];
  is_paid: boolean;
  has_equity: boolean;
  is_featured: boolean;
  date_range: {
    start?: string;
    end?: string;
  };
}

export interface ExternalLink {
  id: string;
  title: string;
  url: string;
  type: 'website' | 'demo' | 'github' | 'figma' | 'other';
}

export interface ProjectFormData {
  title: string;
  description: string;
  short_description: string;
  skills_required: string[];
  technologies: string[];
  categories: ProjectCategory[];
  difficulty_level: DifficultyLevel;
  commitment_level: CommitmentLevel;
  collaboration_type: CollaborationType[];
  budget_range: string;
  timeline: string;
  location: string;
  remote_friendly: boolean;
  is_paid: boolean;
  team_size: number;
  equity_percentage?: number;
  project_url?: string;
  github_url?: string;
  demo_url?: string;
  contact_email?: string;
  external_links: ExternalLink[];
  tags: string[];
}

export interface ProjectState {
  // Discover projects
  discoverProjects: ProjectWithOwner[];
  discoverLoading: boolean;
  discoverHasMore: boolean;
  
  // My projects
  myProjects: ProjectWithOwner[];
  myProjectsLoading: boolean;
  
  // Applications
  sentApplications: ProjectApplication[];
  receivedApplications: ProjectApplication[];
  applicationsLoading: boolean;
  
  // UI State
  activeTab: ProjectTab;
  viewMode: ViewMode;
  selectedProject: ProjectWithOwner | null;
  isModalOpen: boolean;
  filters: ProjectFilters;
  sortBy: SortBy;
  searchQuery: string;
  showFilters: boolean;
  
  // General
  stats: ProjectStats | null;
  error: string | null;
}

export interface ProjectContextType extends ProjectState {
  // Actions
  setActiveTab: (tab: ProjectTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  setSortBy: (sortBy: SortBy) => void;
  setShowFilters: (show: boolean) => void;
  
  // Project actions
  likeProject: (projectId: string) => Promise<void>;
  bookmarkProject: (projectId: string) => Promise<void>;
  createProject: (data: ProjectFormData) => Promise<Project>;
  updateProject: (id: string, data: Partial<ProjectFormData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Application actions
  applyToProject: (projectId: string, application: Partial<ProjectApplication>) => Promise<void>;
  updateApplication: (id: string, data: Partial<ProjectApplication>) => Promise<void>;
  withdrawApplication: (id: string) => Promise<void>;
  respondToApplication: (id: string, status: ApplicationStatus, message?: string) => Promise<void>;
  
  // Data loading
  loadDiscoverProjects: (loadMore?: boolean) => Promise<void>;
  loadMyProjects: () => Promise<void>;
  loadApplications: () => Promise<void>;
  loadStats: () => Promise<void>;
  
  // UI actions
  openProjectModal: (project: ProjectWithOwner) => void;
  closeProjectModal: () => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

// Form validation types
export interface ProjectFormErrors {
  title?: string;
  description?: string;
  short_description?: string;
  skills_required?: string;
  categories?: string;
  budget_range?: string;
  timeline?: string;
  contact_email?: string;
}

// Component prop types
export interface ProjectCardProps {
  project: ProjectWithOwner;
  viewMode: ViewMode;
  onLike: (projectId: string) => void;
  onBookmark: (projectId: string) => void;
  onApply: (projectId: string) => void;
  onView: (project: ProjectWithOwner) => void;
  showOwner?: boolean;
}

export interface ProjectFilterOptions {
  categories: { value: ProjectCategory; label: string; count?: number }[];
  skills: { value: string; label: string; count?: number }[];
  locations: { value: string; label: string; count?: number }[];
  budgetRanges: { value: string; label: string; count?: number }[];
  timelines: { value: string; label: string; count?: number }[];
}
