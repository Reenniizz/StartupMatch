'use client';

import React, { useState, useEffect } from 'react';

interface ProjectFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  public_url?: string;
  bucket_name: string;
  created_at: string;
}

export default function StorageTestPage() {
  const [message, setMessage] = useState('🔄 Inicializando...');
  const [projectId, setProjectId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Función para probar la conexión con Supabase
  const testSupabaseConnection = async () => {
    try {
      setMessage('🔌 Conectando con Supabase...');
      
      const { supabase } = await import('@/lib/supabase-client');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setMessage('❌ Error de conexión: ' + error.message);
        return false;
      }
      
      setIsConnected(true);
      
      if (data?.session?.user) {
        setMessage('✅ Usuario autenticado: ' + data.session.user.email);
        setIsAuthenticated(true);
        const success = await createTestProject(data.session.user.id);
        if (success) {
          await loadProjectFiles();
        }
        return success;
      } else {
        setMessage('⚠️ Conectado pero sin autenticar - Ve a /login');
        return true;
      }
      
    } catch (error) {
      setMessage('❌ Error general: ' + String(error));
      return false;
    }
  };

  // Función para crear proyecto de prueba
  const createTestProject = async (userId: string) => {
    try {
      setMessage('🏗️ Creando proyecto de prueba...');
      
      const { supabase } = await import('@/lib/supabase-client');
      
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id, title')
        .eq('title', '🧪 Proyecto de Prueba - Storage Test')
        .eq('creator_id', userId)
        .single();

      if (existingProject) {
        setProjectId(existingProject.id);
        setProjectCreated(true);
        setMessage('✅ Proyecto listo para archivos: ' + existingProject.id.substring(0, 8) + '...');
        return true;
      }

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          title: '🧪 Proyecto de Prueba - Storage Test',
          description: 'Proyecto temporal para probar el sistema de Storage',
          creator_id: userId,
          industry: 'Tecnología',
          category: 'Tecnología',
          status: 'active',
          visibility: 'public'
        })
        .select()
        .single();

      if (error) {
        setMessage('❌ Error creando proyecto: ' + error.message);
        return false;
      }

      setProjectId(newProject.id);
      setProjectCreated(true);
      setMessage('✅ Proyecto listo para archivos: ' + newProject.id.substring(0, 8) + '...');
      return true;

    } catch (error) {
      setMessage('❌ Error creando proyecto: ' + String(error));
      return false;
    }
  };

  // Cargar archivos del proyecto
  const loadProjectFiles = async () => {
    if (!projectId) return;
    
    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      const { data: filesData, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando archivos:', error);
        return;
      }

      setFiles(filesData || []);
    } catch (error) {
      console.error('Error general:', error);
    }
  };

  // Subir archivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      // Definir el bucket basado en el tipo de archivo
      let bucketName = 'projects';
      if (file.type.startsWith('image/')) {
        bucketName = 'project-assets';
      } else if (file.type === 'application/pdf') {
        bucketName = 'project-documents';
      }

      // Crear path único
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${projectId}/${fileName}`;

      // Subir archivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obtener URL pública si es bucket público
      let publicUrl = null;
      if (bucketName === 'projects' || bucketName === 'project-assets') {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      // Guardar información en la base de datos
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error('Usuario no autenticado');
      }

      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          uploader_id: sessionData.session.user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          file_type: file.type.startsWith('image/') ? 'image' : 'document',
          bucket_name: bucketName,
          storage_path: uploadData.path,
          public_url: publicUrl,
          title: file.name
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setMessage('✅ Archivo subido exitosamente: ' + file.name);
      await loadProjectFiles();

    } catch (error) {
      setMessage('❌ Error subiendo archivo: ' + String(error));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Limpiar el input
      event.target.value = '';
    }
  };

  // Eliminar archivo
  const deleteFile = async (file: ProjectFile) => {
    if (!confirm('¿Eliminar ' + file.file_name + '?')) return;

    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_name)
        .remove([file.file_path]);

      if (storageError) {
        console.warn('Error eliminando de storage:', storageError);
      }

      // Eliminar de BD
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setMessage('✅ Archivo eliminado: ' + file.file_name);
      await loadProjectFiles();

    } catch (error) {
      setMessage('❌ Error eliminando: ' + String(error));
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      testSupabaseConnection();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🗂️ Test Completo de Supabase Storage</h1>
      <p>Sistema completo de upload, gestión y eliminación de archivos</p>
      
      {/* Estado del Sistema */}
      <div style={{ 
        background: isConnected ? '#f0fdf4' : '#fef2f2', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        border: `1px solid ${isConnected ? '#16a34a' : '#dc2626'}`
      }}>
        <h2>📊 Estado del Sistema</h2>
        <p><strong>Estado:</strong> {message}</p>
        <p><strong>Proyecto ID:</strong> {projectId ? `${projectId.substring(0, 8)}...` : 'Sin proyecto'}</p>
        <p><strong>Archivos:</strong> {files.length} archivo(s)</p>
      </div>

      {/* Sistema de Upload */}
      {projectCreated && (
        <div style={{ 
          background: '#f0f9ff', 
          padding: '20px', 
          borderRadius: '8px', 
          marginTop: '20px',
          border: '1px solid #0284c7'
        }}>
          <h2>📤 Subir Archivos</h2>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*,application/pdf,.txt"
              style={{
                padding: '10px',
                border: '2px dashed #0284c7',
                borderRadius: '6px',
                background: 'white',
                width: '100%'
              }}
            />
          </div>
          
          {uploading && (
            <div style={{ 
              background: '#fffbeb', 
              padding: '10px', 
              borderRadius: '6px',
              border: '1px solid #f59e0b'
            }}>
              📤 Subiendo archivo...
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            <strong>Formatos permitidos:</strong> Imágenes (JPG, PNG, GIF), PDF, TXT<br/>
            <strong>Buckets:</strong> Imágenes → project-assets, PDF → project-documents, Otros → projects
          </div>
        </div>
      )}

      {/* Lista de Archivos */}
      {files.length > 0 && (
        <div style={{ 
          background: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px', 
          marginTop: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h2>📁 Archivos Subidos ({files.length})</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            {files.map((file) => (
              <div key={file.id} style={{
                background: 'white',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {file.file_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatFileSize(file.file_size)} • {file.mime_type} • {file.bucket_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {new Date(file.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {file.public_url && (
                    <button
                      onClick={() => window.open(file.public_url, '_blank')}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      👁️ Ver
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteFile(file)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ 
        background: '#fffbeb', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        border: '1px solid #f59e0b'
      }}>
        <h2>🔧 Acciones</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testSupabaseConnection}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Reconectar
          </button>
          
          <button 
            onClick={loadProjectFiles}
            disabled={!projectId}
            style={{
              background: projectId ? '#16a34a' : '#94a3b8',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: projectId ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            � Recargar Archivos
          </button>

          {!isAuthenticated && (
            <button 
              onClick={() => window.location.href = '/login'}
              style={{
                background: '#f59e0b',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔐 Ir a Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
