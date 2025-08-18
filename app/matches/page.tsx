'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Search, 
  Filter,
  RefreshCw,
  ArrowLeft,
  BarChart3,
  Handshake,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ProfessionalMatchingHub from '@/components/ProfessionalMatchingHub';
import AdvancedNetworkingFilters from '@/components/AdvancedNetworkingFilters';
import NetworkingAnalyticsDashboard from '@/components/NetworkingAnalyticsDashboard';
import ProfessionalCollaborationHub from '@/components/ProfessionalCollaborationHub';

interface MatchUser {
  id: string;
  name: string;
  role: string;
  industry: string;
  location: string;
  skills: string[];
  avatar?: string;
  compatibility?: number;
}

interface Connection {
  id: string;
  user: MatchUser;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  mutual: boolean;
}

export default function ProfessionalMatchesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discovery');
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch matches
  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/mutual-matches');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que data es un array
        setMatches(Array.isArray(data) ? data : []);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch connections
  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que data es un array
        setConnections(Array.isArray(data) ? data : []);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      setConnections([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchConnections();
    }
  }, [user]);

  // Send connection request
  const sendConnectionRequest = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        await fetchConnections();
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Profesional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Centro de Networking Profesional
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Descubre oportunidades de negocio y conexiones estratégicas
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setLoading(true);
                fetchMatches();
                fetchConnections();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </motion.div>

        {/* Navegación Principal de Tabs Profesionales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white dark:bg-gray-800 shadow-sm">
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Colaboración
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Conexiones ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avanzados
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="discovery">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalMatchingHub />
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NetworkingAnalyticsDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="collaboration">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProfessionalCollaborationHub />
            </motion.div>
          </TabsContent>

          <TabsContent value="connections">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ConnectionsList connections={connections} />
            </motion.div>
          </TabsContent>

          <TabsContent value="advanced">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdvancedNetworkingFilters />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Matches Grid Component - mantenemos para conexiones existentes
function MatchesGrid({ 
  matches, 
  onConnect 
}: { 
  matches: MatchUser[]; 
  onConnect: (userId: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No hay matches disponibles
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Usa el Discovery profesional para encontrar nuevas oportunidades
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <MatchCard match={match} onConnect={onConnect} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Match Card Component
function MatchCard({ 
  match, 
  onConnect 
}: { 
  match: MatchUser; 
  onConnect: (userId: string) => void;
}) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {match.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {match.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {match.role}
              </p>
            </div>
          </div>
          {match.compatibility && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {match.compatibility}% match
            </Badge>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Industria:</strong> {match.industry}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Ubicación:</strong> {match.location}
          </p>
        </div>

        {match.skills && Array.isArray(match.skills) && match.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Habilidades:
            </p>
            <div className="flex flex-wrap gap-1">
              {match.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {match.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.skills.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onConnect(match.id)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Conectar
          </Button>
          <Button variant="outline" size="icon">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Connections List Component
function ConnectionsList({ connections }: { connections: Connection[] }) {
  if (connections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No tienes conexiones aún
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Envía solicitudes de conexión desde la pestaña de matches
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {connections.map((connection, index) => (
          <motion.div
            key={connection.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
          >
            <ConnectionCard connection={connection} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Connection Card Component
function ConnectionCard({ connection }: { connection: Connection }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Conectado';
      case 'pending':
        return 'Pendiente';
      case 'declined':
        return 'Rechazado';
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {connection.user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {connection.user.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {connection.user.role} • {connection.user.industry}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge className={cn('text-xs', getStatusColor(connection.status))}>
              {getStatusText(connection.status)}
            </Badge>
            {connection.mutual && (
              <Badge variant="secondary" className="text-xs">
                Mutuo
              </Badge>
            )}
            {connection.status === 'accepted' && (
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              <div>
                <div className="h-8 bg-gray-300 rounded w-64"></div>
                <div className="h-4 bg-gray-300 rounded w-48 mt-2"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-300 rounded w-24"></div>
          </div>

          {/* Search skeleton */}
          <div className="h-12 bg-gray-300 rounded"></div>

          {/* Tabs skeleton */}
          <div className="h-12 bg-gray-300 rounded"></div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
