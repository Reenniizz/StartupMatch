import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id]/files - Obtener archivos del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    
    // Obtener archivos del proyecto
    const { data: files, error } = await supabase
      .from('project_files')
      .select(`
        *,
        uploader:user_profiles!uploader_id(
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('project_id', params.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    // Filtrar archivos privados si no hay autenticación
    let filteredFiles = files;
    if (!session?.user) {
      filteredFiles = files.filter(file => file.is_public);
    }

    return NextResponse.json({ files: filteredFiles });

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/files/[fileId] - Eliminar archivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener información del archivo
    const { data: fileRecord, error: fetchError } = await supabase
      .from('project_files')
      .select(`
        *,
        project:projects!inner(creator_id)
      `)
      .eq('id', fileId)
      .eq('project_id', params.id)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Verificar permisos
    const isUploader = fileRecord.uploader_id === session.user.id;
    const isProjectCreator = fileRecord.project.creator_id === session.user.id;

    if (!isUploader && !isProjectCreator) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from(fileRecord.bucket_name)
      .remove([fileRecord.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
