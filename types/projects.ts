// Types for Projects system
export interface ProjectCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  tagline?: string;
  description: string;
  detailed_description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  visibility: 'public' | 'private' | 'connections_only' | 'team_only';
  is_featured: boolean;
  is_verified: boolean;
  category: string;
  industry: string;
  stage: 'idea' | 'mvp' | 'beta' | 'launch' | 'growth' | 'scaling' | 'exit';
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  logo_url?: string;
  cover_image_url?: string;
  demo_url?: string;
  website_url?: string;
  repository_url?: string;
  pitch_deck_url?: string;
  demo_video_url?: string;
  tech_stack: string[];
  required_skills: string[];
  funding_goal?: number;
  funding_raised: number;
  funding_stage?: 'bootstrapped' | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo';
  equity_offered?: number;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  application_count: number;
  team_size_current: number;
  team_size_target: number;
  is_seeking_cofounder: boolean;
  is_seeking_investors: boolean;
  is_seeking_mentors: boolean;
  is_open_to_collaboration: boolean;
  accepts_applications: boolean;
  application_deadline?: string;
  auto_accept_applications: boolean;
  requires_application_message: boolean;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  last_activity_at: string;
  
  // Relations
  creator?: {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    company?: string;
    role: string;
    headline?: string;
  };
  
  team_members?: ProjectTeamMember[];
  
  stats?: {
    total_views: number;
    unique_views: number;
    total_likes: number;
    total_applications: number;
    team_members: number;
    recent_activity_count: number;
  };
  
  user_interactions?: {
    has_liked: boolean;
    is_bookmarked: boolean;
    is_team_member: boolean;
  };

  // For applications tab
  application?: {
    id: string;
    status: string;
    desired_role: string;
    message: string;
    applied_at: string;
    reviewed_at?: string;
    response_message?: string;
  };
}

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  custom_title?: string;
  is_founder: boolean;
  is_admin: boolean;
  equity_percentage: number;
  commitment_level: 'part_time' | 'full_time' | 'consultant' | 'advisor';
  status: 'active' | 'inactive' | 'left' | 'removed';
  joined_at: string;
  left_at?: string;
  bio?: string;
  responsibilities: string[];
  created_at: string;
  updated_at: string;
  
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: string;
    company?: string;
  };
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  desired_role: string;
  message: string;
  proposed_equity?: number;
  proposed_commitment: 'part_time' | 'full_time' | 'consultant' | 'advisor';
  resume_url?: string;
  portfolio_url?: string;
  cover_letter_url?: string;
  additional_documents: string[];
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  response_message?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  applied_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  
  applicant: {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: string;
    company?: string;
    headline?: string;
    bio?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
  };
  
  project?: Project;
}

export interface ProjectIdea {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  industry?: string;
  status: 'draft' | 'developing' | 'converted_to_project' | 'abandoned';
  converted_to_project_id?: string;
  converted_at?: string;
  tags: string[];
  notes?: string;
  inspiration_sources: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  update_type: 'general' | 'milestone' | 'announcement' | 'blog_post' | 'media' | 'funding';
  images: string[];
  videos: string[];
  documents: string[];
  visibility: 'public' | 'team_only' | 'investors_only';
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSearchFilters {
  search?: string;
  category?: string;
  industry?: string;
  stage?: string;
  location?: string;
  seeking_cofounder?: boolean;
  seeking_investors?: boolean;
  seeking_mentors?: boolean;
  funding_stage?: string;
  team_size?: string;
  sort_by?: 'recent' | 'popular' | 'trending' | 'alphabetical' | 'views' | 'likes' | 'applications';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface CreateProjectData {
  title: string;
  tagline?: string;
  description: string;
  detailed_description?: string;
  category: string;
  industry: string;
  stage?: string;
  status?: string;
  visibility?: string;
  start_date?: string;
  target_completion_date?: string;
  logo_url?: string;
  cover_image_url?: string;
  demo_url?: string;
  website_url?: string;
  repository_url?: string;
  pitch_deck_url?: string;
  demo_video_url?: string;
  tech_stack?: string[];
  required_skills?: string[];
  funding_goal?: number;
  funding_stage?: string;
  equity_offered?: number;
  team_size_target?: number;
  is_seeking_cofounder?: boolean;
  is_seeking_investors?: boolean;
  is_seeking_mentors?: boolean;
  is_open_to_collaboration?: boolean;
  accepts_applications?: boolean;
  application_deadline?: string;
  requires_application_message?: boolean;
  tags?: string[];
}
