import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import type {
  UserProfile,
  UserSkill,
  UserExperience,
  UserProject,
  UserActivity,
  ProfileEditData,
  ProfileState,
  SkillLevel
} from '../types';

export function useProfile(userId?: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { user } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<ProfileState>({
    profile: null,
    skills: [],
    experience: [],
    projects: [],
    activities: [],
    loading: true,
    saving: false,
    error: null,
    isEditing: false
  });

  // Get target user ID (own profile or viewing someone else's)
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Load skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (skillsError) {
        console.error('Error loading skills:', skillsError);
      }

      // Load experience
      const { data: experienceData, error: experienceError } = await supabase
        .from('user_experience')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: false });

      if (experienceError) {
        console.error('Error loading experience:', experienceError);
      }

      // Load projects (if viewing own profile)
      let projectsData = [];
      if (isOwnProfile) {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error loading projects:', projectsError);
        } else {
          projectsData = projects || [];
        }
      }

      // Load recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', targetUserId)
        .order('date', { ascending: false })
        .limit(10);

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
      }

      setState(prev => ({
        ...prev,
        profile: profileData,
        skills: skillsData || [],
        experience: experienceData || [],
        projects: projectsData,
        activities: activitiesData || [],
        loading: false
      }));

    } catch (error) {
      console.error('Error loading profile:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading profile',
        loading: false
      }));
    }
  }, [targetUserId, isOwnProfile, supabase]);

  // Update profile
  const updateProfile = async (data: Partial<ProfileEditData>) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) throw error;

      // Log activity
      await logActivity('profile_updated', 'Perfil actualizado', {
        fields_updated: Object.keys(data)
      });

      await loadProfile();
      
      setState(prev => ({ 
        ...prev, 
        saving: false, 
        isEditing: false 
      }));

    } catch (error) {
      console.error('Error updating profile:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating profile',
        saving: false
      }));
    }
  };

  // Add skill
  const addSkill = async (skill: string, level: SkillLevel) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const { error } = await supabase
        .from('user_skills')
        .insert({
          user_id: targetUserId,
          skill: skill.trim(),
          level,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log activity
      await logActivity('skill_added', `Agregó la habilidad: ${skill}`, {
        skill,
        level
      });

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

    } catch (error) {
      console.error('Error adding skill:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error adding skill',
        saving: false
      }));
    }
  };

  // Remove skill
  const removeSkill = async (skillId: string) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true }));

      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId)
        .eq('user_id', targetUserId);

      if (error) throw error;

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

    } catch (error) {
      console.error('Error removing skill:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  // Add experience
  const addExperience = async (experience: Omit<UserExperience, 'id' | 'user_id' | 'created_at'>) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const { error } = await supabase
        .from('user_experience')
        .insert({
          user_id: targetUserId,
          ...experience,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

    } catch (error) {
      console.error('Error adding experience:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error adding experience',
        saving: false
      }));
    }
  };

  // Update experience
  const updateExperience = async (id: string, experience: Partial<UserExperience>) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true }));

      const { error } = await supabase
        .from('user_experience')
        .update(experience)
        .eq('id', id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

    } catch (error) {
      console.error('Error updating experience:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  // Remove experience
  const removeExperience = async (id: string) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      setState(prev => ({ ...prev, saving: true }));

      const { error } = await supabase
        .from('user_experience')
        .delete()
        .eq('id', id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

    } catch (error) {
      console.error('Error removing experience:', error);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  // Log user activity
  const logActivity = async (
    type: string, 
    title: string, 
    metadata?: Record<string, any>
  ) => {
    if (!isOwnProfile || !targetUserId) return;

    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: targetUserId,
          type,
          title,
          description: title,
          date: new Date().toISOString(),
          metadata
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Set editing mode
  const setIsEditing = (editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }));
  };

  // Refresh profile data
  const refreshProfile = async () => {
    await loadProfile();
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!isOwnProfile || !targetUserId) return null;

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      await loadProfile();
      setState(prev => ({ ...prev, saving: false }));

      return publicUrl;

    } catch (error) {
      console.error('Error uploading avatar:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error uploading avatar',
        saving: false
      }));
      return null;
    }
  };

  // Initialize
  useEffect(() => {
    if (targetUserId) {
      loadProfile();
    }
  }, [targetUserId, loadProfile]);

  return {
    ...state,
    targetUserId,
    isOwnProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addExperience,
    updateExperience,
    removeExperience,
    setIsEditing,
    refreshProfile,
    uploadAvatar,
    logActivity
  };
}
