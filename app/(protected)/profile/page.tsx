"use client";

import { Suspense } from 'react';
import { ProfileHeader } from './components/ProfileHeader';
import { SkillsSection } from './components/SkillsSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ActivityFeed } from './components/ActivityFeed';
import { useProfile } from './hooks/useProfile';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle } from 'lucide-react';

function ProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const {
    profile,
    skills,
    experience,
    activities,
    loading,
    saving,
    error,
    isEditing,
    isOwnProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addExperience,
    updateExperience,
    removeExperience,
    setIsEditing,
    uploadAvatar
  } = useProfile(userId || undefined);

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar el perfil
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Perfil no encontrado
            </h2>
            <p className="text-gray-600 mb-4">
              No se pudo encontrar tu perfil. Es posible que necesites completar tu registro.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Usuario no encontrado
            </h2>
            <p className="text-gray-600 mb-4">
              El perfil que buscas no existe o no está disponible.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        saving={saving}
        onEdit={() => setIsEditing(true)}
        onSave={updateProfile}
        onCancel={() => setIsEditing(false)}
        onUploadAvatar={uploadAvatar}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success message after editing */}
        {!isEditing && !error && (
          <div className="mb-6">
            {/* Any success messages can go here */}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Skills & Experience */}
          <div className="lg:col-span-2 space-y-6">
            <SkillsSection
              skills={skills}
              isOwnProfile={isOwnProfile}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
              saving={saving}
            />
            
            <ExperienceSection
              experience={experience}
              isOwnProfile={isOwnProfile}
              onAddExperience={addExperience}
              onUpdateExperience={updateExperience}
              onRemoveExperience={removeExperience}
              saving={saving}
            />
          </div>

          {/* Right Column - Activity Feed */}
          <div className="space-y-6">
            <ActivityFeed
              activities={activities}
              isOwnProfile={isOwnProfile}
            />
            
            {/* Profile Stats Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estadísticas del perfil
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Habilidades</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {skills.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Experiencia</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {experience.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Actividades</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {activities.length}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completado del perfil</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(((profile?.name ? 1 : 0) +
                          (profile?.bio ? 1 : 0) +
                          (profile?.location ? 1 : 0) +
                          (profile?.role ? 1 : 0) +
                          (skills.length > 0 ? 1 : 0)) / 5 * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips for profile completion */}
            {isOwnProfile && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Mejora tu perfil
                  </h3>
                  <div className="space-y-2 text-xs text-blue-800">
                    {!profile?.bio && (
                      <p>• Agrega una biografía para contar tu historia</p>
                    )}
                    {skills.length < 3 && (
                      <p>• Añade más habilidades para destacar</p>
                    )}
                    {experience.length === 0 && (
                      <p>• Comparte tu experiencia profesional</p>
                    )}
                    {!profile?.avatar_url && (
                      <p>• Sube una foto de perfil</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="pb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-4">
                <div className="w-64 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-96 h-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton type="page-layout" />
            <LoadingSkeleton type="page-layout" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton type="page-layout" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfileContent />
      </Suspense>
    </ErrorBoundary>
  );
}
