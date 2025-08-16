import { motion } from 'framer-motion';
import { 
  Heart, 
  X, 
  MessageCircle, 
  Star,
  MapPin,
  Briefcase,
  Zap
} from 'lucide-react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
  isMutual?: boolean;
  loading?: boolean;
}

export function MatchCard({ 
  match, 
  onLike, 
  onPass, 
  onSuperLike,
  onMessage,
  showActions = false,
  isMutual = false,
  loading = false
}: MatchCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Avatar & Status */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        {match.avatar_url ? (
          <img
            src={match.avatar_url}
            alt={match.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {getInitials(match.name)}
            </span>
          </div>
        )}
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {match.match_percentage && (
            <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-medium">
              {match.match_percentage}% match
            </div>
          )}
          {isMutual && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              ¡Match!
            </div>
          )}
        </div>

        {/* Super Like Indicator */}
        {match.is_mutual && (
          <div className="absolute top-3 right-3">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name & Age */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {match.name}
              {match.age && <span className="text-gray-500 ml-1">, {match.age}</span>}
            </h3>
            
            {/* Location & Company */}
            <div className="flex flex-col gap-1 mt-1">
              {match.location && (
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{match.location}</span>
                </div>
              )}
              {match.company && (
                <div className="flex items-center text-gray-500 text-sm">
                  <Briefcase className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{match.company}</span>
                  {match.role && <span className="ml-1">• {match.role}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {match.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {match.bio}
          </p>
        )}

        {/* Skills */}
        {match.skills && match.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {match.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md font-medium"
              >
                {skill}
              </span>
            ))}
            {match.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-md">
                +{match.skills.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Looking For */}
        {match.looking_for && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-xs font-medium">
              Busca: {match.looking_for}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (onLike || onPass || onSuperLike) && (
          <div className="flex gap-2">
            {onPass && (
              <button
                onClick={onPass}
                disabled={loading}
                className="flex-1 flex items-center justify-center py-2.5 px-4 border-2 border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-2" />
                Pasar
              </button>
            )}
            
            {onSuperLike && (
              <button
                onClick={onSuperLike}
                disabled={loading}
                className="px-3 py-2.5 border-2 border-yellow-300 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 hover:border-yellow-400 transition-all duration-200 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            
            {onLike && (
              <button
                onClick={onLike}
                disabled={loading}
                className="flex-1 flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                <Heart className="w-4 h-4 mr-2" />
                Me gusta
              </button>
            )}
          </div>
        )}

        {/* Mutual Match Actions */}
        {isMutual && onMessage && (
          <button 
            onClick={onMessage}
            className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-sm font-medium"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar mensaje
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
