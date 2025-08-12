import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatRelativeTime } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Primero obtener todos los grupos públicos
    let query = supabase
      .from('groups')
      .select('*')
      .eq('is_private', false); // Solo grupos públicos para descubrimiento

    // Filtro por categoría si se especifica
    if (category && category !== 'Todos') {
      query = query.eq('category', category);
    }

    // Filtro por búsqueda si se especifica
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: publicGroups, error } = await query;

    if (error) {
      console.error('Error getting public groups:', error);
      return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
    }

    // También obtener grupos donde el usuario es miembro (incluso si son privados)
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('groups')
      .select(`
        *,
        group_memberships!inner(user_id)
      `)
      .eq('group_memberships.user_id', userId);

    if (userGroupsError) {
      console.error('Error getting user groups:', userGroupsError);
    }

    // Combinar grupos públicos y grupos del usuario, evitando duplicados
    const allGroups = [...(publicGroups || [])];
    if (userGroups) {
      userGroups.forEach(userGroup => {
        if (!allGroups.find(g => g.id === userGroup.id)) {
          allGroups.push(userGroup);
        }
      });
    }

    // Obtener estadísticas para cada grupo
    const groupsWithStats = await Promise.all(
      allGroups.map(async (group) => {
        // Contar miembros del grupo
        const { count: memberCount } = await supabase
          .from('group_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Verificar si el usuario actual es miembro
        const { data: userMembership } = await supabase
          .from('group_memberships')
          .select('role')
          .eq('group_id', group.id)
          .eq('user_id', userId)
          .single();

        // Obtener actividad reciente (último mensaje o creación)
        const { data: lastMessage } = await supabase
          .from('group_messages')
          .select('created_at')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const lastActivity = lastMessage?.created_at || group.created_at;

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          category: group.category,
          memberCount: memberCount || 0,
          messagesCount: 0, // TODO: Implementar si es necesario
          isPrivate: group.is_private,
          coverImage: 'default',
          lastActivity: formatRelativeTime(lastActivity),
          tags: group.tags || [],
          recentMembers: [], // TODO: Implementar si es necesario
          isMember: !!userMembership,
          isVerified: group.is_verified || false,
          type: 'group' as const,
          isCreator: group.created_by === userId,
          userRole: userMembership?.role || null
        };
      })
    );

    return NextResponse.json(groupsWithStats);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
