// Profile related types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  role?: string;
  company?: string;
  phone?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  created_at?: string;
  updated_at?: string;
  looking_for?: string;
  availability?: string;
  years_experience?: number;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill: string;
  level: SkillLevel;
  years_experience?: number;
  created_at: string;
}

export interface UserExperience {
  id: string;
  user_id: string;
  company: string;
  position: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  location?: string;
  created_at: string;
}

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  technologies: string[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: string;
  metadata?: Record<string, any>;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export type ActivityType = 
  | 'project_created'
  | 'project_updated'
  | 'collaboration_started'
  | 'collaboration_completed'
  | 'skill_added'
  | 'profile_updated'
  | 'connection_made'
  | 'achievement_earned';

export interface ProfileEditData {
  name: string;
  bio: string;
  location: string;
  website: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  role: string;
  company: string;
  phone: string;
  looking_for: string;
  availability: string;
  years_experience: number;
}

export interface ProfileState {
  profile: UserProfile | null;
  skills: UserSkill[];
  experience: UserExperience[];
  projects: UserProject[];
  activities: UserActivity[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  isEditing: boolean;
}

export interface ProfileContextType extends ProfileState {
  updateProfile: (data: Partial<ProfileEditData>) => Promise<void>;
  addSkill: (skill: string, level: SkillLevel) => Promise<void>;
  removeSkill: (skillId: string) => Promise<void>;
  addExperience: (experience: Omit<UserExperience, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateExperience: (id: string, experience: Partial<UserExperience>) => Promise<void>;
  removeExperience: (id: string) => Promise<void>;
  setIsEditing: (editing: boolean) => void;
  refreshProfile: () => Promise<void>;
}

// Form validation types
export interface ProfileFormErrors {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  role?: string;
  company?: string;
  phone?: string;
}

// Profile section types
export type ProfileSection = 
  | 'basic_info'
  | 'professional'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'social'
  | 'settings';

export interface SocialLinks {
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
}

export interface ProfessionalInfo {
  role?: string;
  company?: string;
  years_experience?: number;
  looking_for?: string;
  availability?: string;
}
