import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener grupos más populares (por número de miembros) y activos
    const { data: popularGroups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        category,
        is_private,
        is_verified,
        created_at
      `)
      .eq('is_private', false) // Solo grupos públicos para mostrar como populares
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error getting popular groups:', error);
      return NextResponse.json({ error: 'Error al obtener grupos populares' }, { status: 500 });
    }

    if (!popularGroups || popularGroups.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener estadísticas para cada grupo
    const groupsWithStats = await Promise.all(
      popularGroups.slice(0, 3).map(async (group) => {
        // Contar miembros
        const { count: memberCount } = await supabase
          .from('group_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Verificar si el usuario actual es miembro
        const { data: userMembership } = await supabase
          .from('group_memberships')
          .select('role')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .single();

        // Contar mensajes recientes (últimos 7 días)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: recentMessages } = await supabase
          .from('group_messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .gte('created_at', oneWeekAgo.toISOString());

        // Crear iniciales del grupo
        const initials = group.name.split(' ')
          .map((word: string) => word.charAt(0))
          .join('')
          .substring(0, 2)
          .toUpperCase();

        // Determinar gradiente basado en categoría
        const getCategoryGradient = (category: string) => {
          const gradients = {
            'Industria': 'from-emerald-500 to-teal-600',
            'Tecnología': 'from-purple-500 to-indigo-600',
            'Inversión': 'from-green-500 to-emerald-600',
            'Stage': 'from-orange-500 to-red-600',
            'Ubicación': 'from-blue-500 to-cyan-600',
            'Comunidad': 'from-pink-500 to-rose-600'
          };
          return gradients[category as keyof typeof gradients] || 'from-slate-500 to-gray-600';
        };

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          category: group.category,
          memberCount: memberCount || 0,
          recentMessages: recentMessages || 0,
          isMember: !!userMembership,
          isVerified: group.is_verified,
          initials,
          gradient: getCategoryGradient(group.category),
          status: userMembership ? 'Miembro' : (recentMessages && recentMessages > 0 ? 'Activo' : 'Unirse')
        };
      })
    );

    return NextResponse.json(groupsWithStats);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
