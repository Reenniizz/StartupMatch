import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'ID de grupo requerido' }, { status: 400 });
    }

    // Verificar que el grupo existe y es público
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, is_private')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    if (group.is_private) {
      return NextResponse.json({ error: 'No puedes unirte a un grupo privado sin invitación' }, { status: 403 });
    }

    // Verificar si el usuario ya es miembro
    const { data: existingMembership } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'Ya eres miembro de este grupo' }, { status: 400 });
    }

    // Agregar al usuario como miembro del grupo
    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('Error joining group:', membershipError);
      return NextResponse.json({ error: 'Error al unirse al grupo' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Te has unido al grupo exitosamente',
      groupName: group.name
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
