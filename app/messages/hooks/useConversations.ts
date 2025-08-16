/**
 * Conversations Management Hook
 * Handles conversation-related operations and CRUD
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  UseConversationsReturn, 
  AnyConversation,
  Conversation, 
  GroupConversation,
  GroupForm 
} from '../types/messages.types';

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<AnyConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate API loading on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would be populated by the parent useMessagesState hook
      // For now, we'll return empty as this hook is meant to be used with the main state
      setConversations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (userId: string): Promise<Conversation> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        name: `User ${userId}`,
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Conversación iniciada',
        timestamp: new Date().toISOString(),
        unread: 0,
        online: false,
        isMatch: false,
        type: 'individual',
        status: 'active',
      };

      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroupConversation = useCallback(async (form: GroupForm): Promise<GroupConversation> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const newGroupConversation: GroupConversation = {
        id: `group_${Date.now()}`,
        name: form.name,
        description: form.description,
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Grupo creado',
        timestamp: new Date().toISOString(),
        unread: 0,
        memberCount: form.selectedMembers.length + 1, // +1 for creator
        isPrivate: form.isPrivate,
        type: 'group',
        category: form.category,
        status: 'active',
        createdBy: 'current_user_id', // This would come from auth
      };

      setConversations(prev => [newGroupConversation, ...prev]);
      return newGroupConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConversation = useCallback((id: string | number, updates: Partial<AnyConversation>) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === id) {
          // Create a properly typed updated conversation
          return { ...conv, ...updates } as AnyConversation;
        }
        return conv;
      })
    );
  }, []);

  const deleteConversation = useCallback((id: string | number) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  }, []);

  // Status management actions
  const markAsRead = useCallback((id: string | number) => {
    updateConversation(id, { unread: 0 });
  }, [updateConversation]);

  const markAsUnread = useCallback((id: string | number) => {
    updateConversation(id, { unread: 1 });
  }, [updateConversation]);

  const archiveConversation = useCallback((id: string | number) => {
    updateConversation(id, { status: 'archived' });
  }, [updateConversation]);

  const muteConversation = useCallback((id: string | number) => {
    updateConversation(id, { status: 'muted' });
  }, [updateConversation]);

  return {
    conversations,
    loading,
    error,
    
    // CRUD operations
    createConversation,
    createGroupConversation,
    updateConversation,
    deleteConversation,
    
    // Status management
    markAsRead,
    markAsUnread,
    archiveConversation,
    muteConversation,
  };
}
