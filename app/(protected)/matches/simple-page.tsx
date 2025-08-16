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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export default function ModernMatchesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
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
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
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
        setConnections(data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
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

  // Filter matches based on search
  const filteredMatches = matches.filter(match =>
    match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConnections = connections.filter(connection =>
    connection.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Matches & Conexiones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Encuentra y conecta con otros emprendedores
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

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, rol o industria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Matches ({filteredMatches.length})
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Conexiones ({filteredConnections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <MatchesGrid matches={filteredMatches} onConnect={sendConnectionRequest} />
          </TabsContent>

          <TabsContent value="connections">
            <ConnectionsList connections={filteredConnections} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Matches Grid Component
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
          Completa tu perfil para encontrar más matches compatibles
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

        {match.skills && match.skills.length > 0 && (
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
