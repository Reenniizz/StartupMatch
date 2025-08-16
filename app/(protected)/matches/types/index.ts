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
  // Professional context enhancements
  years_experience?: number;
  industry?: string;
  previous_startups?: number;
  funding_stage?: 'idea' | 'mvp' | 'pre-seed' | 'seed' | 'series-a' | 'growth';
  availability?: 'full-time' | 'part-time' | 'weekends' | 'consulting';
  equity_expectations?: string;
  last_active?: string;
  verified_linkedin?: boolean;
  mutual_connections?: number;
  success_score?: number; // 0-100 based on previous collaborations
  match_reason?: string; // AI-generated explanation
  seeking_urgency?: 'low' | 'medium' | 'high';
  timezone?: string;
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
  industry?: string;
  experience_min?: number;
  experience_max?: number;
  availability?: string[];
  funding_stage?: string[];
}

export interface LikeResponse {
  success: boolean;
  isMutual: boolean;
  match?: Match;
}

export interface MatchAction {
  type: 'like' | 'pass' | 'save' | 'view_profile';
  matchId: string;
  timestamp: Date;
}
