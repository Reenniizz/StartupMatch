import { useState, useEffect } from 'react';

export interface DashboardStats {
  connections: {
    total: number;
    weeklyChange: number;
    weeklyChangeText: string;
  };
  matches: {
    total: number;
    dailyNew: number;
    dailyNewText: string;
  };
  conversations: {
    total: number;
    unread: number;
    unreadText: string;
  };
  successRate: {
    percentage: number;
    change: number;
    changeText: string;
  };
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Fallback con datos por defecto si falla la API
      setStats({
        connections: {
          total: 0,
          weeklyChange: 0,
          weeklyChangeText: 'Sin cambios esta semana'
        },
        matches: {
          total: 0,
          dailyNew: 0,
          dailyNewText: 'Sin nuevos hoy'
        },
        conversations: {
          total: 0,
          unread: 0,
          unreadText: 'Todo leído'
        },
        successRate: {
          percentage: 0,
          change: 0,
          changeText: '0% vs mes anterior'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
};
