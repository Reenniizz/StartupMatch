'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Project } from '@/types/projects';

interface DeleteProjectDialogProps {
  project: Project;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDelete?: (projectId: string) => void;
  onCancel?: () => void;
}

export default function DeleteProjectDialog({
  project,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onDelete,
  onCancel
}: DeleteProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const expectedText = project.title;
  const isConfirmValid = confirmText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      setError('El texto de confirmación no coincide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el proyecto');
      }

      // Success
      setOpen(false);
      if (onDelete) {
        onDelete(project.id);
      }
      
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setOpen(false);
    setConfirmText('');
    setError('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    } else {
      setOpen(newOpen);
    }
  };

  return (
    <>
      {trigger && (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            {trigger}
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-lg">
            {/* Dialog content will be duplicated but that's ok for now */}
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl">
                    Eliminar Proyecto
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2">
                    Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
                    y todos sus datos asociados.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* Project Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  Proyecto a eliminar:
                </h4>
                <p className="text-lg font-medium text-gray-900">
                  {project.title}
                </p>
                {project.tagline && (
                  <p className="text-sm text-gray-600 mt-1">
                    {project.tagline}
                  </p>
                )}
              </div>

              {/* What will be deleted */}
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Se eliminarán:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Toda la información del proyecto</li>
                  <li>Archivos e imágenes subidas</li>
                  <li>Aplicaciones recibidas</li>
                  <li>Comentarios y likes</li>
                  <li>Miembros del equipo</li>
                  <li>Estadísticas y métricas</li>
                </ul>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <Label htmlFor="confirm-text" className="text-sm font-medium">
                  Para confirmar, escribe exactamente: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{expectedText}</span>
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError('');
                  }}
                  placeholder="Escribe el título del proyecto aquí"
                  className={error ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {error && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel} disabled={loading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isConfirmValid || loading}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Proyecto
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Controlled version without trigger */}
      {!trigger && (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl">
                    Eliminar Proyecto
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-2">
                    Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
                    y todos sus datos asociados.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* Project Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  Proyecto a eliminar:
                </h4>
                <p className="text-lg font-medium text-gray-900">
                  {project.title}
                </p>
                {project.tagline && (
                  <p className="text-sm text-gray-600 mt-1">
                    {project.tagline}
                  </p>
                )}
              </div>

              {/* What will be deleted */}
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Se eliminarán:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Toda la información del proyecto</li>
                  <li>Archivos e imágenes subidas</li>
                  <li>Aplicaciones recibidas</li>
                  <li>Comentarios y likes</li>
                  <li>Miembros del equipo</li>
                  <li>Estadísticas y métricas</li>
                </ul>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <Label htmlFor="confirm-text-2" className="text-sm font-medium">
                  Para confirmar, escribe exactamente: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{expectedText}</span>
                </Label>
                <Input
                  id="confirm-text-2"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError('');
                  }}
                  placeholder="Escribe el título del proyecto aquí"
                  className={error ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {error && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel} disabled={loading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isConfirmValid || loading}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Proyecto
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
