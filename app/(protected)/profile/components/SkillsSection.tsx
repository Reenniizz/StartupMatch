import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Star, 
  Edit3, 
  Save,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserSkill, SkillLevel } from '../types';

interface SkillsSectionProps {
  skills: UserSkill[];
  isOwnProfile: boolean;
  onAddSkill: (skill: string, level: SkillLevel) => void;
  onRemoveSkill: (skillId: string) => void;
  saving: boolean;
}

export function SkillsSection({
  skills,
  isOwnProfile,
  onAddSkill,
  onRemoveSkill,
  saving
}: SkillsSectionProps) {
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.find(s => s.skill.toLowerCase() === newSkill.toLowerCase())) {
      onAddSkill(newSkill.trim(), newSkillLevel);
      setNewSkill('');
      setNewSkillLevel('intermediate');
      setIsAddingSkill(false);
    }
  };

  const skillLevelColors: Record<SkillLevel, string> = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-blue-100 text-blue-800 border-blue-200',
    advanced: 'bg-purple-100 text-purple-800 border-purple-200',
    expert: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const skillLevelLabels: Record<SkillLevel, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto'
  };

  const skillLevelIcons: Record<SkillLevel, typeof Star> = {
    beginner: TrendingUp,
    intermediate: Star,
    advanced: Award,
    expert: Award
  };

  const getSkillsByLevel = (level: SkillLevel) => {
    return skills.filter(skill => skill.level === level);
  };

  const skillLevels: SkillLevel[] = ['expert', 'advanced', 'intermediate', 'beginner'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Habilidades
          <Badge variant="secondary" className="ml-2">
            {skills.length}
          </Badge>
        </CardTitle>
        
        {isOwnProfile && (
          <Button
            onClick={() => setIsAddingSkill(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar habilidad
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Add Skill Form */}
        <AnimatePresence>
          {isAddingSkill && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la habilidad
                  </label>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="ej. React, Python, Diseño UX..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de experiencia
                  </label>
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">Principiante - Conocimientos básicos</option>
                    <option value="intermediate">Intermedio - Experiencia práctica</option>
                    <option value="advanced">Avanzado - Experiencia sólida</option>
                    <option value="expert">Experto - Dominio completo</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim() || saving}
                    size="sm"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Agregar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingSkill(false);
                      setNewSkill('');
                      setNewSkillLevel('intermediate');
                    }}
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

        {/* Skills by Level */}
        {skills.length > 0 ? (
          <div className="space-y-6">
            {skillLevels.map(level => {
              const skillsAtLevel = getSkillsByLevel(level);
              if (skillsAtLevel.length === 0) return null;

              const Icon = skillLevelIcons[level];

              return (
                <div key={level}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      {skillLevelLabels[level]}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {skillsAtLevel.length}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {skillsAtLevel.map((skill) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="group"
                        >
                          <div className={`
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border
                            ${skillLevelColors[skill.level]}
                            ${isOwnProfile ? 'pr-1' : ''}
                          `}>
                            <span>{skill.skill}</span>
                            
                            {skill.years_experience && (
                              <span className="text-xs opacity-75">
                                {skill.years_experience} años
                              </span>
                            )}
                            
                            {isOwnProfile && (
                              <button
                                onClick={() => onRemoveSkill(skill.id)}
                                className="ml-1 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar habilidad"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            {isOwnProfile ? (
              <div>
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Agrega tus habilidades
                </h3>
                <p className="text-gray-600 mb-4">
                  Muestra tus conocimientos técnicos y profesionales
                </p>
                <Button 
                  onClick={() => setIsAddingSkill(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar primera habilidad
                </Button>
              </div>
            ) : (
              <div>
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  Este usuario aún no ha agregado sus habilidades
                </p>
              </div>
            )}
          </div>
        )}

        {/* Skills Summary */}
        {skills.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-900">{getSkillsByLevel('expert').length + getSkillsByLevel('advanced').length}</strong> habilidades avanzadas
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-900">{skills.length}</strong> total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Skill Warning */}
        {isAddingSkill && newSkill.trim() && skills.find(s => s.skill.toLowerCase() === newSkill.toLowerCase()) && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ya tienes esta habilidad en tu perfil. Intenta con una diferente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
