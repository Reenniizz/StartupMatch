"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  Code,
  Palette,
  TrendingUp,
  Globe,
  Calendar,
  MapPin
} from 'lucide-react';

// Interfaces
interface FormData {
  email: string;
  cofounderType: 'technical' | 'business' | 'design' | '';
  skills: string[];
  location: string;
  availability: 'part-time' | 'full-time' | 'flexible' | '';
}

interface PotentialMatch {
  id: string;
  name: string;
  role: string;
  skills: string[];
  location: string;
  avatar: string;
  matchScore: number;
}

const cofounderTypes = [
  {
    id: 'technical' as const,
    label: 'Co-fundador Técnico',
    description: 'CTO, Desarrollador, Ingeniero',
    icon: Code,
    color: 'blue'
  },
  {
    id: 'business' as const,
    label: 'Co-fundador de Negocio',
    description: 'CEO, CMO, Estrategia',
    icon: TrendingUp,
    color: 'green'
  },
  {
    id: 'design' as const,
    label: 'Co-fundador de Diseño',
    description: 'CPO, UX/UI, Producto',
    icon: Palette,
    color: 'purple'
  }
];

const skillsOptions = [
  'React/Next.js', 'Node.js', 'Python', 'AI/ML', 'Blockchain',
  'Marketing Digital', 'Ventas', 'Finanzas', 'Legal', 'Operaciones',
  'UX/UI Design', 'Product Management', 'Data Science', 'DevOps'
];

const availabilityOptions = [
  { value: 'part-time', label: 'Medio Tiempo (20h/semana)' },
  { value: 'full-time', label: 'Tiempo Completo (40h+/semana)' },
  { value: 'flexible', label: 'Flexible según proyecto' }
];

// Mock data for matches
const mockMatches: PotentialMatch[] = [
  {
    id: '1',
    name: 'Ana García',
    role: 'Full-Stack Developer',
    skills: ['React', 'Node.js', 'Python'],
    location: 'Madrid, España',
    avatar: '/avatars/ana.jpg',
    matchScore: 95
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    role: 'Marketing Director',
    skills: ['Marketing Digital', 'Growth Hacking'],
    location: 'Barcelona, España',
    avatar: '/avatars/carlos.jpg',
    matchScore: 88
  }
];

export default function GetStarted() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [potentialMatches] = useState<PotentialMatch[]>(mockMatches);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      cofounderType: '',
      skills: [],
      location: '',
      availability: ''
    }
  });

  const watchedFields = watch();
  const totalSteps = 3;
  const formProgress = ((currentStep + 1) / totalSteps) * 100;

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted:", data);
    setIsSubmitted(true);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return watchedFields.email && watchedFields.cofounderType;
      case 1:
        return watchedFields.skills && watchedFields.skills.length > 0;
      case 2:
        return watchedFields.location && watchedFields.availability;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Success screen
  if (isSubmitted) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Perfecto! 🚀
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Hemos encontrado {potentialMatches.length} matches increíbles para ti. 
              ¡Prepárate para conectar!
            </p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors inline-flex items-center">
              Ver mis {potentialMatches.length} matches
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="get-started" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column - Form */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              {/* Progress Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Paso {currentStep + 1} de {totalSteps}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {Math.round(formProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${formProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <AnimatePresence mode="wait">
                  
                  {/* Step 1: Email + Cofounder Type */}
                  {currentStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          ¡Empecemos! 🚀
                        </h3>
                        <p className="text-gray-600">
                          Cuéntanos tu email y qué tipo de co-fundador buscas
                        </p>
                      </div>

                      {/* Email Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          {...register('email', { 
                            required: 'Email es requerido',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Email inválido'
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="tu@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      {/* Cofounder Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          ¿Qué tipo de co-fundador eres?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {cofounderTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = watchedFields.cofounderType === type.id;
                            
                            return (
                              <label key={type.id} className="cursor-pointer">
                                <input
                                  type="radio"
                                  {...register('cofounderType', { required: 'Selecciona un tipo' })}
                                  value={type.id}
                                  className="sr-only"
                                />
                                <div className={`
                                  border-2 rounded-xl p-4 text-center transition-all
                                  ${isSelected 
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                  }
                                `}>
                                  <Icon className={`
                                    w-8 h-8 mx-auto mb-2
                                    ${isSelected ? 'text-blue-500' : 'text-gray-400'}
                                  `} />
                                  <div className="text-sm font-medium text-gray-900 mb-1">
                                    {type.label}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {type.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        {errors.cofounderType && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.cofounderType.message}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Skills */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          ¡Genial! 💪
                        </h3>
                        <p className="text-gray-600">
                          Selecciona tus principales habilidades
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Habilidades (máximo 5)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {skillsOptions.map((skill) => {
                            const isSelected = watchedFields.skills?.includes(skill);
                            const canSelect = !isSelected && (watchedFields.skills?.length || 0) < 5;
                            
                            return (
                              <label
                                key={skill}
                                className={`cursor-pointer ${!canSelect && !isSelected ? 'opacity-50' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  {...register('skills', { 
                                    required: 'Selecciona al menos una habilidad',
                                    validate: (value) => value.length <= 5 || 'Máximo 5 habilidades'
                                  })}
                                  value={skill}
                                  className="sr-only"
                                  disabled={!canSelect && !isSelected}
                                />
                                <div className={`
                                  px-3 py-2 rounded-lg text-center text-sm transition-all
                                  ${isSelected 
                                    ? 'bg-blue-500 text-white border-2 border-blue-500' 
                                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-blue-300'
                                  }
                                  ${!canSelect && !isSelected ? 'cursor-not-allowed' : ''}
                                `}>
                                  {skill}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        {errors.skills && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.skills.message}
                          </p>
                        )}
                        {watchedFields.skills && watchedFields.skills.length > 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            {watchedFields.skills.length}/5 habilidades seleccionadas
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Location + Availability */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          ¡Último paso! 🎯
                        </h3>
                        <p className="text-gray-600">
                          Tu ubicación y disponibilidad
                        </p>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="inline w-4 h-4 mr-1" />
                          Ubicación
                        </label>
                        <input
                          type="text"
                          {...register('location', { required: 'Ubicación es requerida' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Madrid, España"
                        />
                        {errors.location && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.location.message}
                          </p>
                        )}
                      </div>

                      {/* Availability */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          Disponibilidad
                        </label>
                        <div className="space-y-2">
                          {availabilityOptions.map((option) => {
                            const isSelected = watchedFields.availability === option.value;
                            
                            return (
                              <label key={option.value} className="cursor-pointer">
                                <input
                                  type="radio"
                                  {...register('availability', { required: 'Selecciona tu disponibilidad' })}
                                  value={option.value}
                                  className="sr-only"
                                />
                                <div className={`
                                  border-2 rounded-xl p-4 transition-all
                                  ${isSelected 
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                  }
                                `}>
                                  <div className="text-base font-medium text-gray-900">
                                    {option.label}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        {errors.availability && (
                          <p className="text-red-500 text-sm mt-2">
                            {errors.availability.message}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`
                      px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center
                      ${currentStep === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Anterior
                  </button>

                  {currentStep < totalSteps - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className={`
                        px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center
                        ${!canProceed()
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        }
                      `}
                    >
                      Siguiente
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canProceed()}
                      className={`
                        px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center
                        ${!canProceed()
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                        }
                      `}
                    >
                      ¡Encontrar Matches!
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right Column - Match Preview */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-8"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  Vista Previa de Matches
                </h4>

                {watchedFields.email && watchedFields.cofounderType ? (
                  <div className="space-y-4">
                    {potentialMatches.slice(0, 2).map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-lg">
                              {match.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {match.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {match.role}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                {match.matchScore}% match
                              </span>
                              <span className="text-xs text-gray-400">
                                {match.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-700">
                        +{Math.floor(Math.random() * 50) + 20} más matches esperándote
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-base text-gray-500 mb-2">
                      Completa el formulario para ver tus matches
                    </p>
                    <p className="text-sm text-gray-400">
                      ¡Te mostraremos co-fundadores perfectos para ti!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
