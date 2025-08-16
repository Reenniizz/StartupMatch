/**
 * Messages State Management Hook
 * Central state management for the entire messages module
 */

import { useState, useCallback, useReducer, useEffect } from 'react';
import { 
  UseMessagesStateReturn, 
  Conversation, 
  GroupConversation, 
  Message, 
  ConversationType, 
  ViewMode 
} from '../types/messages.types';

// State shape
interface MessagesState {
  conversations: Conversation[];
  groupConversations: GroupConversation[];
  messages: Message[];
  activeConversation: string | number | null;
  activeConversationType: ConversationType;
  viewMode: ViewMode;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

// Action types
type MessagesAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_GROUP_CONVERSATIONS'; payload: GroupConversation[] }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: { id: string | number | null; type: ConversationType } }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'UPDATE_CONVERSATION_UNREAD'; payload: { id: string | number; unread: number } };

// Initial state
const initialState: MessagesState = {
  conversations: [],
  groupConversations: [],
  messages: [],
  activeConversation: null,
  activeConversationType: 'individual',
  viewMode: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
};

// Reducer
function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_GROUP_CONVERSATIONS':
      return { ...state, groupConversations: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload.id,
        activeConversationType: action.payload.type,
        messages: action.payload.id !== state.activeConversation ? [] : state.messages, // Clear messages when switching conversations
      };
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? { ...message, ...action.payload.updates }
            : message
        ),
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== action.payload),
      };
    
    case 'UPDATE_CONVERSATION_UNREAD':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, unread: action.payload.unread }
            : conv
        ),
        groupConversations: state.groupConversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, unread: action.payload.unread }
            : conv
        ),
      };
    
    default:
      return state;
  }
}

export function useMessagesState(): UseMessagesStateReturn & {
  // Extended actions for internal use
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  updateConversationUnread: (id: string | number, unread: number) => void;
} {
  const [state, dispatch] = useReducer(messagesReducer, initialState);

  // Initialize with mock data
  useEffect(() => {
    // Mock individual conversations
    const mockConversations: Conversation[] = [
      {
        id: '1',
        name: 'María García',
        company: 'TechStartup SL',
        avatar: '/api/placeholder/40/40',
        lastMessage: '¿Te interesa colaborar en mi proyecto de IA?',
        timestamp: '2025-08-16T10:30:00Z',
        unread: 2,
        online: true,
        isMatch: true,
        type: 'individual',
        status: 'active',
        profileInfo: {
          role: 'CEO & Founder',
          location: 'Madrid, España',
          industries: ['IA', 'Fintech'],
          matchScore: 95,
        },
      },
      {
        id: '2',
        name: 'Carlos Rodríguez',
        company: 'InnovaTech',
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Perfecto, hablamos mañana entonces',
        timestamp: '2025-08-16T09:15:00Z',
        unread: 0,
        online: false,
        isMatch: true,
        type: 'individual',
        status: 'active',
        profileInfo: {
          role: 'CTO',
          location: 'Barcelona, España',
          industries: ['Software', 'SaaS'],
          matchScore: 88,
        },
      },
      {
        id: '3',
        name: 'Ana Martín',
        company: 'GreenTech Solutions',
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Me encanta tu propuesta de sostenibilidad',
        timestamp: '2025-08-15T16:45:00Z',
        unread: 1,
        online: true,
        isMatch: true,
        type: 'individual',
        status: 'active',
        profileInfo: {
          role: 'Sustainability Director',
          location: 'Valencia, España',
          industries: ['CleanTech', 'Sostenibilidad'],
          matchScore: 92,
        },
      },
    ];

    // Mock group conversations
    const mockGroupConversations: GroupConversation[] = [
      {
        id: 'g1',
        name: 'Fintech España',
        description: 'Networking para startups fintech españolas',
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Nueva oportunidad de inversión disponible',
        timestamp: '2025-08-16T11:20:00Z',
        unread: 5,
        memberCount: 247,
        isPrivate: false,
        type: 'group',
        category: 'Fintech',
        status: 'active',
        createdBy: 'admin1',
      },
      {
        id: 'g2',
        name: 'IA & Machine Learning',
        description: 'Discusiones sobre inteligencia artificial y ML',
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Nuevo paper sobre transformers publicado',
        timestamp: '2025-08-16T08:30:00Z',
        unread: 12,
        memberCount: 189,
        isPrivate: false,
        type: 'group',
        category: 'Technology',
        status: 'active',
        createdBy: 'admin2',
      },
      {
        id: 'g3',
        name: 'Equipo Proyecto Alpha',
        description: 'Grupo privado del proyecto Alpha',
        avatar: '/api/placeholder/40/40',
        lastMessage: 'Reunión programada para mañana a las 10:00',
        timestamp: '2025-08-15T17:00:00Z',
        unread: 3,
        memberCount: 8,
        isPrivate: true,
        type: 'group',
        category: 'Proyecto',
        status: 'active',
        createdBy: 'user123',
      },
    ];

    dispatch({ type: 'SET_CONVERSATIONS', payload: mockConversations });
    dispatch({ type: 'SET_GROUP_CONVERSATIONS', payload: mockGroupConversations });
  }, []);

  // Actions
  const setActiveConversation = useCallback((id: string | number | null, type: ConversationType) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { id, type } });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Additional actions for messages
  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: id });
  }, []);

  const updateConversationUnread = useCallback((id: string | number, unread: number) => {
    dispatch({ type: 'UPDATE_CONVERSATION_UNREAD', payload: { id, unread } });
  }, []);

  return {
    // State
    conversations: state.conversations,
    groupConversations: state.groupConversations,
    activeConversation: state.activeConversation,
    activeConversationType: state.activeConversationType,
    messages: state.messages,
    viewMode: state.viewMode,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    setActiveConversation,
    setViewMode,
    setSearchQuery,
    clearError,

    // Extended actions (not in the interface, but useful internally)
    addMessage,
    updateMessage,
    deleteMessage,
    updateConversationUnread,
  };
}
