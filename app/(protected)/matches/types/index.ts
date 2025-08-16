export interface Match {
  id: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  match_percentage?: number;
  is_mutual?: boolean;
  company?: string;
  role?: string;
  looking_for?: string;
}

export interface MatchesState {
  discover: Match[];
  mutual: Match[];
  loading: boolean;
  error: string | null;
}

export type TabType = 'discover' | 'mutual';

export interface MatchFilters {
  location?: string;
  skills?: string[];
  role?: string;
  lookingFor?: string;
}

export interface LikeResponse {
  success: boolean;
  isMutual: boolean;
  match?: Match;
}
