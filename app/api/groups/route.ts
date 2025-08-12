import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatRelativeTime } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;

    // Obtener grupos del usuario usando la función get_user_groups
    const { data: groups, error } = await supabase
      .rpc('get_user_groups', { for_user_id: userId });

    if (error) {
      console.error('Error getting groups:', error);
      return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
    }

    // Transformar los datos al formato esperado por el frontend
    const formattedGroups = groups?.map((group: any) => ({
      id: group.group_id,
      name: group.group_data?.name || 'Grupo sin nombre',
      description: group.group_data?.description || '',
      avatar: group.group_data?.name ? group.group_data.name.charAt(0).toUpperCase() : 'G',
      lastMessage: 'Grupo vacío - ¡Sé el primero en escribir!', // TODO: Implementar último mensaje del grupo
      timestamp: group.last_activity ? formatRelativeTime(group.last_activity) : 'Nuevo',
      unread: 0, // TODO: Implementar mensajes no leídos del grupo
      memberCount: group.member_count || 0,
      isPrivate: group.group_data?.isPrivate || false,
      type: 'group' as const,
      category: group.group_data?.category || 'General'
    })) || [];

    return NextResponse.json(formattedGroups);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { name, description, category, isPrivate, tags } = body;

    // Validar datos requeridos
    if (!name || !description) {
      return NextResponse.json({ error: 'Nombre y descripción son requeridos' }, { status: 400 });
    }

    // Crear el grupo
    const { data: group, error: createError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim(),
        category: category || 'General',
        is_private: isPrivate || false,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        created_by: userId
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating group:', createError);
      return NextResponse.json({ error: 'Error al crear el grupo' }, { status: 500 });
    }

    // Agregar al usuario como miembro y admin del grupo
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('Error adding user to group:', membershipError);
      // El grupo ya se creó, pero falló agregar la membresía
      return NextResponse.json({ error: 'Grupo creado pero error al agregar membresía' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Grupo creado exitosamente',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        isPrivate: group.is_private,
        tags: group.tags
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'ID de grupo requerido' }, { status: 400 });
    }

    // Verificar que el usuario sea admin del grupo o el creador
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No eres miembro de este grupo' }, { status: 403 });
    }

    // Verificar que sea admin o owner del grupo
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    // Solo el creador o admin puede eliminar el grupo
    if (group.created_by !== userId && membership.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este grupo' }, { status: 403 });
    }

    // Eliminar todos los mensajes del grupo
    const { error: messagesError } = await supabase
      .from('group_messages')
      .delete()
      .eq('group_id', groupId);

    if (messagesError) {
      console.error('Error deleting group messages:', messagesError);
    }

    // Eliminar todas las membresías del grupo
    const { error: membershipsError } = await supabase
      .from('group_memberships')
      .delete()
      .eq('group_id', groupId);

    if (membershipsError) {
      console.error('Error deleting group memberships:', membershipsError);
    }

    // Eliminar el grupo
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar grupo' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Grupo eliminado exitosamente' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
