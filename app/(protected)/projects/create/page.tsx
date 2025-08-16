/**
 * Create Project Page - Refactored Clean Architecture
 * Uses step-by-step wizard with proper validation and file management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/shared/FileUpload';
import RichTextEditor from '@/components/RichTextEditor';
import { ArrowLeft, ArrowRight, Save, Upload, Eye, CheckCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { projectStorageService, ProjectFile } from '@/lib/project-storage';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface ProjectFormData {
  // Paso 1: Información Básica
  title: string;
  tagline: string;
  category: string;
  subcategories: string[];
  status: string;
  project_type: string;
  location: string;
  
  // Paso 2: Contenido Visual (manejado por Storage)
  logo?: ProjectFile;
  images: ProjectFile[];
  video_url?: string;
  presentation?: ProjectFile;
  
  // Paso 3: Descripción Detallada
  description: string;
  problem: string;
  solution: string;
  value_proposition: string;
  target_market: string;
  business_model: string;
  competition: string;
  future_vision: string;
  
  // Paso 4: Objetivos y Necesidades
  looking_for: string[];
  needed_roles: { role: string; description: string; skills: string[]; experience: string }[];
  collaboration_type: string[];
  preferred_location: string;
  time_commitment: string;
  
  // Paso 5: Aspectos Financieros
  seeking_investment: boolean;
  funding_amount?: number;
  investment_type?: string;
  current_revenue?: number;
  traction_metrics: string;
  estimated_valuation?: number;
  
  // Paso 6: Información Técnica
  tech_stack: string[];
  repository_url?: string;
  demo_url?: string;
  documentation_url?: string;
  apis_used: string[];
  infrastructure: string;
  
  // Paso 7: Configuración de Privacidad
  visibility: string;
  allow_applications: boolean;
  selection_process: string;
  nda_required: boolean;
  contact_info_visible: boolean;
}

const STEPS = [
  { id: 1, title: 'Información Básica', icon: '📋' },
  { id: 2, title: 'Contenido Visual', icon: '📸' },
  { id: 3, title: 'Descripción Detallada', icon: '📖' },
  { id: 4, title: 'Objetivos y Necesidades', icon: '🎯' },
  { id: 5, title: 'Aspectos Financieros', icon: '💰' },
  { id: 6, title: 'Información Técnica', icon: '⚙️' },
  { id: 7, title: 'Configuración', icon: '🔒' },
];

const CATEGORIES = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'AI/ML', 
  'Blockchain', 'IoT', 'Gaming', 'Social Media', 'Marketplace', 'Otro'
];

const PROJECT_STATUSES = [
  { value: 'idea', label: '💡 Idea' },
  { value: 'mvp', label: '🔧 MVP' },
  { value: 'beta', label: '🧪 Beta' },
  { value: 'production', label: '🚀 Producción' },
  { value: 'scaling', label: '📈 Escalando' }
];

const PROJECT_TYPES = [
  { value: 'startup', label: '🚀 Startup' },
  { value: 'side_project', label: '🛠️ Proyecto Personal' },
  { value: 'open_source', label: '🌐 Open Source' },
  { value: 'research', label: '🔬 Investigación' }
];

export default function CreateProjectPage() {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    tagline: '',
    category: '',
    subcategories: [],
    status: 'idea',
    project_type: 'startup',
    location: 'remote',
    images: [],
    description: '',
    problem: '',
    solution: '',
    value_proposition: '',
    target_market: '',
    business_model: '',
    competition: '',
    future_vision: '',
    looking_for: [],
    needed_roles: [],
    collaboration_type: [],
    preferred_location: 'remote',
    time_commitment: 'part_time',
    seeking_investment: false,
    tech_stack: [],
    apis_used: [],
    infrastructure: 'cloud',
    visibility: 'public',
    allow_applications: true,
    selection_process: 'manual',
    nda_required: false,
    contact_info_visible: true,
    traction_metrics: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Crear proyecto temporal al iniciar
  useEffect(() => {
    createDraftProject();
  }, []);

  const createDraftProject = async () => {
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user) {
        router.push('/login');
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: 'Proyecto Sin Título - Borrador',
          description: 'Proyecto en proceso de creación',
          creator_id: sessionData.session.user.id,
          industry: 'Tecnología',
          category: 'Otro',
          status: 'draft',
          visibility: 'private',
          metadata: {
            isDraft: true,
            created: new Date().toISOString(),
            step: 1
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      setProjectId(project.id);
    } catch (error) {
      console.error('Error creating draft project:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addNeededRole = () => {
    setFormData(prev => ({
      ...prev,
      needed_roles: [...prev.needed_roles, {
        role: '',
        description: '',
        skills: [],
        experience: 'mid'
      }]
    }));
  };

  const updateNeededRole = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      needed_roles: prev.needed_roles.map((role, i) => 
        i === index ? { ...role, [field]: value } : role
      )
    }));
  };

  const removeNeededRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      needed_roles: prev.needed_roles.filter((_, i) => i !== index)
    }));
  };

  const handleFileUploadComplete = (file: ProjectFile) => {
    if (file.file_name.toLowerCase().includes('logo') || file.mime_type.startsWith('image/')) {
      if (formData.logo) {
        // Si ya hay un logo, agregarlo a la galería
        updateFormData('images', [...formData.images, file]);
      } else {
        // Si no hay logo, usar como logo si es la primera imagen
        updateFormData('logo', file);
      }
    } else if (file.mime_type === 'application/pdf') {
      updateFormData('presentation', file);
    } else {
      // Otros archivos van a la galería
      updateFormData('images', [...formData.images, file]);
    }
  };

  const handleFileUploadError = (error: string) => {
    console.error('Upload error:', error);
    // TODO: Show toast notification
  };

  const removeImage = async (fileId: string) => {
    try {
      await projectStorageService.deleteFile(fileId);
      updateFormData('images', formData.images.filter(img => img.id !== fileId));
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
        if (formData.title.length > 60) newErrors.title = 'El título no puede exceder 60 caracteres';
        if (!formData.tagline.trim()) newErrors.tagline = 'El tagline es obligatorio';
        if (!formData.category) newErrors.category = 'La categoría es obligatoria';
        break;
        
      case 3:
        if (!formData.description.trim()) newErrors.description = 'La descripción es obligatoria';
        if (!formData.problem.trim()) newErrors.problem = 'Describe el problema que resuelves';
        if (!formData.solution.trim()) newErrors.solution = 'Describe tu solución';
        break;
        
      case 4:
        if (formData.looking_for.length === 0) newErrors.looking_for = 'Indica qué buscas';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraft = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      const updateData = {
        title: formData.title || 'Proyecto Sin Título - Borrador',
        tagline: formData.tagline,
        description: formData.description || 'Proyecto en proceso de creación',
        category: formData.category || 'Otro',
        industry: formData.category || 'Tecnología',
        status: 'draft',
        visibility: 'private',
        
        // Almacenar progreso en metadata
        metadata: {
          formData: formData,
          step: currentStep,
          lastUpdated: new Date().toISOString(),
          isDraft: true
        }
      };

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;
      
      setSavedAsDraft(true);
      setTimeout(() => setSavedAsDraft(false), 2000);
      
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const publishProject = async () => {
    if (!validateStep(currentStep)) return;
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      const updateData = {
        title: formData.title,
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        industry: formData.category, // Usar categoría como industria por ahora
        status: 'active',
        visibility: formData.visibility,
        is_seeking_cofounder: formData.looking_for.includes('co_fundador'),
        is_seeking_investors: formData.seeking_investment,
        accepts_applications: formData.allow_applications,
        tech_stack: JSON.stringify(formData.tech_stack),
        published_at: new Date().toISOString(),
        
        // Almacenar todos los datos del formulario en metadata
        metadata: {
          ...formData,
          published: true,
          publishedAt: new Date().toISOString()
        }
      };

      console.log('Publishing project with data:', updateData);
      console.log('Project ID:', projectId);

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) throw error;
      
      router.push(`/projects/${projectId}`);
      
    } catch (error) {
      console.error('Error publishing project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error publishing project: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
            
            <div className="flex-1" />
            
            {savedAsDraft && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Borrador guardado</span>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveDraft}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Borrador
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold">Crear Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Completa la información de tu proyecto paso a paso
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {STEPS[currentStep - 1].icon} {STEPS[currentStep - 1].title}
            </h2>
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index + 1 <= currentStep ? 'text-primary' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                  index + 1 <= currentStep 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <span className="mt-1 hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Información Básica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Título del Proyecto *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="Ej: Plataforma de delivery sostenible"
                      maxLength={60}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.title.length}/60 caracteres
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="tagline">Tagline *</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => updateFormData('tagline', e.target.value)}
                      placeholder="Una frase que describa tu proyecto"
                      className={errors.tagline ? 'border-red-500' : ''}
                    />
                    {errors.tagline && <p className="text-red-500 text-sm mt-1">{errors.tagline}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoría Principal *</Label>
                    <Select onValueChange={(value) => updateFormData('category', value)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Estado del Proyecto</Label>
                    <Select 
                      value={formData.status}
                      onValueChange={(value) => updateFormData('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="project_type">Tipo de Proyecto</Label>
                    <Select 
                      value={formData.project_type}
                      onValueChange={(value) => updateFormData('project_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Select 
                      value={formData.location}
                      onValueChange={(value) => updateFormData('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">🌐 Remoto</SelectItem>
                        <SelectItem value="onsite">🏢 Presencial</SelectItem>
                        <SelectItem value="hybrid">🔄 Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && projectId && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Contenido Visual</h3>
                
                {/* Logo Upload */}
                <div>
                  <Label>Logo del Proyecto</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube el logo principal de tu proyecto (recomendado: 300x300px)
                  </p>
                  
                  {formData.logo ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <img 
                        src={formData.logo.public_url} 
                        alt="Logo del proyecto"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{formData.logo.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(formData.logo.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(formData.logo!.id)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      projectId={projectId}
                      onUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      acceptedFileTypes={["image/*"]}
                      maxFiles={1}
                    />
                  )}
                </div>

                {/* Gallery Upload */}
                <div>
                  <Label>Galería de Imágenes</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube hasta 5 imágenes adicionales de tu proyecto (screenshots, mockups, etc.)
                  </p>
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {formData.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.public_url}
                            alt={image.file_name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(image.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.images.length < 5 && (
                    <FileUpload
                      projectId={projectId}
                      onUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      acceptedFileTypes={["image/*"]}
                      maxFiles={5 - formData.images.length}
                    />
                  )}
                </div>

                {/* Video URL */}
                <div>
                  <Label htmlFor="video_url">Video de Presentación (Opcional)</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url || ''}
                    onChange={(e) => updateFormData('video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL de YouTube o Vimeo con tu video de pitch
                  </p>
                </div>

                {/* Presentation Upload */}
                <div>
                  <Label>Presentación (Opcional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube tu pitch deck o presentación en PDF
                  </p>
                  
                  {formData.presentation ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                        📄
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{formData.presentation.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(formData.presentation.file_size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFormData('presentation', undefined)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <FileUpload
                      projectId={projectId}
                      onUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      acceptedFileTypes={["application/pdf"]}
                      maxFiles={1}
                    />
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Descripción Detallada</h3>
                
                <div>
                  <Label htmlFor="description">Descripción General *</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => updateFormData('description', value)}
                    placeholder="Describe tu proyecto de manera general..."
                    minHeight={150}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="problem">¿Qué problema resuelve? *</Label>
                    <RichTextEditor
                      value={formData.problem}
                      onChange={(value) => updateFormData('problem', value)}
                      placeholder="Describe el problema específico que tu proyecto soluciona..."
                      minHeight={100}
                      className={errors.problem ? 'border-red-500' : ''}
                    />
                    {errors.problem && <p className="text-red-500 text-sm mt-1">{errors.problem}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="solution">¿Cuál es tu solución? *</Label>
                    <RichTextEditor
                      value={formData.solution}
                      onChange={(value) => updateFormData('solution', value)}
                      placeholder="Explica cómo tu proyecto soluciona el problema..."
                      minHeight={100}
                      className={errors.solution ? 'border-red-500' : ''}
                    />
                    {errors.solution && <p className="text-red-500 text-sm mt-1">{errors.solution}</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="value_proposition">Propuesta de Valor Única</Label>
                  <RichTextEditor
                    value={formData.value_proposition}
                    onChange={(value) => updateFormData('value_proposition', value)}
                    placeholder="¿Qué hace único a tu proyecto? ¿Por qué alguien elegiría tu solución?"
                    minHeight={100}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="target_market">Mercado Objetivo</Label>
                    <Textarea
                      id="target_market"
                      value={formData.target_market}
                      onChange={(e) => updateFormData('target_market', e.target.value)}
                      placeholder="¿A quién está dirigido tu proyecto?"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="business_model">Modelo de Negocio</Label>
                    <Textarea
                      id="business_model"
                      value={formData.business_model}
                      onChange={(e) => updateFormData('business_model', e.target.value)}
                      placeholder="¿Cómo planeas generar ingresos?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Objetivos y Necesidades</h3>
                
                <div>
                  <Label>¿Qué buscas? *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      'Co-fundador', 'Desarrollador', 'Diseñador', 'Marketing', 
                      'Inversión', 'Mentor', 'Feedback', 'Beta Testers'
                    ].map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`looking-${option}`}
                          checked={formData.looking_for.includes(option.toLowerCase().replace(' ', '_'))}
                          onCheckedChange={(checked) => {
                            const value = option.toLowerCase().replace(' ', '_');
                            if (checked) {
                              updateFormData('looking_for', [...formData.looking_for, value]);
                            } else {
                              updateFormData('looking_for', formData.looking_for.filter(item => item !== value));
                            }
                          }}
                        />
                        <Label htmlFor={`looking-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.looking_for && <p className="text-red-500 text-sm mt-1">{errors.looking_for}</p>}
                </div>
                
                {/* Needed Roles */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Roles Específicos Necesarios</Label>
                    <Button variant="outline" size="sm" onClick={addNeededRole}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Rol
                    </Button>
                  </div>
                  
                  {formData.needed_roles.map((role, index) => (
                    <Card key={index} className="p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`role-title-${index}`}>Título del Rol</Label>
                          <Input
                            id={`role-title-${index}`}
                            value={role.role}
                            onChange={(e) => updateNeededRole(index, 'role', e.target.value)}
                            placeholder="Ej: CTO, Head of Marketing"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`role-experience-${index}`}>Experiencia</Label>
                          <Select 
                            value={role.experience}
                            onValueChange={(value) => updateNeededRole(index, 'experience', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="junior">Junior (0-2 años)</SelectItem>
                              <SelectItem value="mid">Mid (2-5 años)</SelectItem>
                              <SelectItem value="senior">Senior (5+ años)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor={`role-description-${index}`}>Descripción</Label>
                          <Textarea
                            id={`role-description-${index}`}
                            value={role.description}
                            onChange={(e) => updateNeededRole(index, 'description', e.target.value)}
                            placeholder="Describe las responsabilidades de este rol..."
                            rows={2}
                          />
                        </div>
                        
                        <div className="md:col-span-2 flex items-center justify-between">
                          <div className="flex-1">
                            <Label htmlFor={`role-skills-${index}`}>Habilidades Requeridas</Label>
                            <Input
                              id={`role-skills-${index}`}
                              value={role.skills.join(', ')}
                              onChange={(e) => updateNeededRole(index, 'skills', e.target.value.split(', '))}
                              placeholder="React, Node.js, PostgreSQL"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Separa las habilidades con comas
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeNeededRole(index)}
                            className="ml-4"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Collaboration preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Tipo de Colaboración</Label>
                    <div className="space-y-2 mt-2">
                      {['Equity/Participación', 'Paid/Remunerado', 'Voluntario'].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`collab-${option}`}
                            checked={formData.collaboration_type.includes(option.toLowerCase().replace('/', '_'))}
                            onCheckedChange={(checked) => {
                              const value = option.toLowerCase().replace('/', '_');
                              if (checked) {
                                updateFormData('collaboration_type', [...formData.collaboration_type, value]);
                              } else {
                                updateFormData('collaboration_type', formData.collaboration_type.filter(item => item !== value));
                              }
                            }}
                          />
                          <Label htmlFor={`collab-${option}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="time_commitment">Compromiso de Tiempo</Label>
                    <Select 
                      value={formData.time_commitment}
                      onValueChange={(value) => updateFormData('time_commitment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="part_time">Tiempo parcial (10-20h/semana)</SelectItem>
                        <SelectItem value="full_time">Tiempo completo (40h/semana)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Aspectos Financieros</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seeking_investment"
                    checked={formData.seeking_investment}
                    onCheckedChange={(checked) => updateFormData('seeking_investment', !!checked)}
                  />
                  <Label htmlFor="seeking_investment">¿Buscas inversión?</Label>
                </div>
                
                {formData.seeking_investment && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="funding_amount">Monto Buscado (USD)</Label>
                        <Input
                          id="funding_amount"
                          type="number"
                          value={formData.funding_amount || ''}
                          onChange={(e) => updateFormData('funding_amount', parseInt(e.target.value))}
                          placeholder="50000"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="investment_type">Tipo de Inversión</Label>
                        <Select 
                          value={formData.investment_type}
                          onValueChange={(value) => updateFormData('investment_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seed">Seed</SelectItem>
                            <SelectItem value="pre_series_a">Pre-Serie A</SelectItem>
                            <SelectItem value="series_a">Serie A</SelectItem>
                            <SelectItem value="angel">Angel</SelectItem>
                            <SelectItem value="bootstrap">Bootstrap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="current_revenue">Ingresos Actuales (USD/mes)</Label>
                        <Input
                          id="current_revenue"
                          type="number"
                          value={formData.current_revenue || ''}
                          onChange={(e) => updateFormData('current_revenue', parseInt(e.target.value))}
                          placeholder="5000"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="estimated_valuation">Valoración Estimada (USD)</Label>
                        <Input
                          id="estimated_valuation"
                          type="number"
                          value={formData.estimated_valuation || ''}
                          onChange={(e) => updateFormData('estimated_valuation', parseInt(e.target.value))}
                          placeholder="500000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="traction_metrics">Métricas de Tracción</Label>
                      <Textarea
                        id="traction_metrics"
                        value={formData.traction_metrics}
                        onChange={(e) => updateFormData('traction_metrics', e.target.value)}
                        placeholder="Usuarios activos, crecimiento mensual, partnerships clave..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Información Técnica</h3>
                
                <div>
                  <Label htmlFor="tech_stack">Stack Tecnológico</Label>
                  <Input
                    id="tech_stack"
                    value={formData.tech_stack.join(', ')}
                    onChange={(e) => updateFormData('tech_stack', e.target.value.split(', '))}
                    placeholder="React, Node.js, PostgreSQL, AWS"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separa las tecnologías con comas
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="repository_url">Repositorio (GitHub, GitLab)</Label>
                    <Input
                      id="repository_url"
                      value={formData.repository_url || ''}
                      onChange={(e) => updateFormData('repository_url', e.target.value)}
                      placeholder="https://github.com/usuario/proyecto"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="demo_url">Demo/Producto en Vivo</Label>
                    <Input
                      id="demo_url"
                      value={formData.demo_url || ''}
                      onChange={(e) => updateFormData('demo_url', e.target.value)}
                      placeholder="https://miproyecto.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="apis_used">APIs y Servicios Utilizados</Label>
                  <Input
                    id="apis_used"
                    value={formData.apis_used.join(', ')}
                    onChange={(e) => updateFormData('apis_used', e.target.value.split(', '))}
                    placeholder="Stripe, SendGrid, Google Maps"
                  />
                </div>
                
                <div>
                  <Label htmlFor="infrastructure">Infraestructura</Label>
                  <Select 
                    value={formData.infrastructure}
                    onValueChange={(value) => updateFormData('infrastructure', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud">☁️ Cloud (AWS/GCP/Azure)</SelectItem>
                      <SelectItem value="serverless">⚡ Serverless</SelectItem>
                      <SelectItem value="on_premise">🏢 On-Premise</SelectItem>
                      <SelectItem value="hybrid">🔄 Híbrida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Configuración y Privacidad</h3>
                
                <div>
                  <Label htmlFor="visibility">Visibilidad del Proyecto</Label>
                  <Select 
                    value={formData.visibility}
                    onValueChange={(value) => updateFormData('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🌐 Público - Visible para todos</SelectItem>
                      <SelectItem value="private">🔒 Privado - Solo invitados</SelectItem>
                      <SelectItem value="unlisted">📎 No listado - Solo con enlace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow_applications"
                      checked={formData.allow_applications}
                      onCheckedChange={(checked) => updateFormData('allow_applications', !!checked)}
                    />
                    <Label htmlFor="allow_applications">Permitir aplicaciones espontáneas</Label>
                  </div>
                  
                  {formData.allow_applications && (
                    <div>
                      <Label htmlFor="selection_process">Proceso de Selección</Label>
                      <Select 
                        value={formData.selection_process}
                        onValueChange={(value) => updateFormData('selection_process', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual - Revisión personal</SelectItem>
                          <SelectItem value="automatic">Automático - Criterios predefinidos</SelectItem>
                          <SelectItem value="interview">Entrevista requerida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nda_required"
                      checked={formData.nda_required}
                      onCheckedChange={(checked) => updateFormData('nda_required', !!checked)}
                    />
                    <Label htmlFor="nda_required">Requerir NDA (Acuerdo de Confidencialidad)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact_info_visible"
                      checked={formData.contact_info_visible}
                      onCheckedChange={(checked) => updateFormData('contact_info_visible', !!checked)}
                    />
                    <Label htmlFor="contact_info_visible">Mostrar información de contacto</Label>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Resumen Final</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Título:</strong> {formData.title || 'Sin título'}</p>
                    <p><strong>Categoría:</strong> {formData.category || 'No seleccionada'}</p>
                    <p><strong>Estado:</strong> {PROJECT_STATUSES.find(s => s.value === formData.status)?.label || formData.status}</p>
                    <p><strong>Visibilidad:</strong> {formData.visibility === 'public' ? 'Público' : formData.visibility === 'private' ? 'Privado' : 'No listado'}</p>
                    <p><strong>Archivos:</strong> {formData.images.length} imágenes{formData.logo ? ', 1 logo' : ''}{formData.presentation ? ', 1 presentación' : ''}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={publishProject} disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? 'Publicando...' : 'Publicar Proyecto'}
              </Button>
            )}
          </div>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
