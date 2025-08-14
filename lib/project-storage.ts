import { supabase } from '@/lib/supabase-client';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  fileRecord?: ProjectFile;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: 'logo' | 'cover_image' | 'demo_video' | 'pitch_deck' | 'document' | 'image' | 'video' | 'presentation' | 'other';
  category?: string;
  title?: string;
  description?: string;
  is_public: boolean;
  display_order: number;
  bucket_name: string;
  storage_path: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadOptions {
  projectId: string;
  fileType: ProjectFile['file_type'];
  category?: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  displayOrder?: number;
}

class ProjectStorageService {
  private getBucketForFileType(fileType: ProjectFile['file_type']): string {
    switch (fileType) {
      case 'logo':
      case 'cover_image':
        return 'project-assets';
      case 'pitch_deck':
      case 'document':
        return 'project-documents';
      case 'demo_video':
      case 'image':
      case 'video':
      case 'presentation':
      default:
        return 'projects';
    }
  }

  private generateStoragePath(
    userId: string, 
    projectId: string, 
    fileName: string, 
    fileType: ProjectFile['file_type']
  ): string {
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Estructura de carpetas por tipo
    const folderMap = {
      'logo': `${userId}/logos`,
      'cover_image': `${userId}/${projectId}/cover-images`,
      'demo_video': `${userId}/${projectId}/demos`,
      'pitch_deck': `${userId}/${projectId}/pitch-decks`,
      'document': `${userId}/${projectId}/documents`,
      'image': `${userId}/${projectId}/media`,
      'video': `${userId}/${projectId}/media`,
      'presentation': `${userId}/${projectId}/presentations`,
      'other': `${userId}/${projectId}/files`
    };

    const folder = folderMap[fileType] || folderMap['other'];
    return `${folder}/${timestamp}_${cleanFileName}`;
  }

  async uploadFile(
    file: File, 
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Validar autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Validar permisos del proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, creator_id')
        .eq('id', options.projectId)
        .single();

      if (projectError || !project) {
        return { success: false, error: 'Proyecto no encontrado' };
      }

      // Verificar permisos (creador o miembro del equipo)
      const isCreator = project.creator_id === session.user.id;
      let isTeamMember = false;

      if (!isCreator) {
        const { data: teamMember } = await supabase
          .from('project_team_members')
          .select('id')
          .eq('project_id', options.projectId)
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        isTeamMember = !!teamMember;
      }

      if (!isCreator && !isTeamMember) {
        return { success: false, error: 'Sin permisos para subir archivos a este proyecto' };
      }

      // Determinar bucket y generar path
      const bucket = this.getBucketForFileType(options.fileType);
      const storagePath = this.generateStoragePath(
        session.user.id, 
        options.projectId, 
        file.name, 
        options.fileType
      );

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: `Error al subir archivo: ${uploadError.message}` };
      }

      // Obtener URL pública si es necesario
      let publicUrl = '';
      if (options.isPublic !== false && bucket !== 'project-documents') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);
        publicUrl = urlData.publicUrl;
      }

      // Registrar en la base de datos
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: options.projectId,
          uploader_id: session.user.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          file_type: options.fileType,
          category: options.category || 'general',
          title: options.title || file.name,
          description: options.description,
          is_public: options.isPublic !== false,
          display_order: options.displayOrder || 0,
          bucket_name: bucket,
          storage_path: storagePath,
          public_url: publicUrl || null
        })
        .select()
        .single();

      if (dbError) {
        // Limpiar archivo subido si falla el registro en DB
        await supabase.storage.from(bucket).remove([storagePath]);
        console.error('Database error:', dbError);
        return { success: false, error: `Error al registrar archivo: ${dbError.message}` };
      }

      return {
        success: true,
        url: publicUrl,
        path: uploadData.path,
        fileRecord: fileRecord as ProjectFile
      };

    } catch (error) {
      console.error('Upload service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener información del archivo
      const { data: fileRecord, error: fetchError } = await supabase
        .from('project_files')
        .select('*, projects!inner(creator_id)')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileRecord) {
        return { success: false, error: 'Archivo no encontrado' };
      }

      // Verificar permisos
      const isOwner = fileRecord.uploader_id === session.user.id;
      const isProjectCreator = fileRecord.projects.creator_id === session.user.id;

      if (!isOwner && !isProjectCreator) {
        return { success: false, error: 'Sin permisos para eliminar este archivo' };
      }

      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from(fileRecord.bucket_name)
        .remove([fileRecord.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Eliminar registro de DB
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return { success: false, error: `Error al eliminar registro: ${dbError.message}` };
      }

      return { success: true };

    } catch (error) {
      console.error('Delete service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
      console.log('🔍 Buscando archivos para proyecto:', projectId);
      
      // Primero verificar la sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Error de sesión:', sessionError);
        return [];
      }
      
      if (!session?.user) {
        console.log('⚠️ Usuario no autenticado');
        return [];
      }
      
      console.log('✅ Usuario autenticado:', session.user.id);

      // Intentar consulta simple primero
      const { data: files, error, count } = await supabase
        .from('project_files')
        .select(`
          *
        `, { count: 'exact' })
        .eq('project_id', projectId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      console.log('📊 Resultado de consulta:', { 
        count, 
        filesLength: files?.length || 0,
        error: error ? JSON.stringify(error) : 'ninguno'
      });

      if (error) {
        console.error('❌ Error detallado en consulta:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      console.log('✅ Archivos obtenidos correctamente:', files?.length || 0);
      return (files || []) as ProjectFile[];

    } catch (error) {
      console.error('❌ Error general en getProjectFiles:', error);
      return [];
    }
  }

  async updateFileInfo(
    fileId: string, 
    updates: Partial<Pick<ProjectFile, 'title' | 'description' | 'category' | 'display_order' | 'is_public'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const { error } = await supabase
        .from('project_files')
        .update(updates)
        .eq('id', fileId);

      if (error) {
        console.error('Update file error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Update file service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Helper para generar URL temporal para archivos privados
  async getSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export const projectStorageService = new ProjectStorageService();
