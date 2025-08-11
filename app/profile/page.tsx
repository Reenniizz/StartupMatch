"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Users,
  Briefcase,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    github: '',
    skills: [] as string[],
    interests: [] as string[],
    experience: 'Beginner'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        bio: user.user_metadata?.bio || '',
        location: user.user_metadata?.location || '',
        website: user.user_metadata?.website || '',
        linkedin: user.user_metadata?.linkedin || '',
        twitter: user.user_metadata?.twitter || '',
        github: user.user_metadata?.github || '',
        skills: user.user_metadata?.skills || ['React', 'TypeScript', 'Node.js'],
        interests: user.user_metadata?.interests || ['Startups', 'Tech', 'Innovation'],
        experience: user.user_metadata?.experience || 'Intermediate'
      });
    }
  }, [user]);

  const handleSave = () => {
    // Here you would typically save to Supabase
    console.log('Saving profile data:', profileData);
    setIsEditing(false);
    // TODO: Implement actual save to Supabase user metadata
  };

  const handleSkillAdd = (skill: string) => {
    if (skill && !profileData.skills.includes(skill)) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skill]
      });
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {profileData.displayName.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg border">
                        <Camera className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-center font-medium"
                      />
                      <input
                        type="text"
                        placeholder="@username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-center text-gray-600"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mt-4">
                        {profileData.displayName}
                      </h2>
                      <p className="text-gray-600">@{profileData.username}</p>
                    </>
                  )}
                </div>

                {/* Bio */}
                <div className="mb-6">
                  {isEditing ? (
                    <textarea
                      placeholder="Cuéntanos sobre ti..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 text-center leading-relaxed">
                      {profileData.bio || 'No hay biografía disponible.'}
                    </p>
                  )}
                </div>

                {/* Location & Links */}
                <div className="space-y-3">
                  {/* Location */}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Ubicación"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">
                        {profileData.location || 'Ubicación no especificada'}
                      </span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="url"
                        placeholder="Website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    ) : (
                      profileData.website ? (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {profileData.website}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No website</span>
                      )
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-center space-x-4">
                      <div className="text-center">
                        <Linkedin className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="LinkedIn"
                            value={profileData.linkedin}
                            onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                            className="w-20 px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-gray-600">LinkedIn</p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <Twitter className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Twitter"
                            value={profileData.twitter}
                            onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                            className="w-20 px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-gray-600">Twitter</p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <Github className="h-5 w-5 text-gray-700 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="GitHub"
                            value={profileData.github}
                            onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                            className="w-20 px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-gray-600">GitHub</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="font-semibold">12</span>
                    </div>
                    <p className="text-xs text-gray-600">Colaboraciones</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Briefcase className="h-4 w-4 text-green-500 mr-1" />
                      <span className="font-semibold">3</span>
                    </div>
                    <p className="text-xs text-gray-600">Proyectos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="font-semibold">6</span>
                    </div>
                    <p className="text-xs text-gray-600">Meses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Card */}
            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill, index) => (
                    <div key={index} className="relative group">
                      <Badge variant="secondary" className="pr-6">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => handleSkillRemove(skill)}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    </div>
                  ))}
                  
                  {isEditing && (
                    <button
                      onClick={() => {
                        const skill = prompt('Agregar nueva habilidad:');
                        if (skill) handleSkillAdd(skill);
                      }}
                      className="px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-gray-400"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interests Card */}
            <Card>
              <CardHeader>
                <CardTitle>Intereses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience Level Card */}
            <Card>
              <CardHeader>
                <CardTitle>Nivel de Experiencia</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <select
                    value={profileData.experience}
                    onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Beginner">Principiante</option>
                    <option value="Intermediate">Intermedio</option>
                    <option value="Advanced">Avanzado</option>
                    <option value="Expert">Experto</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: profileData.experience === 'Beginner' ? '25%' :
                                 profileData.experience === 'Intermediate' ? '50%' :
                                 profileData.experience === 'Advanced' ? '75%' : '100%'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {profileData.experience}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Se unió a un nuevo proyecto</p>
                      <p className="text-xs text-gray-500">Hace 2 días</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Actualizó su perfil</p>
                      <p className="text-xs text-gray-500">Hace 1 semana</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Completó una colaboración</p>
                      <p className="text-xs text-gray-500">Hace 2 semanas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
