import { useState, useEffect } from 'react';
import { Match, MatchesState } from '../types';

export function useMatches() {
  const [state, setState] = useState<MatchesState>({
    discover: [],
    mutual: [],
    loading: true,
    error: null
  });

  const loadMatches = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load potential matches
      const matchesResponse = await fetch('/api/matches');
      let discoverData: Match[] = [];
      
      if (matchesResponse.ok) {
        discoverData = await matchesResponse.json();
      }

      // Load mutual matches
      const mutualResponse = await fetch('/api/mutual-matches');
      let mutualData: Match[] = [];
      
      if (mutualResponse.ok) {
        mutualData = await mutualResponse.json();
      }

      setState({
        discover: discoverData,
        mutual: mutualData,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading matches:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar matches'
      }));
    }
  };

  const removeFromDiscover = (matchId: string) => {
    setState(prev => ({
      ...prev,
      discover: prev.discover.filter(match => match.id !== matchId)
    }));
  };

  const addToMutual = (match: Match) => {
    setState(prev => ({
      ...prev,
      mutual: [...prev.mutual, match]
    }));
  };

  const refreshMatches = () => {
    loadMatches();
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return {
    ...state,
    removeFromDiscover,
    addToMutual,
    refreshMatches
  };
}
