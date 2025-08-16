import { motion } from 'framer-motion';
import { 
  MapPin, 
  Briefcase, 
  Heart, 
  MessageCircle, 
  ExternalLink,
  Shield,
  Star,
  Users,
  Eye,
  Calendar
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import Link from 'next/link';

interface ProfileCardProps {
  profile: UserProfile;
  viewMode: ViewMode;
  onLike?: () => void;
  onMessage?: () => void;
  onView?: () => void;
}

export function ProfileCard({ profile, viewMode, onLike, onMessage, onView }: ProfileCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Hace tiempo';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    return 'Hace más de 1 semana';
  };

  if (viewMode === 'list') {
    return <ListProfileCard profile={profile} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      {/* Header with Avatar */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {getInitials(profile.name)}
                </span>
              </div>
            )}
            
            {/* Status Indicators */}
            <div className="absolute -top-1 -right-1 flex gap-1">
              {profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
              {profile.is_premium && (
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 p-6">
        {/* Name & Role */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {profile.name}
              </h3>
              {profile.role && (
                <p className="text-blue-600 text-sm font-medium truncate">
                  {profile.role}
                </p>
              )}
            </div>
            
            {profile.match_percentage && profile.match_percentage > 0 && (
              <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {profile.match_percentage}% match
              </div>
            )}
          </div>
          
          {/* Company & Location */}
          <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
            {profile.company && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span className="truncate">{profile.company}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {profile.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-md">
                +{profile.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Looking For */}
        {profile.looking_for && (
          <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-xs">
              <strong>Busca:</strong> {profile.looking_for}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-3">
            {profile.connections_count !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{profile.connections_count} conexiones</span>
              </div>
            )}
            {profile.projects_count !== undefined && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>{profile.projects_count} proyectos</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatLastActive(profile.last_active)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver perfil
            </button>
          )}
          
          {onLike && (
            <button
              onClick={onLike}
              className="flex items-center justify-center py-2 px-3 border border-pink-300 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
          
          {onMessage && (
            <button
              onClick={onMessage}
              className="flex items-center justify-center py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// List View Component
function ListProfileCard({ profile }: { profile: UserProfile }) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600">
                {getInitials(profile.name)}
              </span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute -top-1 -right-1 flex gap-0.5">
            {profile.is_verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-2 h-2 text-white" />
              </div>
            )}
            {profile.is_premium && (
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {profile.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                {profile.role && (
                  <>
                    <span className="text-blue-600 font-medium">{profile.role}</span>
                    {(profile.company || profile.location) && <span>•</span>}
                  </>
                )}
                {profile.company && (
                  <>
                    <span>{profile.company}</span>
                    {profile.location && <span>•</span>}
                  </>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
            
            {profile.match_percentage && profile.match_percentage > 0 && (
              <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {profile.match_percentage}% match
              </div>
            )}
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {skill}
                </span>
              ))}
              {profile.skills.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  +{profile.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
