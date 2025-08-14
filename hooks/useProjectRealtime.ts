import { useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

export interface ProjectRealtimeData {
  id: string;
  title: string;
  like_count: number;
  view_count: number;
  bookmark_count: number;
  application_count: number;
  updated_at: string;
  team_size?: number;
}

interface UseProjectRealtimeProps {
  onProjectUpdate?: (projectId: string, data: Partial<ProjectRealtimeData>) => void;
  onProjectLike?: (projectId: string, likeCount: number) => void;
  onProjectBookmark?: (projectId: string, bookmarkCount: number) => void;
  onProjectView?: (projectId: string, viewCount: number) => void;
  onNewApplication?: (projectId: string, applicationData: any) => void;
}

export const useProjectRealtime = (props: UseProjectRealtimeProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase) return;

    // Create a channel for project updates
    channelRef.current = supabase.channel('projects_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload: any) => {
          console.log('Project update received:', payload);
          
          const { new: newRecord, old: oldRecord, eventType } = payload;
          
          if (eventType === 'UPDATE' && newRecord) {
            const projectUpdate: Partial<ProjectRealtimeData> = {
              id: newRecord.id,
              title: newRecord.title,
              like_count: newRecord.like_count,
              view_count: newRecord.view_count,
              bookmark_count: newRecord.bookmark_count,
              application_count: newRecord.application_count,
              updated_at: newRecord.updated_at,
            };
            
            props.onProjectUpdate?.(newRecord.id, projectUpdate);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_likes',
        },
        (payload: any) => {
          console.log('Project like update received:', payload);
          
          const { new: newRecord, old: oldRecord, eventType } = payload;
          
          if (eventType === 'INSERT' && newRecord) {
            // Fetch updated like count for the project
            fetchProjectLikes(newRecord.project_id);
          } else if (eventType === 'DELETE' && oldRecord) {
            // Fetch updated like count for the project
            fetchProjectLikes(oldRecord.project_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_bookmarks',
        },
        (payload: any) => {
          console.log('Project bookmark update received:', payload);
          
          const { new: newRecord, old: oldRecord, eventType } = payload;
          
          if (eventType === 'INSERT' && newRecord) {
            fetchProjectBookmarks(newRecord.project_id);
          } else if (eventType === 'DELETE' && oldRecord) {
            fetchProjectBookmarks(oldRecord.project_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_applications',
        },
        (payload: any) => {
          console.log('New project application received:', payload);
          
          const { new: newRecord } = payload;
          
          if (newRecord) {
            props.onNewApplication?.(newRecord.project_id, newRecord);
            fetchProjectApplicationCount(newRecord.project_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_views',
        },
        (payload: any) => {
          console.log('Project view update received:', payload);
          
          const { new: newRecord, eventType } = payload;
          
          if (eventType === 'INSERT' && newRecord) {
            fetchProjectViews(newRecord.project_id);
          }
        }
      )
      .subscribe((status: any) => {
        console.log('Project realtime subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase]);

  const fetchProjectLikes = async (projectId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('like_count')
        .eq('id', projectId)
        .single();

      if (!error && data) {
        props.onProjectLike?.(projectId, data.like_count);
      }
    } catch (error) {
      console.error('Error fetching project likes:', error);
    }
  };

  const fetchProjectBookmarks = async (projectId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('bookmark_count')
        .eq('id', projectId)
        .single();

      if (!error && data) {
        props.onProjectBookmark?.(projectId, data.bookmark_count);
      }
    } catch (error) {
      console.error('Error fetching project bookmarks:', error);
    }
  };

  const fetchProjectViews = async (projectId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('view_count')
        .eq('id', projectId)
        .single();

      if (!error && data) {
        props.onProjectView?.(projectId, data.view_count);
      }
    } catch (error) {
      console.error('Error fetching project views:', error);
    }
  };

  const fetchProjectApplicationCount = async (projectId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('application_count')
        .eq('id', projectId)
        .single();

      if (!error && data) {
        // Trigger general project update
        props.onProjectUpdate?.(projectId, {
          id: projectId,
          application_count: data.application_count,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching project application count:', error);
    }
  };

  // Helper function to send realtime messages to other clients
  const sendProjectUpdate = async (projectId: string, action: string, data?: any): Promise<RealtimeChannelSendResponse | null> => {
    if (!channelRef.current) {
      console.error('Channel not initialized');
      return null;
    }

    return channelRef.current.send({
      type: 'broadcast',
      event: 'project_update',
      payload: {
        project_id: projectId,
        action,
        data,
        timestamp: new Date().toISOString()
      }
    });
  };

  return {
    sendProjectUpdate,
    isConnected: channelRef.current?.state === 'joined'
  };
};
