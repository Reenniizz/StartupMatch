export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  skills?: string[];
  company?: string;
  role?: string;
  experience?: string;
  looking_for?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  last_active?: string;
  projects_count?: number;
  connections_count?: number;
  match_percentage?: number;
}

export interface ExploreFilters {
  location?: string;
  skills?: string[];
  role?: string;
  lookingFor?: string;
  experience?: string;
  company?: string;
  isVerified?: boolean;
}

export type SortBy = 'recent' | 'match_percentage' | 'connections' | 'name';

export type ViewMode = 'grid' | 'list';

export interface ExploreState {
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}
