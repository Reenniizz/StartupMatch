'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, Upload, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Project } from '@/types/projects';
import { projectStorageService, ProjectFile } from '@/lib/project-storage';

interface EditProjectFormProps {
  projectId: string;
  initialProject?: Project;
  onCancel?: () => void;
  onSave?: (project: Project) => void;
}

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

const VISIBILITY_OPTIONS = [
  { value: 'public', label: '🌐 Público - Visible para todos' },
  { value: 'private', label: '🔒 Privado - Solo invitados' },
  { value: 'unlisted', label: '📎 No listado - Solo con enlace' }
];

export default function EditProjectForm({ 
  projectId, 
  initialProject, 
  onCancel, 
  onSave 
}: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!initialProject);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [images, setImages] = useState<ProjectFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Helper function to parse arrays that might be stored as JSON strings
  const parseArrayField = (field: any): string[] => {
    if (Array.isArray(field)) {
      return field;
    }
    if (typeof field === 'string' && field.trim()) {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If JSON parsing fails, try splitting by comma
        return field.split(',').map((item: string) => item.trim()).filter((item: string) => item);
      }
    }
    return [];
  };

  // Load project data if not provided
  useEffect(() => {
    if (!initialProject) {
      loadProject();
    }
  }, [projectId, initialProject]);

  // Load project images
  useEffect(() => {
    if (project) {
      loadProjectImages();
    }
  }, [project]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error loading project:', error);
      setErrors({ general: 'Error al cargar el proyecto' });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectImages = async () => {
    if (!project) return;
    
    try {
      const files = await projectStorageService.getProjectFiles(project.id);
      setImages(files.filter(file => file.file_type === 'image'));
    } catch (error) {
      console.error('Error loading project images:', error);
    }
  };

  const updateProject = (field: string, value: any) => {
    if (!project) return;
    
    setProject(prev => prev ? { ...prev, [field]: value } : null);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (file: ProjectFile) => {
    if (file.file_type === 'image') {
      setImages(prev => [file, ...prev]);
    }
  };

  const handleFileUploadError = (error: string) => {
    console.error('Upload error:', error);
    setSaveMessage({ type: 'error', text: 'Error al subir el archivo' });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const removeImage = async (fileId: string) => {
    try {
      await projectStorageService.deleteFile(fileId);
      setImages(prev => prev.filter(img => img.id !== fileId));
    } catch (error) {
      console.error('Error removing image:', error);
      setSaveMessage({ type: 'error', text: 'Error al eliminar la imagen' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const validateProject = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!project?.title?.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (project.title.length > 60) {
      newErrors.title = 'El título no puede exceder 60 caracteres';
    }

    if (!project?.description?.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!project?.category) {
      newErrors.category = 'La categoría es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProject = async () => {
    if (!project || !validateProject()) {
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const updateData = {
        title: project.title,
        tagline: project.tagline,
        description: project.description,
        detailed_description: project.detailed_description,
        category: project.category,
        industry: project.category,
        stage: project.stage,
        status: project.status,
        visibility: project.visibility,
        demo_url: project.demo_url,
        website_url: project.website_url,
        repository_url: project.repository_url,
        pitch_deck_url: project.pitch_deck_url,
        tech_stack: parseArrayField(project.tech_stack),
        required_skills: parseArrayField(project.required_skills),
        funding_goal: project.funding_goal,
        is_seeking_cofounder: project.is_seeking_cofounder,
        is_seeking_investors: project.is_seeking_investors,
        accepts_applications: project.accepts_applications,
        tags: project.tags || []
      };

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const data = await response.json();
      setProject(data.project);
      
      setSaveMessage({ type: 'success', text: 'Proyecto guardado exitosamente' });
      
      if (onSave) {
        onSave(data.project);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('Error saving project:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al guardar el proyecto'
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Proyecto no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            No se pudo cargar el proyecto solicitado.
          </p>
          <Button onClick={handleCancel}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex-1" />
          
          {saveMessage && (
            <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
              saveMessage.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {saveMessage.text}
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold">Editar Proyecto</h1>
        <p className="text-muted-foreground">
          Actualiza la información de tu proyecto
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              {errors.general}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título del Proyecto *</Label>
              <Input
                id="title"
                value={project.title}
                onChange={(e) => updateProject('title', e.target.value)}
                placeholder="Ej: Plataforma de delivery sostenible"
                maxLength={60}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {project.title?.length || 0}/60 caracteres
              </p>
            </div>
            
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={project.tagline || ''}
                onChange={(e) => updateProject('tagline', e.target.value)}
                placeholder="Una frase que describa tu proyecto"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select 
                  value={project.category}
                  onValueChange={(value) => updateProject('category', value)}
                >
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
                <Label htmlFor="stage">Estado del Proyecto</Label>
                <Select 
                  value={project.stage}
                  onValueChange={(value) => updateProject('stage', value)}
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
                <Label htmlFor="visibility">Visibilidad</Label>
                <Select 
                  value={project.visibility}
                  onValueChange={(value) => updateProject('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descripción General *</Label>
              <RichTextEditor
                value={project.description}
                onChange={(value) => updateProject('description', value)}
                placeholder="Describe tu proyecto de manera general..."
                minHeight={150}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <Label htmlFor="detailed_description">Descripción Detallada</Label>
              <RichTextEditor
                value={project.detailed_description || ''}
                onChange={(value) => updateProject('detailed_description', value)}
                placeholder="Proporciona más detalles sobre tu proyecto..."
                minHeight={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Images */}
            {images.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Imágenes actuales</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
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
              </div>
            )}
            
            {/* Upload new images */}
            <div>
              <h4 className="font-medium mb-3">Subir nuevas imágenes</h4>
              <FileUpload
                projectId={projectId}
                onUploadComplete={handleFileUpload}
                onUploadError={handleFileUploadError}
                acceptedFileTypes={["image/*"]}
                maxFiles={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tech_stack">Stack Tecnológico</Label>
              <Input
                id="tech_stack"
                value={project.tech_stack?.join(', ') || ''}
                onChange={(e) => updateProject('tech_stack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separa las tecnologías con comas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website_url">Sitio Web</Label>
                <Input
                  id="website_url"
                  value={project.website_url || ''}
                  onChange={(e) => updateProject('website_url', e.target.value)}
                  placeholder="https://miproyecto.com"
                />
              </div>
              
              <div>
                <Label htmlFor="demo_url">Demo/Producto en Vivo</Label>
                <Input
                  id="demo_url"
                  value={project.demo_url || ''}
                  onChange={(e) => updateProject('demo_url', e.target.value)}
                  placeholder="https://demo.miproyecto.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="repository_url">Repositorio (GitHub, GitLab)</Label>
              <Input
                id="repository_url"
                value={project.repository_url || ''}
                onChange={(e) => updateProject('repository_url', e.target.value)}
                placeholder="https://github.com/usuario/proyecto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accepts_applications"
                checked={project.accepts_applications}
                onCheckedChange={(checked) => updateProject('accepts_applications', !!checked)}
              />
              <Label htmlFor="accepts_applications">Permitir aplicaciones espontáneas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_seeking_cofounder"
                checked={project.is_seeking_cofounder}
                onCheckedChange={(checked) => updateProject('is_seeking_cofounder', !!checked)}
              />
              <Label htmlFor="is_seeking_cofounder">Buscando co-fundador</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_seeking_investors"
                checked={project.is_seeking_investors}
                onCheckedChange={(checked) => updateProject('is_seeking_investors', !!checked)}
              />
              <Label htmlFor="is_seeking_investors">Buscando inversores</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-8 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/projects/${projectId}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista previa
          </Button>
          
          <Button onClick={saveProject} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
