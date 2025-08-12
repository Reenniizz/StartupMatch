import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthProvider';

export interface UserProfile {
  id?: string;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  company?: string;
  industry: string;
  location: string;
  experience_years: number;
  availability_hours: number;
  bio?: string;
  headline?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  twitter_url?: string;
  profile_visibility: 'public' | 'private' | 'connections';
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  profile_completed_at?: string;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSkill {
  id?: string;
  user_id: string;
  skill_name: string;
  skill_level: number; // 1-10
  skill_category: string;
  is_primary: boolean;
  created_at?: string;
}

export interface UserExperience {
  id?: string;
  user_id: string;
  company_name: string;
  position: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserObjective {
  id?: string;
  user_id: string;
  objective_type: string;
  priority: number; // 1-5
  created_at?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [experience, setExperience] = useState<UserExperience[]>([]);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile data
  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Load user skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (skillsError) throw skillsError;

      // Load user experience
      const { data: experienceData, error: experienceError } = await supabase
        .from('user_experience')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (experienceError) throw experienceError;

      // Load user objectives
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('user_objectives')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (objectivesError) throw objectivesError;

      setProfile(profileData);
      setSkills(skillsData || []);
      setExperience(experienceData || []);
      setObjectives(objectivesData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  // Create or update user profile
  const saveProfile = async (profileData: Partial<UserProfile>) => {
    if (!user?.id) return { error: 'No user found' };

    try {
      setError(null);

      const dataToSave = {
        ...profileData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (profile?.id) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(dataToSave)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert({
            ...dataToSave,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setProfile(result.data);
      return { data: result.data, error: null };
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error saving profile';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  // Add or update skill
  const saveSkill = async (skillData: Partial<UserSkill>) => {
    if (!user?.id) return { error: 'No user found' };

    try {
      const dataToSave = {
        ...skillData,
        user_id: user.id,
      };

      let result;

      if (skillData.id) {
        // Update existing skill
        result = await supabase
          .from('user_skills')
          .update(dataToSave)
          .eq('id', skillData.id)
          .select()
          .single();
      } else {
        // Add new skill
        result = await supabase
          .from('user_skills')
          .insert({
            ...dataToSave,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Refresh skills
      await loadProfile();
      return { data: result.data, error: null };
    } catch (err) {
      console.error('Error saving skill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error saving skill';
      return { error: errorMessage };
    }
  };

  // Remove skill
  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      // Refresh skills
      await loadProfile();
      return { error: null };
    } catch (err) {
      console.error('Error removing skill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error removing skill';
      return { error: errorMessage };
    }
  };

  // Add or update experience
  const saveExperience = async (experienceData: Partial<UserExperience>) => {
    if (!user?.id) return { error: 'No user found' };

    try {
      const dataToSave = {
        ...experienceData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (experienceData.id) {
        // Update existing experience
        result = await supabase
          .from('user_experience')
          .update(dataToSave)
          .eq('id', experienceData.id)
          .select()
          .single();
      } else {
        // Add new experience
        result = await supabase
          .from('user_experience')
          .insert({
            ...dataToSave,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Refresh experience
      await loadProfile();
      return { data: result.data, error: null };
    } catch (err) {
      console.error('Error saving experience:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error saving experience';
      return { error: errorMessage };
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      setProfile(null);
      setSkills([]);
      setExperience([]);
      setObjectives([]);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    profile,
    skills,
    experience,
    objectives,
    loading,
    error,
    saveProfile,
    saveSkill,
    removeSkill,
    saveExperience,
    refreshProfile: loadProfile,
  };
};
