/**
 * ConnectionsTab Component - Display accepted connections
 * Shows users that have mutual connection status
 */

'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  User, 
  MapPin, 
  Building, 
  Star,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMatchesStore, useMatchesData, useMatchesLoading } from '@/store/matches';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export const ConnectionsTab: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { connections } = useMatchesData();
  const { connections: loading } = useMatchesLoading();
  const { setLoading, setConnections, sendMessage, filters } = useMatchesStore();

  // Filter connections based on current filters
  const filteredConnections = connections.filter(connection => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        connection.name?.toLowerCase().includes(searchTerm) ||
        connection.company?.toLowerCase().includes(searchTerm) ||
        connection.role?.toLowerCase().includes(searchTerm) ||
        connection.skills?.some(skill => skill.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.industry !== 'all' && connection.industry !== filters.industry) {
      return false;
    }

    if (filters.experience !== 'all') {
      const years = connection.experience_years || 0;
      switch (filters.experience) {
        case '0-2 años':
          return years <= 2;
        case '3-5 años':
          return years >= 3 && years <= 5;
        case '6-10 años':
          return years >= 6 && years <= 10;
        case '10+ años':
          return years > 10;
      }
    }

    if (filters.compatibility[0] > 0 || filters.compatibility[1] < 100) {
      const score = connection.compatibility_score || 0;
      return score >= filters.compatibility[0] && score <= filters.compatibility[1];
    }

    return true;
  });

  // Sort connections
  const sortedConnections = filteredConnections.sort((a, b) => {
    switch (filters.sortBy) {
      case 'compatibility':
        return (b.compatibility_score || 0) - (a.compatibility_score || 0);
      case 'mutual_connections':
        return (b.mutual_connections || 0) - (a.mutual_connections || 0);
      case 'recent':
      default:
        return new Date(b.matched_at || b.created_at || 0).getTime() - 
               new Date(a.matched_at || a.created_at || 0).getTime();
    }
  });

  // Load connections
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading('connections', true);
      
      const response = await fetch('/api/matches/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las conexiones',
        variant: 'destructive'
      });
    } finally {
      setLoading('connections', false);
    }
  };

  const handleSendMessage = async (userId: string, userName: string) => {
    try {
      await sendMessage(userId, `¡Hola ${userName}! Me gustaría conectar contigo.`);
      
      toast({
        title: 'Mensaje enviado',
        description: `Se ha enviado un mensaje a ${userName}`,
      });
      
      // Redirect to messages
      router.push(`/messages?userId=${userId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (sortedConnections.length === 0) {
    return (
      <EmptyState
        type="no-connections"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {sortedConnections.length} conexión{sortedConnections.length !== 1 ? 'es' : ''}
          </h3>
          {filteredConnections.length !== connections.length && (
            <Badge variant="secondary">
              Filtrado de {connections.length}
            </Badge>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadConnections}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {sortedConnections.map((connection, index) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={connection.avatar_url} />
                        <AvatarFallback>
                          {connection.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {connection.name || 'Usuario'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {connection.role} {connection.company && `en ${connection.company}`}
                        </p>
                      </div>
                    </div>
                    
                    {connection.compatibility_score && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {connection.compatibility_score}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    {connection.location && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {connection.location}
                      </div>
                    )}
                    
                    {connection.industry && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Building className="h-4 w-4 mr-2" />
                        {connection.industry}
                      </div>
                    )}

                    {connection.mutual_connections && connection.mutual_connections > 0 && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        {connection.mutual_connections} conexión{connection.mutual_connections !== 1 ? 'es' : ''} en común
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {connection.skills && connection.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {connection.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {connection.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{connection.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {connection.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {connection.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSendMessage(connection.id, connection.name || 'Usuario')}
                      className="flex-1 gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Mensaje
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewProfile(connection.id)}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
