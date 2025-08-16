'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  SearchFilters, 
  SearchResult, 
  UseSearchAndFilterReturn,
  AnyConversation,
  Message,
  ViewMode,
  ConversationStatus
} from '../types/messages.types';

/**
 * Hook avanzado para búsqueda y filtros de conversaciones y mensajes
 * Incluye debouncing, filtros múltiples y resultados optimizados
 */
export function useSearchAndFilter(
  conversations: AnyConversation[],
  messages: Message[],
  debounceMs: number = 300
) {
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    status: 'all',
    hasUnread: false
  });

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.query, debounceMs]);

  // Add to search history when query changes
  useEffect(() => {
    if (debouncedQuery.trim() && !searchHistory.includes(debouncedQuery.trim())) {
      setSearchHistory(prev => [debouncedQuery.trim(), ...prev.slice(0, 9)]);
    }
  }, [debouncedQuery, searchHistory]);

  // Filter conversations based on current filters
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Text search
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const matchesName = conv.name?.toLowerCase().includes(query);
        const matchesLastMessage = conv.lastMessage?.toLowerCase().includes(query);
        
        // For group conversations, also search in member names
        if (conv.type === 'group' && conv.members) {
          const matchesMember = conv.members.some(member => 
            member.name?.toLowerCase().includes(query)
          );
          return matchesName || matchesLastMessage || matchesMember;
        }
        
        return matchesName || matchesLastMessage;
      });
    }

    // Type filter (all, individual, groups)
    if (filters.type !== 'all') {
      filtered = filtered.filter(conv => {
        if (filters.type === 'individual') return conv.type === 'individual';
        if (filters.type === 'groups') return conv.type === 'group';
        return true;
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(conv => conv.status === filters.status);
    }

    // Unread filter
    if (filters.hasUnread) {
      filtered = filtered.filter(conv => conv.unread && conv.unread > 0);
    }

    // Date range filter
    if (filters.dateRange) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      
      filtered = filtered.filter(conv => {
        const lastMessageDate = new Date(conv.timestamp);
        return lastMessageDate >= fromDate && lastMessageDate <= toDate;
      });
    }

    return filtered;
  }, [conversations, debouncedQuery, filters]);

  // Search in messages when query is provided
  const messageSearchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const query = debouncedQuery.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(query)
    ).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [messages, debouncedQuery]);

  // Combined search results
  const searchResults: SearchResult = useMemo(() => ({
    conversations: filteredConversations,
    messages: messageSearchResults,
    totalResults: filteredConversations.length + messageSearchResults.length
  }), [filteredConversations, messageSearchResults]);

  // Get suggested searches based on conversation names and recent searches
  const suggestions = useMemo(() => {
    if (!filters.query.trim()) {
      return searchHistory.slice(0, 5);
    }

    const query = filters.query.toLowerCase();
    const conversationSuggestions = conversations
      .filter(conv => conv.name?.toLowerCase().includes(query))
      .map(conv => conv.name!)
      .slice(0, 3);

    const historySuggestions = searchHistory
      .filter(term => term.toLowerCase().includes(query))
      .slice(0, 2);

    return Array.from(new Set([...conversationSuggestions, ...historySuggestions]));
  }, [filters.query, conversations, searchHistory]);

  // Quick filters for common use cases
  const quickFilters = useMemo(() => {
    const unreadCount = conversations.filter(c => c.unread && c.unread > 0).length;
    const groupsCount = conversations.filter(c => c.type === 'group').length;
    const individualCount = conversations.filter(c => c.type === 'individual').length;
    
    return [
      { 
        key: 'unread', 
        label: 'No leídos', 
        count: unreadCount,
        active: filters.hasUnread,
        filter: () => updateFilters({ hasUnread: !filters.hasUnread })
      },
      { 
        key: 'groups', 
        label: 'Grupos', 
        count: groupsCount,
        active: filters.type === 'groups',
        filter: () => updateFilters({ type: filters.type === 'groups' ? 'all' : 'groups' })
      },
      { 
        key: 'individual', 
        label: 'Individual', 
        count: individualCount,
        active: filters.type === 'individual',
        filter: () => updateFilters({ type: filters.type === 'individual' ? 'all' : 'individual' })
      }
    ];
  }, [conversations, filters]);

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      type: 'all',
      status: 'all',
      hasUnread: false
    });
  }, []);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Advanced search function for complex queries
  const advancedSearch = useCallback((searchParams: {
    query?: string;
    type?: ViewMode;
    status?: ConversationStatus | 'all';
    hasUnread?: boolean;
    dateFrom?: string;
    dateTo?: string;
    participants?: string[];
  }) => {
    const newFilters: SearchFilters = {
      query: searchParams.query || '',
      type: searchParams.type || 'all',
      status: searchParams.status || 'all',
      hasUnread: searchParams.hasUnread || false
    };

    if (searchParams.dateFrom && searchParams.dateTo) {
      newFilters.dateRange = {
        from: searchParams.dateFrom,
        to: searchParams.dateTo
      };
    }

    setFilters(newFilters);
  }, []);

  // Save current search as preset
  const saveSearchPreset = useCallback((name: string) => {
    // This would typically save to localStorage or server
    const preset = {
      name,
      filters: { ...filters },
      timestamp: new Date().toISOString()
    };
    
    console.log('Saving search preset:', preset);
    // Implementation would save to persistent storage
  }, [filters]);

  return {
    // Search state (matching interface)
    searchQuery: filters.query,
    filters,
    results: searchResults,
    isSearching,
    
    // Filtered data (matching interface)
    filteredConversations,
    
    // Actions (matching interface)
    setSearchQuery: (query: string) => updateFilters({ query }),
    setFilters: updateFilters,
    clearSearch: clearFilters,
    performSearch: async (query: string, newFilters?: Partial<SearchFilters>) => {
      const searchFilters = { query, ...newFilters };
      updateFilters(searchFilters);
    },
    
    // Extended utilities
    suggestions,
    quickFilters,
    searchHistory,
    clearSearchHistory,
    advancedSearch,
    saveSearchPreset,
    hasActiveFilters: filters.query.trim() !== '' || 
                     filters.type !== 'all' || 
                     filters.status !== 'all' || 
                     filters.hasUnread ||
                     !!filters.dateRange,
    highlightMatch: (text: string) => {
      if (!debouncedQuery.trim()) return text;
      
      const regex = new RegExp(`(${debouncedQuery})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
  };
}

/**
 * Hook simplificado para búsqueda básica (sin filtros avanzados)
 */
export function useSimpleSearch(
  conversations: AnyConversation[],
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const filteredConversations = useMemo(() => {
    if (!debouncedQuery.trim()) return conversations;
    
    const searchTerm = debouncedQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.name?.toLowerCase().includes(searchTerm) ||
      conv.lastMessage?.toLowerCase().includes(searchTerm)
    );
  }, [conversations, debouncedQuery]);

  return {
    query,
    setQuery,
    filteredConversations,
    isSearching: query !== debouncedQuery
  };
}
