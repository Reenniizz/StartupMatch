/**
 * Matches Store - Zustand + TypeScript
 * Centralized state management for matches functionality
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface MatchUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  company?: string;
  industry?: string;
  experience_years?: number;
  location?: string;
  bio?: string;
  skills?: string[];
  objectives?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  compatibility_score?: number;
  mutual_connections?: number;
  connection_status?: 'none' | 'sent' | 'received' | 'accepted';
  matched_at?: string;
  created_at?: string;
}

export interface MatchFilters {
  search: string;
  industry: string;
  experience: string;
  location: string;
  compatibility: [number, number];
  sortBy: 'recent' | 'compatibility' | 'mutual_connections';
}

interface MatchesState {
  // Data
  connections: MatchUser[];
  pendingRequests: MatchUser[];
  sentRequests: MatchUser[];
  
  // Filters & Search
  filters: MatchFilters;
  
  // Loading states
  loading: {
    connections: boolean;
    pending: boolean;
    sent: boolean;
  };
  
  // Error states
  error: string | null;
  
  // UI state
  activeTab: 'connections' | 'pending' | 'sent';
  selectedMatch: MatchUser | null;
  
  // Actions
  setConnections: (connections: MatchUser[]) => void;
  setPendingRequests: (pending: MatchUser[]) => void;
  setSentRequests: (sent: MatchUser[]) => void;
  setFilters: (filters: Partial<MatchFilters>) => void;
  setLoading: (key: keyof MatchesState['loading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: MatchesState['activeTab']) => void;
  setSelectedMatch: (match: MatchUser | null) => void;
  
  // Business Logic Actions
  acceptConnection: (userId: string) => Promise<void>;
  rejectConnection: (userId: string) => Promise<void>;
  cancelRequest: (userId: string) => Promise<void>;
  sendMessage: (userId: string, message: string) => Promise<void>;
}

export const useMatchesStore = create<MatchesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connections: [],
      pendingRequests: [],
      sentRequests: [],
      
      filters: {
        search: '',
        industry: 'all',
        experience: 'all',
        location: 'all',
        compatibility: [0, 100],
        sortBy: 'recent'
      },
      
      loading: {
        connections: false,
        pending: false,
        sent: false
      },
      
      error: null,
      activeTab: 'connections',
      selectedMatch: null,
      
      // Setters
      setConnections: (connections) => set({ connections }),
      setPendingRequests: (pendingRequests) => set({ pendingRequests }),
      setSentRequests: (sentRequests) => set({ sentRequests }),
      
      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
      
      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading }
        })),
      
      setError: (error) => set({ error }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedMatch: (selectedMatch) => set({ selectedMatch }),
      
      // Business Logic Actions
      acceptConnection: async (userId: string) => {
        try {
          set({ error: null });
          
          const response = await fetch('/api/matches/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          if (!response.ok) {
            throw new Error('Failed to accept connection');
          }
          
          // Move from pending to connections
          const state = get();
          const acceptedUser = state.pendingRequests.find(u => u.id === userId);
          
          if (acceptedUser) {
            set({
              pendingRequests: state.pendingRequests.filter(u => u.id !== userId),
              connections: [...state.connections, { ...acceptedUser, connection_status: 'accepted' }]
            });
          }
          
        } catch (error) {
          console.error('Error accepting connection:', error);
          set({ error: 'Error al aceptar la conexión' });
        }
      },
      
      rejectConnection: async (userId: string) => {
        try {
          set({ error: null });
          
          const response = await fetch('/api/matches/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          if (!response.ok) {
            throw new Error('Failed to reject connection');
          }
          
          // Remove from pending requests
          const state = get();
          set({
            pendingRequests: state.pendingRequests.filter(u => u.id !== userId)
          });
          
        } catch (error) {
          console.error('Error rejecting connection:', error);
          set({ error: 'Error al rechazar la conexión' });
        }
      },
      
      cancelRequest: async (userId: string) => {
        try {
          set({ error: null });
          
          const response = await fetch('/api/matches/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          if (!response.ok) {
            throw new Error('Failed to cancel request');
          }
          
          // Remove from sent requests
          const state = get();
          set({
            sentRequests: state.sentRequests.filter(u => u.id !== userId)
          });
          
        } catch (error) {
          console.error('Error canceling request:', error);
          set({ error: 'Error al cancelar la solicitud' });
        }
      },
      
      sendMessage: async (userId: string, message: string) => {
        try {
          set({ error: null });
          
          const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId: userId, message })
          });
          
          if (!response.ok) {
            throw new Error('Failed to send message');
          }
          
          return response.json();
          
        } catch (error) {
          console.error('Error sending message:', error);
          set({ error: 'Error al enviar mensaje' });
          throw error;
        }
      }
    }),
    { name: 'matches-store' }
  )
);

// Computed selectors
export const useMatchesUI = () => {
  const { filters, activeTab, selectedMatch, error } = useMatchesStore();
  
  return {
    filters,
    activeTab, 
    selectedMatch,
    error,
    searchTerm: filters.search
  };
};

export const useMatchesLoading = () => {
  const { loading } = useMatchesStore();
  return loading;
};

export const useMatchesData = () => {
  const { connections, pendingRequests, sentRequests } = useMatchesStore();
  
  return {
    connections,
    pendingRequests, 
    sentRequests,
    totalConnections: connections.length,
    totalPending: pendingRequests.length,
    totalSent: sentRequests.length
  };
};
