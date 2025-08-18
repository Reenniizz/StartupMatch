'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin,
  Users,
  Briefcase,
  Star,
  MessageCircle,
  Compass,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ExploreItem {
  id: string;
  type: 'project' | 'founder' | 'opportunity';
  title: string;
  description: string;
  score: number;
  location: string;
  tags: string[];
  author?: {
    name: string;
    role: string;
  };
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/explore-simple?query=${searchQuery}&filter=${selectedFilter}`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [searchQuery, selectedFilter]);

  const filteredItems = selectedFilter === 'all' 
    ? items 
    : items.filter(item => item.type === selectedFilter);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header Simple */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Explorar
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Descubre proyectos, founders y oportunidades que encajan contigo
          </p>
        </motion.div>

        {/* Búsqueda Simple */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar proyectos, personas o tecnologías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Filtros Simples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-3 flex-wrap">
            {[
              { key: 'all', label: 'Todo' },
              { key: 'project', label: 'Proyectos' },
              { key: 'founder', label: 'Founders' },
              { key: 'opportunity', label: 'Oportunidades' }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? 'default' : 'outline'}
                onClick={() => setSelectedFilter(filter.key)}
                className="h-10 mb-2"
              >
                {filter.label} ({
                  filter.key === 'all' 
                    ? filteredItems.length 
                    : items.filter(i => i.type === filter.key).length
                })
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Resultados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredItems.length === 0 ? (
            <EmptyState />
          ) : (
            filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SimpleItemCard item={item} />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

function SimpleItemCard({ item }: { item: ExploreItem }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="w-4 h-4" />;
      case 'founder': return <Users className="w-4 h-4" />;
      case 'opportunity': return <Star className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'founder': return 'bg-green-100 text-green-700 border-green-200';
      case 'opportunity': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Badge className={`${getTypeColor(item.type)} border`}>
                {getTypeIcon(item.type)}
                <span className="ml-1 capitalize">{item.type}</span>
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                {item.location}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3} más
                </Badge>
              )}
            </div>

            {item.author && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-semibold text-xs">
                    {item.author.name.charAt(0)}
                  </span>
                </div>
                <span>{item.author.name} • {item.author.role}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end space-y-3 ml-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {item.score}%
              </div>
              <div className="text-xs text-gray-500">Match</div>
            </div>

            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
              <Button size="sm">
                <MessageCircle className="w-4 h-4 mr-1" />
                Contactar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No encontramos resultados
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Prueba con otros términos de búsqueda o ajusta los filtros
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Limpiar filtros
      </Button>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
