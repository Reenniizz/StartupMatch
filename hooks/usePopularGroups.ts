import { useState, useEffect } from 'react';

export interface PopularGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  recentMessages: number;
  isMember: boolean;
  isVerified: boolean;
  initials: string;
  gradient: string;
  status: string;
}

export const usePopularGroups = () => {
  const [groups, setGroups] = useState<PopularGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/popular-groups');
      
      if (!response.ok) {
        throw new Error('Error al obtener grupos populares');
      }

      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching popular groups:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Fallback con array vacío si falla la API
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const refetch = () => {
    fetchGroups();
  };

  return {
    groups,
    loading,
    error,
    refetch
  };
};
