import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { groupId } = await params; // ✅ Await params antes de usar

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es miembro del grupo antes de mostrar la lista de miembros
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 });
    }

    // Obtener miembros del grupo con información de perfil
    const { data: members, error } = await supabase
      .from('group_memberships')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error getting group members:', error);
      return NextResponse.json({ error: 'Error al obtener miembros' }, { status: 500 });
    }

    // Obtener información de perfiles por separado si existe la tabla
    let membersWithProfiles = members || [];
    
    if (members && members.length > 0) {
      // Intentar obtener perfiles (puede no existir la tabla)
      try {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        // Combinar datos de membresía con perfiles
        membersWithProfiles = members.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id);
          return {
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            joined_at: member.joined_at,
            profile: profile ? {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            } : null
          };
        });
      } catch (profileError) {
        // Si no existe la tabla profiles, usar datos básicos
        console.log('Profiles table not found, using basic member data');
        membersWithProfiles = members.map(member => ({
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          profile: null
        }));
      }
    }

    return NextResponse.json(membersWithProfiles);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
