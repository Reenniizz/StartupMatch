'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, X, Star } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  level: number;
}

interface SkillsSelectorProps {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  onNext: () => void;
}

export default function SkillsSelector({ skills, onSkillsChange, onNext }: SkillsSelectorProps) {
  // Inicializar con 3 campos vacíos si no hay skills
  const [currentSkills, setCurrentSkills] = useState<Skill[]>(
    skills.length > 0 
      ? skills 
      : [
          { id: '1', name: '', level: 5 },
          { id: '2', name: '', level: 5 },
          { id: '3', name: '', level: 5 }
        ]
  );

  const handleAddSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 5
    };
    const updatedSkills = [...currentSkills, newSkill];
    setCurrentSkills(updatedSkills);
    onSkillsChange(updatedSkills);
  };

  const handleRemoveSkill = (id: string) => {
    // No permitir eliminar si solo quedan 3 o menos
    if (currentSkills.length <= 3) return;
    
    const updatedSkills = currentSkills.filter(skill => skill.id !== id);
    setCurrentSkills(updatedSkills);
    onSkillsChange(updatedSkills);
  };

  const handleSkillChange = (id: string, field: 'name' | 'level', value: string | number) => {
    const updatedSkills = currentSkills.map(skill =>
      skill.id === id ? { ...skill, [field]: value } : skill
    );
    setCurrentSkills(updatedSkills);
    onSkillsChange(updatedSkills);
  };

  const handleNext = () => {
    // Filtrar skills que tengan nombre
    const validSkills = currentSkills.filter(skill => skill.name.trim() !== '');
    onSkillsChange(validSkills);
    onNext();
  };

  const renderStars = (level: number, skillId: string) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleSkillChange(skillId, 'level', star)}
            className={`transition-colors ${
              star <= level
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star 
              size={16} 
              fill={star <= level ? 'currentColor' : 'none'}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 min-w-[60px]">
          {level}/10
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          ¿Cuáles son tus habilidades?
        </h2>
        <p className="text-gray-600">
          Agrega tus skills y califica tu nivel de experiencia del 1 al 10
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {currentSkills.map((skill, index) => (
          <Card key={skill.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`skill-${skill.id}`} className="text-sm font-medium">
                  Habilidad {index + 1}
                </Label>
                {currentSkills.length > 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>

              <Input
                id={`skill-${skill.id}`}
                placeholder="Ej: React, Marketing Digital, Liderazgo..."
                value={skill.name}
                onChange={(e) => handleSkillChange(skill.id, 'name', e.target.value)}
                className="w-full"
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Nivel de experiencia</Label>
                {renderStars(skill.level, skill.id)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Botón para agregar más skills */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddSkill}
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Agregar otra habilidad</span>
        </Button>
      </div>

      {/* Información útil */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">💡</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Consejos para mejores matches:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Incluye tanto skills técnicas como blandas</li>
              <li>• Sé honesto con tu nivel de experiencia</li>
              <li>• Agrega skills que te diferencien</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline">
          Atrás
        </Button>
        <Button 
          type="button" 
          onClick={handleNext}
          disabled={currentSkills.filter(s => s.name.trim() !== '').length === 0}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
