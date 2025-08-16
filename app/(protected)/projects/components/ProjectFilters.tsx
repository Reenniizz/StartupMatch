import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Filter,
  MapPin,
  Code,
  Star,
  Clock,
  Building2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Palette,
  BarChart3,
  Megaphone,
  ShoppingCart,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ProjectFilters as FilterType,
  DifficultyLevel,
  CommitmentLevel,
  ProjectCategory
} from '../types';

interface ProjectFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  onClearFilters: () => void;
  resultCount: number;
}

export function ProjectFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  resultCount
}: ProjectFiltersProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['categories', 'location', 'skills'])
  );

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const handleLocationChange = (location: string) => {
    onFiltersChange({
      ...filters,
      location: location === filters.location ? '' : location
    });
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    
    onFiltersChange({
      ...filters,
      skills: newSkills
    });
  };

  const handleCategoryToggle = (category: ProjectCategory) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleDifficultyToggle = (difficulty: DifficultyLevel) => {
    const currentLevels = filters.difficulty_level || [];
    const newLevels = currentLevels.includes(difficulty)
      ? currentLevels.filter(d => d !== difficulty)
      : [...currentLevels, difficulty];
    
    onFiltersChange({
      ...filters,
      difficulty_level: newLevels
    });
  };

  const handleCommitmentToggle = (commitment: CommitmentLevel) => {
    const currentLevels = filters.commitment_level || [];
    const newLevels = currentLevels.includes(commitment)
      ? currentLevels.filter(c => c !== commitment)
      : [...currentLevels, commitment];
    
    onFiltersChange({
      ...filters,
      commitment_level: newLevels
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.location && filters.location.trim()) count++;
    if (filters.skills?.length) count += filters.skills.length;
    if (filters.difficulty_level?.length) count += filters.difficulty_level.length;
    if (filters.commitment_level?.length) count += filters.commitment_level.length;
    if (filters.remote_only) count++;
    if (filters.is_paid) count++;
    if (filters.has_equity) count++;
    if (filters.is_featured) count++;
    if (filters.budget_range && filters.budget_range.trim()) count++;
    if (filters.timeline && filters.timeline.trim()) count++;
    return count;
  };

  const commonLocations = [
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 
    'Málaga', 'Zaragoza', 'Murcia', 'Palma', 'Las Palmas',
    'Remoto', 'Híbrido'
  ];

  const commonSkills = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
    'Java', 'PHP', 'Go', 'Rust', 'Swift', 'Flutter', 'Django',
    'Laravel', 'Vue.js', 'Angular', 'Next.js', 'Express.js',
    'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Docker',
    'AWS', 'Azure', 'GCP', 'Kubernetes', 'DevOps',
    'UI/UX Design', 'Figma', 'Photoshop', 'Marketing Digital',
    'SEO', 'Analytics', 'Product Management', 'Scrum', 'Agile'
  ];

  const categoryOptions: { value: ProjectCategory; label: string; icon: any }[] = [
    { value: 'web_development', label: 'Desarrollo Web', icon: Code },
    { value: 'mobile_development', label: 'Aplicaciones Móviles', icon: Briefcase },
    { value: 'ai_ml', label: 'IA y ML', icon: Palette },
    { value: 'blockchain', label: 'Blockchain', icon: Megaphone },
    { value: 'e_commerce', label: 'E-commerce', icon: ShoppingCart },
    { value: 'fintech', label: 'Fintech', icon: Shield },
    { value: 'health_tech', label: 'Health Tech', icon: Building2 },
    { value: 'other', label: 'Otros', icon: BarChart3 }
  ];

  const difficultyOptions: { value: DifficultyLevel; label: string; color: string }[] = [
    { value: 'beginner', label: 'Principiante', color: 'text-green-600' },
    { value: 'intermediate', label: 'Intermedio', color: 'text-blue-600' },
    { value: 'advanced', label: 'Avanzado', color: 'text-orange-600' },
    { value: 'expert', label: 'Experto', color: 'text-red-600' }
  ];

  const commitmentOptions: { value: CommitmentLevel; label: string }[] = [
    { value: 'low', label: 'Bajo (1-10h/semana)' },
    { value: 'medium', label: 'Medio (10-20h/semana)' },
    { value: 'high', label: 'Alto (20-40h/semana)' },
    { value: 'full_time', label: 'Tiempo Completo (40+h/semana)' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Filtros
                </h2>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, remote_only: !filters.remote_only })}
                  className={filters.remote_only ? 'bg-blue-50 border-blue-200' : ''}
                >
                  Remoto
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, is_paid: !filters.is_paid })}
                  className={filters.is_paid ? 'bg-green-50 border-green-200' : ''}
                >
                  Pagado
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, has_equity: !filters.has_equity })}
                  className={filters.has_equity ? 'bg-purple-50 border-purple-200' : ''}
                >
                  Con Equity
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, is_featured: !filters.is_featured })}
                  className={filters.is_featured ? 'bg-yellow-50 border-yellow-200' : ''}
                >
                  Destacados
                </Button>
              </div>

              {/* Category Filter */}
              <Collapsible
                open={openSections.has('categories')}
                onOpenChange={() => toggleSection('categories')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Categorías</span>
                  </div>
                  {openSections.has('categories') ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  {categoryOptions.map((category) => (
                    <div key={category.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.value}
                        checked={filters.categories?.includes(category.value) || false}
                        onCheckedChange={() => handleCategoryToggle(category.value)}
                      />
                      <Label htmlFor={category.value} className="text-sm flex items-center gap-2 cursor-pointer">
                        <category.icon className="w-3 h-3" />
                        {category.label}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Location Filter */}
              <Collapsible
                open={openSections.has('location')}
                onOpenChange={() => toggleSection('location')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Ubicación</span>
                  </div>
                  {openSections.has('location') ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  <Input
                    placeholder="Buscar ubicación..."
                    value={filters.location}
                    onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {commonLocations.map((location) => (
                      <Button
                        key={location}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLocationChange(location)}
                        className={filters.location === location ? 'bg-blue-50 border-blue-200' : ''}
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Skills Filter */}
              <Collapsible
                open={openSections.has('skills')}
                onOpenChange={() => toggleSection('skills')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Habilidades</span>
                  </div>
                  {openSections.has('skills') ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-1">
                    {commonSkills.slice(0, 20).map((skill) => (
                      <Button
                        key={skill}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkillToggle(skill)}
                        className={filters.skills?.includes(skill) ? 'bg-green-50 border-green-200' : ''}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Difficulty Filter */}
              <Collapsible
                open={openSections.has('difficulty')}
                onOpenChange={() => toggleSection('difficulty')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Dificultad</span>
                  </div>
                  {openSections.has('difficulty') ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  {difficultyOptions.map((difficulty) => (
                    <div key={difficulty.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`difficulty-${difficulty.value}`}
                        checked={filters.difficulty_level?.includes(difficulty.value) || false}
                        onCheckedChange={() => handleDifficultyToggle(difficulty.value)}
                      />
                      <Label htmlFor={`difficulty-${difficulty.value}`} className={`text-sm cursor-pointer ${difficulty.color}`}>
                        {difficulty.label}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Commitment Filter */}
              <Collapsible
                open={openSections.has('commitment')}
                onOpenChange={() => toggleSection('commitment')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Compromiso</span>
                  </div>
                  {openSections.has('commitment') ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  {commitmentOptions.map((commitment) => (
                    <div key={commitment.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`commitment-${commitment.value}`}
                        checked={filters.commitment_level?.includes(commitment.value) || false}
                        onCheckedChange={() => handleCommitmentToggle(commitment.value)}
                      />
                      <Label htmlFor={`commitment-${commitment.value}`} className="text-sm cursor-pointer">
                        {commitment.label}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  {resultCount} proyectos encontrados
                </span>
                
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
              
              <Button
                onClick={onClose}
                className="w-full"
              >
                Aplicar Filtros
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
