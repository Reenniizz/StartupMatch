'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { motion } from 'framer-motion';
import { 
  MapPin,
  Mail,
  Edit3,
  Check,
  X,
  Users,
  Building,
  Calendar,
  Briefcase,
  Star,
  Eye,
  Target,
  Code,
  Palette,
  Database,
  BarChart3,
  Trophy,
  Award,
  BookOpen,
  Link,
  Phone,
  Linkedin,
  Github,
  Globe,
  Clock,
  GraduationCap,
  User,
  Settings,
  FileText,
  Contact,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  role: string;
  location: string;
  company: string;
  joined: string;
  skills: string[];
  stats: {
    projects: number;
    connections: number;
    rating: number;
    views: number;
  };
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
  }[];
  contact: {
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  achievements: {
    title: string;
    description: string;
    year: string;
  }[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'experience', label: 'Experiencia', icon: Briefcase },
    { id: 'education', label: 'Educación', icon: GraduationCap },
    { id: 'skills', label: 'Habilidades', icon: Code },
    { id: 'achievements', label: 'Logros', icon: Trophy },
    { id: 'contact', label: 'Contacto', icon: Contact }
  ];

  useEffect(() => {
    const mockProfile: UserProfile = {
      id: user?.id || 'user-1',
      name: 'Ana García Rodríguez',
      email: 'ana.garcia@gmail.com',
      bio: 'Senior Product Manager especializada en tecnología fintech y startups. Apasionada por crear productos que transformen la experiencia del usuario y generen impacto real en el mercado.',
      role: 'Senior Product Manager',
      location: 'Madrid, España',
      company: 'TechStartup Inc.',
      joined: '2019-03-15',
      skills: [
        'Product Strategy', 'Design Thinking', 'React', 'Analytics', 
        'Scrum', 'Figma', 'SQL', 'A/B Testing', 'User Research', 'Leadership',
        'Python', 'Machine Learning', 'Data Analysis', 'Prototyping'
      ],
      stats: {
        projects: 28,
        connections: 847,
        rating: 4.9,
        views: 2847
      },
      experience: [
        {
          company: 'TechStartup Inc.',
          role: 'Senior Product Manager',
          period: '2022 - Presente',
          description: 'Lidero el desarrollo de productos fintech, gestionando equipos multidisciplinarios y definiendo estrategias de producto.'
        },
        {
          company: 'Innovation Labs',
          role: 'Product Manager',
          period: '2019 - 2022',
          description: 'Desarrollé productos digitales desde la conceptualización hasta el lanzamiento, aumentando la retención de usuarios en un 40%.'
        },
        {
          company: 'Digital Solutions',
          role: 'UX/Product Designer',
          period: '2017 - 2019',
          description: 'Diseñé experiencias de usuario centradas en datos, colaborando estrechamente con equipos de desarrollo.'
        }
      ],
      education: [
        {
          institution: 'IE Business School',
          degree: 'MBA en Gestión de la Innovación',
          period: '2016 - 2017'
        },
        {
          institution: 'Universidad Politécnica de Madrid',
          degree: 'Ingeniería Informática',
          period: '2012 - 2016'
        }
      ],
      contact: {
        phone: '+34 600 123 456',
        linkedin: 'ana-garcia-pm',
        github: 'ana-garcia-dev',
        website: 'www.anagarcia.dev'
      },
      achievements: [
        {
          title: 'Product Manager del Año',
          description: 'Reconocimiento por excelencia en gestión de productos digitales',
          year: '2023'
        },
        {
          title: 'Startup Accelerator Graduate',
          description: 'Graduada del programa de aceleración de IE Venture Lab',
          year: '2021'
        },
        {
          title: 'Best UX Design Award',
          description: 'Premio al mejor diseño de experiencia de usuario en FinTech Awards',
          year: '2020'
        }
      ]
    };

    setTimeout(() => {
      setProfile(mockProfile);
      setLoading(false);
    }, 800);
  }, [user]);

  // Funciones de edición
  const handleEditSection = (section: string) => {
    setEditingSection(section);
    setTempProfile({ ...profile! });
  };

  const handleSaveSection = async () => {
    if (!tempProfile) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(tempProfile);
    setEditingSection(null);
    setTempProfile(null);
    setIsSaving(false);
    
    toast({
      title: "Perfil actualizado",
      description: "Los cambios se han guardado correctamente.",
    });
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setTempProfile(null);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !tempProfile) return;
    
    const updatedProfile = {
      ...tempProfile,
      skills: [...tempProfile.skills, newSkill.trim()]
    };
    setTempProfile(updatedProfile);
    setNewSkill('');
  };

  const handleRemoveSkill = (index: number) => {
    if (!tempProfile) return;
    
    const updatedProfile = {
      ...tempProfile,
      skills: tempProfile.skills.filter((_, i) => i !== index)
    };
    setTempProfile(updatedProfile);
  };

  const updateTempProfile = (field: string, value: any) => {
    if (!tempProfile) return;
    
    const keys = field.split('.');
    const newProfile = { ...tempProfile };
    let current: any = newProfile;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setTempProfile(newProfile);
  };

  const renderTabContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sobre mí</h3>
                {editingSection !== 'bio' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSection('bio')}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              
              {editingSection === 'bio' ? (
                <div className="space-y-4">
                  <Textarea
                    value={tempProfile?.bio || ''}
                    onChange={(e) => updateTempProfile('bio', e.target.value)}
                    placeholder="Escribe sobre ti..."
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSection}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              )}
            </motion.div>

            {/* Statistics Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Card className="p-4 text-center border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{profile.stats.projects}</div>
                <div className="text-sm text-gray-600">Proyectos</div>
              </Card>
              <Card className="p-4 text-center border-0 bg-gradient-to-br from-green-50 to-green-100">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{profile.stats.connections}</div>
                <div className="text-sm text-gray-600">Conexiones</div>
              </Card>
              <Card className="p-4 text-center border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{profile.stats.rating}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </Card>
              <Card className="p-4 text-center border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{profile.stats.views.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Vistas</div>
              </Card>
            </motion.div>
          </div>
        );

      case 'experience':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Experiencia Laboral</h3>
            <div className="space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-6 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{exp.role}</h4>
                      <p className="text-blue-600 font-medium">{exp.company}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Clock className="h-3 w-3 mr-1" />
                      {exp.period}
                    </Badge>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'education':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Educación</h3>
            <div className="space-y-4">
              {profile.education.map((edu, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-indigo-600 font-medium">{edu.institution}</p>
                    <p className="text-sm text-gray-600">{edu.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'skills':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Habilidades</h3>
              {editingSection !== 'skills' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSection('skills')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>

            {editingSection === 'skills' ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Agregar nueva habilidad..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Agregar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {tempProfile?.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-2 group"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSection}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 'achievements':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Logros y Reconocimientos</h3>
            <div className="grid gap-4">
              {profile.achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        {achievement.year}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'contact':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
              {editingSection !== 'contact' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSection('contact')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>

            {editingSection === 'contact' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={tempProfile?.contact.phone || ''}
                      onChange={(e) => updateTempProfile('contact.phone', e.target.value)}
                      placeholder="+34 600 123 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={tempProfile?.email || ''}
                      onChange={(e) => updateTempProfile('email', e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={tempProfile?.contact.linkedin || ''}
                      onChange={(e) => updateTempProfile('contact.linkedin', e.target.value)}
                      placeholder="tu-perfil-linkedin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={tempProfile?.contact.github || ''}
                      onChange={(e) => updateTempProfile('contact.github', e.target.value)}
                      placeholder="tu-usuario-github"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={tempProfile?.contact.website || ''}
                      onChange={(e) => updateTempProfile('contact.website', e.target.value)}
                      placeholder="www.tusitio.com"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveSection}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.contact.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">{profile.contact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
                {profile.contact.linkedin && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-700">linkedin.com/in/{profile.contact.linkedin}</span>
                  </div>
                )}
                {profile.contact.github && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Github className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">github.com/{profile.contact.github}</span>
                  </div>
                )}
                {profile.contact.website && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="text-green-700">{profile.contact.website}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Perfil no encontrado
          </h3>
          <p className="text-gray-600">
            No se pudo cargar la información del perfil
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Compacto */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src="/api/placeholder/80/80" alt={profile.name} />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Info Compacta */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h1>
              <p className="text-lg text-blue-600 font-semibold mb-2">{profile.role}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{profile.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="rounded-lg"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Seguir
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
}
