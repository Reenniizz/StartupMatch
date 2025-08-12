"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Lock,
  Globe,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  FileText,
  Tag,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const categories = [
  { value: 'Industria', label: 'Industria', description: 'Grupos específicos por sector' },
  { value: 'Tecnología', label: 'Tecnología', description: 'Desarrollo, AI, DevOps, etc.' },
  { value: 'Stage', label: 'Stage', description: 'Pre-seed, Seed, Series A, etc.' },
  { value: 'Ubicación', label: 'Ubicación', description: 'Grupos por ciudad o región' },
  { value: 'Comunidad', label: 'Comunidad', description: 'Networking y eventos' },
  { value: 'Inversión', label: 'Inversión', description: 'Angels, VCs, funding' },
  { value: 'General', label: 'General', description: 'Temas diversos' }
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isPrivate: false,
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      isPrivate: false,
      tags: ''
    });
    setErrors({});
    setSuccess(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grupo es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede tener más de 100 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'La descripción no puede tener más de 500 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (formData.tags && formData.tags.split(',').length > 5) {
      newErrors.tags = 'Máximo 5 tags permitidos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          isPrivate: formData.isPrivate,
          tags: formData.tags.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el grupo');
      }

      const result = await response.json();
      console.log('Grupo creado:', result);

      setSuccess(true);
      
      // Esperar un poco para mostrar el mensaje de éxito
      setTimeout(() => {
        resetForm();
        onGroupCreated();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating group:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Error al crear el grupo'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tagsList = formData.tags 
    ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Users className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Crear Nuevo Grupo</h2>
                    <p className="text-sm text-slate-600">Conecta con personas afines</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">¡Grupo Creado!</h3>
                    <p className="text-slate-600">
                      Tu grupo ha sido creado exitosamente y ya puedes comenzar a invitar miembros.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre del Grupo */}
                    <div>
                      <Label htmlFor="name" className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <Hash className="h-4 w-4 mr-2" />
                        Nombre del Grupo
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Fundadores FinTech México"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`border-slate-200 focus:border-slate-400 ${errors.name ? 'border-red-300 focus:border-red-400' : ''}`}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {formData.name.length}/100 caracteres
                      </p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <Label htmlFor="description" className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <FileText className="h-4 w-4 mr-2" />
                        Descripción
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe de qué trata tu grupo, qué tipo de conversaciones se tendrán y qué valor aportará a los miembros..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className={`border-slate-200 focus:border-slate-400 min-h-[100px] resize-none ${errors.description ? 'border-red-300 focus:border-red-400' : ''}`}
                        disabled={isSubmitting}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {formData.description.length}/500 caracteres
                      </p>
                    </div>

                    {/* Categoría */}
                    <div>
                      <Label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Categoría
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className={`border-slate-200 focus:border-slate-400 ${errors.category ? 'border-red-300' : ''}`}>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div>
                                <div className="font-medium">{category.label}</div>
                                <div className="text-xs text-slate-500">{category.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <Label htmlFor="tags" className="flex items-center text-sm font-medium text-slate-700 mb-2">
                        <Tag className="h-4 w-4 mr-2" />
                        Tags (opcional)
                      </Label>
                      <Input
                        id="tags"
                        type="text"
                        placeholder="Ej: fintech, startup, funding, mexico (separados por comas)"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        className={`border-slate-200 focus:border-slate-400 ${errors.tags ? 'border-red-300 focus:border-red-400' : ''}`}
                        disabled={isSubmitting}
                      />
                      {errors.tags && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.tags}
                        </p>
                      )}
                      {tagsList.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tagsList.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Máximo 5 tags, separados por comas
                      </p>
                    </div>

                    {/* Privacidad */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-3 block">
                        Privacidad del Grupo
                      </Label>
                      <div className="space-y-3">
                        <div
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            !formData.isPrivate 
                              ? 'border-slate-900 bg-slate-50' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${!formData.isPrivate ? 'bg-slate-900' : 'bg-slate-100'}`}>
                              <Globe className={`h-5 w-5 ${!formData.isPrivate ? 'text-white' : 'text-slate-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">Público</div>
                              <div className="text-sm text-slate-600">
                                Cualquiera puede encontrar y unirse al grupo
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.isPrivate 
                              ? 'border-slate-900 bg-slate-50' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${formData.isPrivate ? 'bg-slate-900' : 'bg-slate-100'}`}>
                              <Lock className={`h-5 w-5 ${formData.isPrivate ? 'text-white' : 'text-slate-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">Privado</div>
                              <div className="text-sm text-slate-600">
                                Solo por invitación, requiere aprobación del admin
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error general */}
                    {errors.submit && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-700 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          {errors.submit}
                        </p>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 border-slate-200"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Grupo
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
