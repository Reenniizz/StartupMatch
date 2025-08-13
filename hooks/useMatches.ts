import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface MatchUser {
  matched_user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  company?: string;
  role?: string;
  location?: string;
  industry?: string;
  avatar_url?: string;
  compatibility_score: number;
  common_skills: number;
  common_skills_details?: Array<{
    skill_name: string;
    skill_level: number;
    skill_category: string;
  }>;
  is_online: boolean;
  match_reasons?: string[];
}

export interface MatchFilters {
  min_compatibility?: number;
  industry?: string;
  location?: string;
  connection_type?: string;
  limit?: number;
}

interface UseMatchesResult {
  matches: MatchUser[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalFound: number;
  totalPotential: number;
  discoverMatches: (filters?: MatchFilters) => Promise<void>;
  sendConnectionRequest: (
    addresseeId: string, 
    connectionType?: string, 
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
  calculateCompatibility: (
    targetUserId: string, 
    forceRecalculate?: boolean
  ) => Promise<{ score: number; cached: boolean } | null>;
  refreshMatches: () => Promise<void>;
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalFound, setTotalFound] = useState(0);
  const [totalPotential, setTotalPotential] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<MatchFilters>({});

  const discoverMatches = useCallback(async (filters: MatchFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.min_compatibility) queryParams.append('min_compatibility', filters.min_compatibility.toString());
      if (filters.industry) queryParams.append('industry', filters.industry);
      if (filters.location) queryParams.append('location', filters.location);

      const response = await fetch(`/api/matching?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al descubrir matches');
      }

      setMatches(data.matches || []);
      setTotalFound(data.matches?.length || 0);
      setTotalPotential(data.total_potential || 0);
      setHasMore((data.matches?.length || 0) === (filters.limit || 10));
      setCurrentFilters(filters);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error discovering matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendConnectionRequest = useCallback(async (
    addresseeId: string,
    connectionType: string = 'general',
    message?: string
  ) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresseeId,
          connectionType,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al enviar solicitud' };
      }

      // Remover el usuario de la lista de matches después de enviar solicitud
      setMatches(prev => prev.filter(match => match.matched_user_id !== addresseeId));

      return { success: true };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error sending connection request:', err);
      return { success: false, error: message };
    }
  }, []);

  const calculateCompatibility = useCallback(async (
    targetUserId: string,
    forceRecalculate: boolean = false
  ): Promise<{ score: number; cached: boolean } | null> => {
    try {
      const response = await fetch('/api/matches/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          forceRecalculate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error calculating compatibility:', data.error);
        return null;
      }

      return {
        score: data.compatibility_score,
        cached: data.cached
      };

    } catch (err) {
      console.error('Error calculating compatibility:', err);
      return null;
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    await discoverMatches(currentFilters);
  }, [currentFilters, discoverMatches]);

  // Cargar matches iniciales al montar el componente
  useEffect(() => {
    discoverMatches();
  }, [discoverMatches]);

  return {
    matches,
    loading,
    error,
    hasMore,
    totalFound,
    totalPotential,
    discoverMatches,
    sendConnectionRequest,
    calculateCompatibility,
    refreshMatches,
  };
}

// Hook adicional para manejar conexiones
interface Connection {
  connection_id: string;
  connected_user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  company?: string;
  role?: string;
  connection_type: string;
  connected_at: string;
  last_message?: string;
  last_message_at?: string;
  is_online: boolean;
}

interface ConnectionRequest {
  id: string;
  status: string;
  connection_type: string;
  message?: string;
  created_at: string;
  requester: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    company?: string;
    role?: string;
    location?: string;
  };
}

interface UseConnectionsResult {
  connections: Connection[];
  connectionRequests: ConnectionRequest[];
  sentRequests: ConnectionRequest[]; // Añadir solicitudes enviadas
  loading: boolean;
  error: string | null;
  stats: {
    total_accepted: number;
    pending_received: number;
    pending_sent: number;
    weekly_new: number;
  };
  fetchConnections: (status?: string, search?: string) => Promise<void>;
  fetchConnectionRequests: (status?: string) => Promise<void>;
  fetchSentRequests: (status?: string) => Promise<void>; // Añadir función para solicitudes enviadas
  respondToConnection: (
    connectionId: string, 
    response: 'accepted' | 'rejected'
  ) => Promise<{ success: boolean; error?: string }>;
  refreshAll: () => Promise<void>;
}

export function useConnections(): UseConnectionsResult {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_accepted: 0,
    pending_received: 0,
    pending_sent: 0,
    weekly_new: 0
  });

  const fetchConnections = useCallback(async (status: string = 'accepted', search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const response = await fetch(`/api/connections?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener conexiones');
      }

      setConnections(data.connections || []);
      setStats(data.stats || stats);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  const fetchConnectionRequests = useCallback(async (status: string = 'pending') => {
    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No hay sesión activa para obtener connection requests');
        return;
      }

      const response = await fetch(`/api/connections/requests?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setConnectionRequests(data.requests || []);
      } else {
        console.error('Error fetching connection requests:', data.error);
      }
    } catch (err) {
      console.error('Error fetching connection requests:', err);
    }
  }, []);

  const respondToConnection = useCallback(async (
    connectionId: string,
    response: 'accepted' | 'rejected'
  ) => {
    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No hay sesión activa para responder connection request');
        return { success: false, error: 'No hay sesión activa' };
      }

      const apiResponse = await fetch(`/api/connections/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          connectionRequestId: connectionId,
          response: response 
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        return { success: false, error: data.error || 'Error al procesar respuesta' };
      }

      // Actualizar listas locales
      setConnectionRequests(prev => prev.filter(req => req.id !== connectionId));
      
      if (response === 'accepted') {
        await fetchConnections(); // Refrescar conexiones aceptadas
      }

      return { success: true };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error responding to connection:', err);
      return { success: false, error: message };
    }
  }, [fetchConnections]);

  const fetchSentRequests = useCallback(async (status: string = 'pending') => {
    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No hay sesión activa para obtener sent requests');
        return;
      }

      const response = await fetch(`/api/connections/sent?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSentRequests(data.requests || []);
      } else {
        console.error('Error fetching sent requests:', data.error);
      }
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchConnections(),
      fetchConnectionRequests(),
      fetchSentRequests()
    ]);
  }, [fetchConnections, fetchConnectionRequests, fetchSentRequests]);

  return {
    connections,
    connectionRequests,
    sentRequests,
    loading,
    error,
    stats,
    fetchConnections,
    fetchConnectionRequests,
    fetchSentRequests,
    respondToConnection,
    refreshAll,
  };
}
