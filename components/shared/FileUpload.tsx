'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  File,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { projectStorageService, ProjectFile, UploadOptions } from '@/lib/project-storage';

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (file: ProjectFile) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxSize?: number; // in bytes
}

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  uploadError?: string;
  uploadResult?: ProjectFile;
}

export function FileUpload({
  projectId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  acceptedFileTypes = ['image/*', 'video/*', 'application/pdf', '.ppt', '.pptx', '.doc', '.docx'],
  maxSize = 50 * 1024 * 1024 // 50MB
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadOptions, setUploadOptions] = useState<Partial<UploadOptions>>({
    fileType: 'other',
    category: 'general',
    isPublic: true
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        uploadProgress: 0,
        uploadStatus: 'idle' as const
      });
      return fileWithPreview;
    });

    setFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: FileWithPreview, index: number) => {
    const options: UploadOptions = {
      projectId,
      fileType: uploadOptions.fileType || 'other',
      category: uploadOptions.category,
      title: uploadOptions.title || file.name,
      description: uploadOptions.description,
      isPublic: uploadOptions.isPublic,
      displayOrder: uploadOptions.displayOrder
    };

    // Update status
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = {
        ...newFiles[index],
        uploadStatus: 'uploading',
        uploadProgress: 0
      };
      return newFiles;
    });

    try {
      const result = await projectStorageService.uploadFile(file, options);

      if (result.success && result.fileRecord) {
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = {
            ...newFiles[index],
            uploadStatus: 'success',
            uploadProgress: 100,
            uploadResult: result.fileRecord
          };
          return newFiles;
        });

        onUploadComplete?.(result.fileRecord);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir archivo';
      
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = {
          ...newFiles[index],
          uploadStatus: 'error',
          uploadError: errorMessage
        };
        return newFiles;
      });

      onUploadError?.(errorMessage);
    }
  };

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter(f => f.uploadStatus === 'idle');
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].uploadStatus === 'idle') {
        await uploadFile(files[i], i);
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Archivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fileType">Tipo de archivo</Label>
            <Select 
              value={uploadOptions.fileType} 
              onValueChange={(value: ProjectFile['file_type']) => 
                setUploadOptions(prev => ({ ...prev, fileType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logo">Logo</SelectItem>
                <SelectItem value="cover_image">Imagen de portada</SelectItem>
                <SelectItem value="demo_video">Video demo</SelectItem>
                <SelectItem value="pitch_deck">Pitch deck</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="presentation">Presentación</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Input 
              id="category"
              placeholder="ej: marketing, legal, técnico"
              value={uploadOptions.category || ''}
              onChange={(e) => 
                setUploadOptions(prev => ({ ...prev, category: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="title">Título (opcional)</Label>
            <Input 
              id="title"
              placeholder="Título personalizado"
              value={uploadOptions.title || ''}
              onChange={(e) => 
                setUploadOptions(prev => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isPublic"
              checked={uploadOptions.isPublic !== false}
              onCheckedChange={(checked) => 
                setUploadOptions(prev => ({ ...prev, isPublic: checked }))
              }
            />
            <Label htmlFor="isPublic">Archivo público</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea 
            id="description"
            placeholder="Describe el archivo..."
            value={uploadOptions.description || ''}
            onChange={(e) => 
              setUploadOptions(prev => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Suelta los archivos aquí...</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo {maxFiles} archivos, hasta {formatFileSize(maxSize)} cada uno
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos: imágenes, videos, PDF, presentaciones, documentos
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Archivos seleccionados ({files.length})</h4>
              {files.some(f => f.uploadStatus === 'idle') && (
                <Button onClick={uploadAllFiles} size="sm">
                  Subir todos
                </Button>
              )}
            </div>

            {files.map((file, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {file.uploadStatus === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={file.uploadProgress || 0} className="h-1" />
                        </div>
                      )}
                      
                      {file.uploadStatus === 'error' && file.uploadError && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {file.uploadError}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {file.uploadStatus === 'success' && (
                        <div className="flex items-center mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">Subido exitosamente</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.uploadStatus === 'idle' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => uploadFile(file, index)}
                      >
                        Subir
                      </Button>
                    )}
                    
                    {file.uploadStatus === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      disabled={file.uploadStatus === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
