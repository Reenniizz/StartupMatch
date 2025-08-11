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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mi Perfil
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-50 hover:border-red-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/70 backdrop-blur-sm border-white/40 shadow-xl">
              <CardContent className="p-6">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg"
                    >
                      {profileData.displayName.charAt(0).toUpperCase() || 'U'}
                    </motion.div>
                    {isEditing && (
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg border hover:bg-blue-50"
                      >
                        <Camera className="h-4 w-4 text-blue-600" />
                      </motion.button>
                    )}
                    
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-4 left-24 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-center font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        type="text"
                        placeholder="@username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg text-center text-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mt-4">
                        {profileData.displayName}
                      </h2>
                      <p className="text-blue-600 font-medium">@{profileData.username}</p>
                      <div className="flex items-center justify-center mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          En línea
                        </span>
                      </div>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  ) : (
                    <p className="text-gray-700 text-center leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {profileData.bio || 'No hay biografía disponible. ¡Agrega algo sobre ti!'}
                    </p>
                  )}
                </div>

                {/* Location & Links */}
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Ubicación"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="flex-1 px-2 py-1 border-2 border-blue-200 rounded focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {profileData.location || 'Ubicación no especificada'}
                      </span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                    {isEditing ? (
                      <input
                        type="url"
                        placeholder="Website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                        className="flex-1 px-2 py-1 border-2 border-purple-200 rounded focus:border-purple-500"
                      />
                    ) : (
                      profileData.website ? (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 font-medium hover:underline">
                          {profileData.website}
                        </a>
                      ) : (
                        <span className="text-gray-500">No website</span>
                      )
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-center text-gray-600 text-sm mb-3">Redes Sociales</p>
                    <div className="grid grid-cols-3 gap-2">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-blue-50 rounded-lg"
                      >
                        <Linkedin className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="LinkedIn"
                            value={profileData.linkedin}
                            onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                            className="w-full px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-blue-600 font-medium">LinkedIn</p>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-sky-50 rounded-lg"
                      >
                        <Twitter className="h-6 w-6 text-sky-500 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Twitter"
                            value={profileData.twitter}
                            onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                            className="w-full px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-sky-600 font-medium">Twitter</p>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-gray-50 rounded-lg"
                      >
                        <Github className="h-6 w-6 text-gray-700 mx-auto mb-1" />
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="GitHub"
                            value={profileData.github}
                            onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                            className="w-full px-1 py-1 border rounded text-xs text-center"
                          />
                        ) : (
                          <p className="text-xs text-gray-700 font-medium">GitHub</p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mt-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Star className="mr-2 h-5 w-5 text-yellow-300" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-5 w-5 text-yellow-300 mr-1" />
                        <span className="font-bold text-xl">4.9</span>
                      </div>
                      <p className="text-sm text-blue-100">Rating</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-blue-300 mr-1" />
                        <span className="font-bold text-xl">24</span>
                      </div>
                      <p className="text-sm text-blue-100">Conexiones</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Briefcase className="h-5 w-5 text-green-300 mr-1" />
                        <span className="font-bold text-xl">8</span>
                      </div>
                      <p className="text-sm text-blue-100">Proyectos</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Calendar className="h-5 w-5 text-purple-300 mr-1" />
                        <span className="font-bold text-xl">12</span>
                      </div>
                      <p className="text-sm text-blue-100">Meses activo</p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

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
