// ==============================================
// Custom Hook: useMatching
// Manejo completo del sistema de matching
// ==============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

export interface MatchUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  experience_years: number;
  skills: Array<{
    skill_name: string;
    skill_level: number;
    skill_category: string;
  }>;
  compatibility_score: number;
  match_reasons: string[];
}

export interface MutualMatch {
  match_id: string;
  matched_at: string;
  compatibility_score: number;
  match_status: string;
  other_user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    bio: string;
    role: string;
    company: string;
    industry: string;
    location: string;
  };
}

export interface UseMatchingResult {
  // Potential matches
  matches: MatchUser[];
  loadingMatches: boolean;
  matchesError: string | null;
  
  // Mutual matches
  mutualMatches: MutualMatch[];
  loadingMutualMatches: boolean;
  mutualMatchesError: string | null;
  
  // Actions
  getMatches: () => Promise<void>;
  handleLike: (targetUserId: string) => Promise<boolean>;
  handlePass: (targetUserId: string) => Promise<boolean>;
  handleSuperLike: (targetUserId: string) => Promise<boolean>;
  getMutualMatches: () => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<boolean>;
  
  // Utils
  refreshData: () => Promise<void>;
}

export function useMatching(): UseMatchingResult {
  const { user } = useAuth();
  
  // States for potential matches
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  
  // States for mutual matches
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [loadingMutualMatches, setLoadingMutualMatches] = useState(false);
  const [mutualMatchesError, setMutualMatchesError] = useState<string | null>(null);

  // ===============================
  // POTENTIAL MATCHES
  // ===============================
  
  const getMatches = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingMatches(true);
    setMatchesError(null);
    
    try {
      const response = await fetch(`/api/matches?userId=${user.id}&limit=10`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error fetching matches');
      }
      
      setMatches(data.matches || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMatchesError(errorMessage);
      console.error('Error fetching matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  }, [user?.id]);

  // ===============================
  // INTERACTIONS (LIKE/PASS)
  // ===============================
  
  const handleInteraction = useCallback(async (
    targetUserId: string, 
    interactionType: 'like' | 'pass' | 'super_like'
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error with ${interactionType}`);
      }
      
      // Remover usuario de matches actuales
      setMatches(prev => prev.filter(match => match.id !== targetUserId));
      
      // Si fue un match mutuo, refrescar mutual matches
      if (data.mutual_match) {
        await getMutualMatches();
      }
      
      return true;
    } catch (error) {
      console.error(`Error with ${interactionType}:`, error);
      return false;
    }
  }, [user?.id]);

  const handleLike = useCallback((targetUserId: string) => 
    handleInteraction(targetUserId, 'like'), [handleInteraction]);

  const handlePass = useCallback((targetUserId: string) => 
    handleInteraction(targetUserId, 'pass'), [handleInteraction]);

  const handleSuperLike = useCallback((targetUserId: string) => 
    handleInteraction(targetUserId, 'super_like'), [handleInteraction]);

  // ===============================
  // MUTUAL MATCHES
  // ===============================
  
  const getMutualMatches = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingMutualMatches(true);
    setMutualMatchesError(null);
    
    try {
      const response = await fetch(`/api/mutual-matches?userId=${user.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error fetching mutual matches');
      }
      
      setMutualMatches(data.matches || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMutualMatchesError(errorMessage);
      console.error('Error fetching mutual matches:', error);
    } finally {
      setLoadingMutualMatches(false);
    }
  }, [user?.id]);

  // ===============================
  // UPDATE MATCH STATUS
  // ===============================
  
  const updateMatchStatus = useCallback(async (
    matchId: string, 
    status: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const response = await fetch('/api/mutual-matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          status: status,
          user_id: user.id
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error updating match status');
      }
      
      // Refrescar mutual matches
      await getMutualMatches();
      
      return true;
    } catch (error) {
      console.error('Error updating match status:', error);
      return false;
    }
  }, [user?.id, getMutualMatches]);

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================
  
  const refreshData = useCallback(async () => {
    await Promise.all([
      getMatches(),
      getMutualMatches()
    ]);
  }, [getMatches, getMutualMatches]);

  // ===============================
  // EFFECTS
  // ===============================
  
  // Auto-fetch when user is available
  useEffect(() => {
    if (user?.id) {
      refreshData();
    }
  }, [user?.id, refreshData]);

  return {
    // Potential matches
    matches,
    loadingMatches,
    matchesError,
    
    // Mutual matches
    mutualMatches,
    loadingMutualMatches,
    mutualMatchesError,
    
    // Actions
    getMatches,
    handleLike,
    handlePass,
    handleSuperLike,
    getMutualMatches,
    updateMatchStatus,
    
    // Utils
    refreshData
  };
}
