import { motion } from 'framer-motion';
import { Heart, Sparkles, Users } from 'lucide-react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';

interface DiscoverTabProps {
  matches: Match[];
  onLike: (matchId: string) => void;
  onPass: (matchId: string) => void;
  onSuperLike?: (matchId: string) => void;
  loading?: boolean;
}

export function DiscoverTab({ 
  matches, 
  onLike, 
  onPass, 
  onSuperLike,
  loading = false 
}: DiscoverTabProps) {
  
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {matches.length} nuevas conexiones disponibles
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Desliza para explorar →
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <MatchCard 
              match={match}
              onLike={() => onLike(match.id)}
              onPass={() => onPass(match.id)}
              onSuperLike={onSuperLike ? () => onSuperLike(match.id) : undefined}
              showActions={true}
              loading={loading}
            />
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {matches.length > 0 && matches.length % 9 === 0 && (
        <div className="text-center mt-12">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Cargar más matches
          </button>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-5 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="flex gap-1 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-14"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 border border-blue-100">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          ¡No hay más matches por ahora!
        </h3>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Has explorado todos los perfiles disponibles. Vuelve mañana para descubrir 
          nuevas conexiones, o mejora tu perfil para atraer más matches.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Mejorar mi perfil
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Expandir búsqueda
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          💡 <strong>Tip:</strong> Los usuarios activos reciben más matches
        </div>
      </div>
    </div>
  );
}
