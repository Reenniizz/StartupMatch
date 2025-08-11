import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthProvider';

// Types for database tables
export interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
  status: 'draft' | 'published' | 'completed';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  project_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Hook para obtener proyectos del usuario
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    async function fetchProjects() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Si la tabla no existe, simplemente usar datos vacíos
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log('Projects table does not exist yet - using empty data');
            setProjects([]);
            return;
          }
          throw error;
        }
        setProjects(data || []);
      } catch (error) {
        console.log('Projects feature not available yet:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  const createProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...project, user_id: user.id }])
        .select()
        .single();

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('La funcionalidad de proyectos aún no está disponible. Las tablas de base de datos necesitan ser creadas.');
        }
        throw error;
      }
      setProjects(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  return { projects, loading, createProject };
}

// Hook para obtener matches del usuario
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setMatches([]);
      setLoading(false);
      return;
    }

    async function fetchMatches() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            project:projects(*),
            matched_user:profiles(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Si la tabla no existe, simplemente usar datos vacíos
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log('Matches table does not exist yet - using empty data');
            setMatches([]);
            return;
          }
          throw error;
        }
        setMatches(data || []);
      } catch (error) {
        console.log('Matches feature not available yet:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [user]);

  return { matches, loading };
}

// Hook para obtener mensajes del usuario
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    async function fetchMessages() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(*),
            receiver:profiles!receiver_id(*)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          // Si la tabla no existe, simplemente usar datos vacíos
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log('Messages table does not exist yet - using empty data');
            setMessages([]);
            setUnreadCount(0);
            return;
          }
          throw error;
        }
        
        const messageData = data || [];
        setMessages(messageData);
        
        // Count unread messages where user is receiver
        const unread = messageData.filter(msg => 
          msg.receiver_id === user.id && !msg.read
        ).length;
        setUnreadCount(unread);
      } catch (error) {
        console.log('Messages feature not available yet:', error);
        setMessages([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          fetchMessages(); // Refresh messages when there's a change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('Messages table does not exist yet');
          return;
        }
        throw error;
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Mark as read feature not available yet:', error);
    }
  };

  return { messages, loading, unreadCount, markAsRead };
}

// Hook para estadísticas del dashboard
export function useStats() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeMatches: 0,
    totalMessages: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setStats({ totalProjects: 0, activeMatches: 0, totalMessages: 0, successRate: 0 });
      setLoading(false);
      return;
    }

    async function fetchStats() {
      if (!user) return;
      
      try {
        // Get project count
        const { count: projectCount, error: projectError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get active matches count
        const { count: matchCount, error: matchError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        // Get message count
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        // Calculate success rate (accepted matches / total matches * 100)
        const { count: totalMatches, error: totalMatchError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Handle table not found errors gracefully
        const safeProjectCount = projectError?.message.includes('does not exist') ? 0 : (projectCount || 0);
        const safeMatchCount = matchError?.message.includes('does not exist') ? 0 : (matchCount || 0);
        const safeMessageCount = messageError?.message.includes('does not exist') ? 0 : (messageCount || 0);
        const safeTotalMatches = totalMatchError?.message.includes('does not exist') ? 0 : (totalMatches || 0);

        const successRate = safeTotalMatches ? Math.round(safeMatchCount / safeTotalMatches * 100) : 0;

        setStats({
          totalProjects: safeProjectCount,
          activeMatches: safeMatchCount,
          totalMessages: safeMessageCount,
          successRate
        });
      } catch (error) {
        console.log('Stats feature not available yet:', error);
        setStats({
          totalProjects: 0,
          activeMatches: 0,
          totalMessages: 0,
          successRate: 0
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading };
}
