import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  MapPin,
  Building,
  Save,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserExperience } from '../types';

interface ExperienceSectionProps {
  experience: UserExperience[];
  isOwnProfile: boolean;
  onAddExperience: (experience: Omit<UserExperience, 'id' | 'user_id' | 'created_at'>) => void;
  onUpdateExperience: (id: string, experience: Partial<UserExperience>) => void;
  onRemoveExperience: (id: string) => void;
  saving: boolean;
}

interface ExperienceFormData {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  location: string;
}

export function ExperienceSection({
  experience,
  isOwnProfile,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  saving
}: ExperienceSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExperienceFormData>({
    company: '',
    position: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    location: ''
  });

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
      location: ''
    });
  };

  const handleAdd = () => {
    if (formData.company.trim() && formData.position.trim() && formData.start_date) {
      onAddExperience({
        ...formData,
        company: formData.company.trim(),
        position: formData.position.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        end_date: formData.is_current ? undefined : formData.end_date || undefined
      });
      resetForm();
      setIsAdding(false);
    }
  };

  const handleEdit = (exp: UserExperience) => {
    setFormData({
      company: exp.company,
      position: exp.position,
      description: exp.description || '',
      start_date: exp.start_date,
      end_date: exp.end_date || '',
      is_current: exp.is_current,
      location: exp.location || ''
    });
    setEditingId(exp.id);
  };

  const handleUpdate = () => {
    if (editingId && formData.company.trim() && formData.position.trim() && formData.start_date) {
      onUpdateExperience(editingId, {
        ...formData,
        company: formData.company.trim(),
        position: formData.position.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        end_date: formData.is_current ? undefined : formData.end_date || undefined
      });
      resetForm();
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (months < 1) return '< 1 mes';
    if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
    return `${years} ${years === 1 ? 'año' : 'años'} ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  };

  const sortedExperience = [...experience].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Experiencia Laboral
          <Badge variant="secondary" className="ml-2">
            {experience.length}
          </Badge>
        </CardTitle>
        
        {isOwnProfile && (
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar experiencia
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Add/Edit Form */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50"
            >
              <div className="space-y-4">
                {/* Company & Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="ej. Google, Startup ABC..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="ej. Frontend Developer, CTO..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="ej. Madrid, España / Remoto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de inicio *
                    </label>
                    <input
                      type="month"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de fin
                    </label>
                    <input
                      type="month"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      disabled={formData.is_current}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={formData.is_current}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_current: e.target.checked, end_date: e.target.checked ? '' : prev.end_date }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Trabajo actual</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe tus responsabilidades, logros y tecnologías utilizadas..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={editingId ? handleUpdate : handleAdd}
                    disabled={!formData.company.trim() || !formData.position.trim() || !formData.start_date || saving}
                    size="sm"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? 'Actualizar' : 'Agregar'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Experience List */}
        {experience.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedExperience.map((exp) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {exp.company.slice(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {exp.position}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{exp.company}</span>
                            {exp.is_current && (
                              <Badge variant="secondary" className="text-xs">
                                Actual
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(exp.start_date)} - {exp.is_current ? 'Presente' : formatDate(exp.end_date!)}
                              </span>
                            </div>
                            
                            <span className="text-gray-400">•</span>
                            
                            <span>{calculateDuration(exp.start_date, exp.end_date)}</span>
                            
                            {exp.location && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{exp.location}</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {exp.description && (
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => handleEdit(exp)}
                          size="sm"
                          variant="outline"
                          className="p-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onRemoveExperience(exp.id)}
                          size="sm"
                          variant="outline"
                          className="p-2 text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            {isOwnProfile ? (
              <div>
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Agrega tu experiencia laboral
                </h3>
                <p className="text-gray-600 mb-4">
                  Muestra tu trayectoria profesional y destaca tus logros
                </p>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar primera experiencia
                </Button>
              </div>
            ) : (
              <div>
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  Este usuario aún no ha agregado su experiencia laboral
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
