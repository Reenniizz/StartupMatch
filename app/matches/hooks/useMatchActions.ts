import { useState } from 'react';
import { LikeResponse } from '../types';

export function useMatchActions() {
  const [loading, setLoading] = useState(false);

  const likeUser = async (matchId: string): Promise<LikeResponse> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/matches/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedUserId: matchId })
      });

      if (!response.ok) {
        throw new Error('Error al dar like');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error liking match:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const passUser = async (matchId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/matches/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passedUserId: matchId })
      });

      return response.ok;

    } catch (error) {
      console.error('Error passing match:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const superLike = async (matchId: string): Promise<LikeResponse> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/matches/super-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedUserId: matchId })
      });

      if (!response.ok) {
        throw new Error('Error al dar super like');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error super liking match:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    likeUser,
    passUser,
    superLike,
    loading
  };
}
