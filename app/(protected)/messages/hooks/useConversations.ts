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
      // Real API call to load conversations
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load conversations');
      }

      const data = await response.json();
      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (otherUserId: string): Promise<Conversation> => {
    setLoading(true);
    setError(null);

    try {
      // Real API call to create conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otherUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();

      // Create the conversation object for frontend
      const newConversation: Conversation = {
        id: data.conversationId,
        name: `User ${otherUserId}`, // This would be updated by reloading conversations
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Conversación iniciada',
        timestamp: new Date().toISOString(),
        unread: 0,
        online: false,
        isMatch: false,
        type: 'individual',
        status: 'active',
      };

      // Reload conversations to get updated data
      await loadConversations();
      
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadConversations]);

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
    loadConversations, // Add this for manual refresh
    
    // Status management
    markAsRead,
    markAsUnread,
    archiveConversation,
    muteConversation,
  };
}
