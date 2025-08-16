import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Heart, Calendar, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Match } from '../types';
import { MatchCard } from './MatchCard';

interface MutualMatchesTabProps {
  matches: Match[];
  loading?: boolean;
}

export function MutualMatchesTab({ matches, loading = false }: MutualMatchesTabProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const handleMessage = (matchId: string) => {
    // Navigate to messages with this user
    router.push(`/messages?user=${matchId}`);
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // Sort by recent (assuming created_at or similar field)
    return 0; // Default order
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {matches.length} Conexiones Mutuas
            </h2>
            <p className="text-green-700 text-sm">
              ¡Felicidades! Estos emprendedores también están interesados en conectar contigo
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
            className="px-3 py-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="recent">Más recientes</option>
            <option value="name">Por nombre</option>
          </select>
        </div>
      </div>

      {/* Success Tips */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Consejos para hacer conexiones exitosas:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Menciona algo específico de su perfil en tu primer mensaje</li>
              <li>• Propón una colaboración concreta o una videollamada</li>
              <li>• Sé auténtico y directo sobre tus objetivos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedMatches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <MatchCard 
              match={match}
              onMessage={() => handleMessage(match.id)}
              isMutual={true}
              loading={loading}
            />
          </motion.div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          ¿Quieres más conexiones como estas?
        </h3>
        <p className="text-gray-600 mb-6">
          Mantén tu perfil actualizado y activo para atraer más matches de calidad
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => router.push('/profile')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Actualizar perfil
          </button>
          <button 
            onClick={() => router.push('/projects')}
            className="px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            Publicar proyecto
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-5 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="flex gap-1 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
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
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12 border border-gray-100">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Aún no tienes conexiones mutuas
        </h3>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Cuando alguien también te dé "me gusta", aparecerá aquí y podrán empezar a colaborar juntos.
          ¡Sigue explorando y dando like a perfiles interesantes!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Explorar matches
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Mejorar mi perfil
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-center gap-2 text-yellow-700 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Los usuarios más activos consiguen más matches</span>
          </div>
        </div>
      </div>
    </div>
  );
}
