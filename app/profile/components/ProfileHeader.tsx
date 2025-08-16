import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  Globe, 
  Linkedin, 
  Twitter, 
  Github,
  Edit3,
  Save,
  X,
  Star,
  Calendar,
  Briefcase,
  Shield,
  Crown,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, SocialLinks, ProfileEditData } from '../types';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
  onUploadAvatar: (file: File) => void;
}

interface EditFormData {
  name: string;
  bio: string;
  location: string;
  role: string;
  company: string;
  website: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isEditing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onUploadAvatar
}: ProfileHeaderProps) {
  const [editData, setEditData] = useState<EditFormData>({
    name: profile?.name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    role: profile?.role || '',
    company: profile?.company || '',
    website: profile?.website || '',
    linkedin_url: profile?.linkedin_url || '',
    twitter_url: profile?.twitter_url || '',
    github_url: profile?.github_url || ''
  });

  const handleSave = () => {
    onSave(editData);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar(file);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const now = new Date();
    const monthsAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsAgo < 1) return 'Se unió este mes';
    if (monthsAgo < 12) return `Se unió hace ${monthsAgo} ${monthsAgo === 1 ? 'mes' : 'meses'}`;
    
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `Se unió hace ${yearsAgo} ${yearsAgo === 1 ? 'año' : 'años'}`;
  };

  const socialLinks: SocialLinks = {
    website: editData.website,
    linkedin_url: editData.linkedin_url,
    twitter_url: editData.twitter_url,
    github_url: editData.github_url
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        {/* Main Header */}
        <div className="pb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <span className="text-white text-2xl font-bold">
                      {profile?.name ? getInitials(profile.name) : 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Camera Icon for Own Profile */}
              {isOwnProfile && (
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Status Badges */}
              <div className="absolute -top-2 -right-4 flex gap-1">
                {profile?.is_verified && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
                {profile?.is_premium && (
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <EditingForm
                  editData={editData}
                  setEditData={setEditData}
                  onSave={handleSave}
                  onCancel={onCancel}
                  saving={saving}
                />
              ) : (
                <ViewMode
                  profile={profile}
                  socialLinks={socialLinks}
                  isOwnProfile={isOwnProfile}
                  onEdit={onEdit}
                />
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatJoinDate(profile?.created_at)}</span>
                </div>
                
                {profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile?.company && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.company}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// View Mode Component
function ViewMode({
  profile,
  socialLinks,
  isOwnProfile,
  onEdit
}: {
  profile: UserProfile | null;
  socialLinks: SocialLinks;
  isOwnProfile: boolean;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profile?.name || 'Usuario'}
          </h1>
          
          {profile?.role && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-sm">
                {profile.role}
              </Badge>
              {profile.company && (
                <span className="text-gray-600">en {profile.company}</span>
              )}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <Button 
            onClick={onEdit}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Editar perfil
          </Button>
        )}
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="text-gray-600 leading-relaxed mb-4 max-w-2xl">
          {profile.bio}
        </p>
      )}

      {/* Social Links */}
      <SocialLinksDisplay socialLinks={socialLinks} />
    </>
  );
}

// Editing Form Component
function EditingForm({
  editData,
  setEditData,
  onSave,
  onCancel,
  saving
}: {
  editData: EditFormData;
  setEditData: React.Dispatch<React.SetStateAction<EditFormData>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Name */}
        <div>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full max-w-md"
            placeholder="Tu nombre"
          />
        </div>

        {/* Role & Company */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={editData.role}
            onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tu rol"
          />
          <input
            type="text"
            value={editData.company}
            onChange={(e) => setEditData(prev => ({ ...prev, company: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Empresa"
          />
        </div>

        {/* Bio */}
        <div>
          <textarea
            value={editData.bio}
            onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="Cuéntanos sobre ti..."
          />
        </div>

        {/* Location */}
        <div>
          <input
            type="text"
            value={editData.location}
            onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ubicación"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="url"
            value={editData.website}
            onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Sitio web"
          />
          <input
            type="url"
            value={editData.linkedin_url}
            onChange={(e) => setEditData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="LinkedIn URL"
          />
          <input
            type="url"
            value={editData.twitter_url}
            onChange={(e) => setEditData(prev => ({ ...prev, twitter_url: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Twitter URL"
          />
          <input
            type="url"
            value={editData.github_url}
            onChange={(e) => setEditData(prev => ({ ...prev, github_url: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="GitHub URL"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        <Button 
          onClick={onCancel}
          variant="outline"
          disabled={saving}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </Button>
      </div>
    </>
  );
}

// Social Links Display Component
function SocialLinksDisplay({ socialLinks }: { socialLinks: SocialLinks }) {
  const links = [
    { 
      key: 'website', 
      url: socialLinks.website, 
      icon: Globe, 
      label: 'Sitio web',
      color: 'text-gray-600 hover:text-gray-900'
    },
    { 
      key: 'linkedin_url', 
      url: socialLinks.linkedin_url, 
      icon: Linkedin, 
      label: 'LinkedIn',
      color: 'text-blue-600 hover:text-blue-700'
    },
    { 
      key: 'twitter_url', 
      url: socialLinks.twitter_url, 
      icon: Twitter, 
      label: 'Twitter',
      color: 'text-sky-500 hover:text-sky-600'
    },
    { 
      key: 'github_url', 
      url: socialLinks.github_url, 
      icon: Github, 
      label: 'GitHub',
      color: 'text-gray-800 hover:text-black'
    }
  ].filter(link => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {links.map(({ key, url, icon: Icon, label, color }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 ${color} transition-colors`}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm">{label}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  );
}
