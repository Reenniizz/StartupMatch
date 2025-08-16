'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  UseActiveChatReturn, 
  AnyConversation, 
  Message,
  TypingIndicator 
} from '../types/messages.types';

export function useActiveChat(): UseActiveChatReturn {
  const [activeConversation, setActiveConversation] = useState<AnyConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock messages data for development
  const mockMessages: Message[] = [
    {
      id: 1,
      conversationId: 1,
      senderId: 'user-1',
      senderName: 'Ana García',
      content: 'Hola! Me interesa tu proyecto de IA. ¿Podemos hablar?',
      timestamp: '2024-01-15T10:30:00.000Z',
      type: 'text',
      status: 'read',
      edited: false
    },
    {
      id: 2,
      conversationId: 1,
      senderId: 'user-2',
      senderName: 'Carlos Mendez',
      content: '¡Por supuesto! Es un proyecto de machine learning para análisis de sentimientos.',
      timestamp: '2024-01-15T10:32:00.000Z',
      type: 'text',
      status: 'read',
      edited: false
    },
    {
      id: 3,
      conversationId: 1,
      senderId: 'user-1',
      senderName: 'Ana García',
      content: 'Suena increíble. ¿Qué tecnologías están usando?',
      timestamp: '2024-01-15T10:35:00.000Z',
      type: 'text',
      status: 'read',
      edited: false
    },
    {
      id: 4,
      conversationId: 1,
      senderId: 'user-2',
      senderName: 'Carlos Mendez',
      content: 'Principalmente Python, TensorFlow y React para el frontend.',
      timestamp: '2024-01-15T10:40:00.000Z',
      type: 'text',
      status: 'delivered',
      edited: false
    }
  ];

  const selectConversation = useCallback(async (conversation: AnyConversation) => {
    setLoadingConversation(true);
    setError(null);
    
    try {
      setActiveConversation(conversation);
      
      // Simulate API call to load messages
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock messages by conversation
      const conversationMessages = mockMessages.filter(
        msg => msg.conversationId === conversation.id
      );
      
      setMessages(conversationMessages);
      
      // Mark conversation as read
      // This would typically be handled by the parent component
      console.log(`Marking conversation ${conversation.id} as read`);
    } catch (err) {
      setError('Error al cargar la conversación');
      console.error('Error loading conversation:', err);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setTypingUsers([]);
    setError(null);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates } as Message
          : msg
      )
    );
  }, []);

  const deleteMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const addTypingIndicator = useCallback((userId: string, userName: string) => {
    setTypingUsers(prev => {
      const exists = prev.find(t => t.userId === userId);
      if (exists) return prev;
      
      return [...prev, {
        userId,
        userName,
        conversationId: activeConversation?.id || 0,
        timestamp: new Date().toISOString()
      }];
    });
  }, [activeConversation?.id]);

  const removeTypingIndicator = useCallback((userId: string) => {
    setTypingUsers(prev => prev.filter(t => t.userId !== userId));
  }, []);

  const markMessagesAsRead = useCallback(() => {
    if (!activeConversation) return;
    
    setMessages(prev => 
      prev.map(msg => ({ ...msg, status: 'read' as const }))
    );
  }, [activeConversation]);

  const searchInMessages = useCallback((query: string): Message[] => {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(lowercaseQuery)
    );
  }, [messages]);

  const loadMessages = useCallback(async (conversationId: string | number) => {
    setLoadingMessages(true);
    setError(null);
    
    try {
      // Real API call to load messages
      const response = await fetch(`/api/private-messages?conversationId=${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar mensajes');
      }

      const messagesData = await response.json();
      
      // Transform API data to match our Message interface
      const formattedMessages: Message[] = messagesData.map((msg: any, index: number) => ({
        id: msg.id || index,
        conversationId,
        senderId: msg.sender === 'me' ? 'current-user' : 'other-user',
        senderName: msg.sender === 'me' ? 'Tú' : 'Usuario',
        content: msg.message,
        timestamp: msg.timestamp,
        type: 'text',
        status: msg.status || 'delivered',
        edited: false
      }));

      setMessages(formattedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar mensajes';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      // Simulate loading more messages
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real app, load older messages and prepend them
      console.log('Loading more messages...');
    } catch (err) {
      setError('Error al cargar más mensajes');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    // This would send typing status to server
    console.log(`User is ${isTyping ? 'typing' : 'not typing'}`);
  }, []);

  // Auto-cleanup typing indicators after 3 seconds of inactivity
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const cleanup = setTimeout(() => {
      const now = new Date();
      setTypingUsers(prev => 
        prev.filter(indicator => 
          now.getTime() - new Date(indicator.timestamp).getTime() < 3000
        )
      );
    }, 3000);

    return () => clearTimeout(cleanup);
  }, [typingUsers]);

  // Polling for new messages every 3 seconds when there's an active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const pollInterval = setInterval(() => {
      // Only poll if we're not currently loading messages
      if (!loadingMessages) {
        loadMessages(activeConversation.id);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeConversation, loadingMessages, loadMessages]);

  return {
    activeConversation,
    messages,
    loadingMessages,
    loadingConversation,
    typingUsers,
    loadMessages,
    loadMoreMessages,
    markMessagesAsRead,
    addMessage,
    setTyping
  };
}
