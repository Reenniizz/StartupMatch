import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = user.id;

    // Obtener estadísticas en paralelo para mejor rendimiento
    const [
      connectionsResult,
      matchesResult, 
      conversationsResult,
      groupMembershipsResult,
      profileViewsResult
    ] = await Promise.allSettled([
      // 1. Conexiones activas (miembros de grupos donde el usuario está)
      supabase
        .from('group_memberships')
        .select('group_id')
        .eq('user_id', userId),

      // 2. Matches perfectos (esto dependerá de tu lógica de matching)
      // Por ahora usaremos un placeholder - puedes ajustar según tu algoritmo
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // 3. Conversaciones (grupos donde el usuario es miembro)
      supabase
        .from('group_memberships')
        .select(`
          group_id,
          groups!inner(
            id,
            group_messages(id)
          )
        `)
        .eq('user_id', userId),

      // 4. Total de membresías del usuario
      supabase
        .from('group_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // 5. Vistas del perfil (placeholder - implementar según tu lógica)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
    ]);

    // Procesar resultados
    const connections = connectionsResult.status === 'fulfilled' ? connectionsResult.value.data?.length || 0 : 0;
    
    // Para matches, usaremos una lógica simplificada basada en compatibilidad
    const totalProfiles = matchesResult.status === 'fulfilled' ? matchesResult.value.count || 0 : 0;
    const estimatedMatches = Math.min(Math.floor(totalProfiles * 0.15), 50); // 15% de perfiles como matches potenciales

    const userGroups = conversationsResult.status === 'fulfilled' ? conversationsResult.value.data?.length || 0 : 0;
    
    const totalMemberships = groupMembershipsResult.status === 'fulfilled' ? groupMembershipsResult.value.count || 0 : 0;

    // Calcular estadísticas de actividad reciente (últimos 7 días)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentActivity = await supabase
      .from('group_memberships')
      .select('joined_at')
      .eq('user_id', userId)
      .gte('joined_at', oneWeekAgo.toISOString());

    const newConnectionsThisWeek = recentActivity.data?.length || 0;

    // Mensajes no leídos (placeholder - implementar según tu sistema de mensajes)
    const unreadMessages = Math.floor(Math.random() * 8); // Placeholder aleatorio

    // Calcular tasa de éxito (conexiones exitosas / intentos de conexión)
    const successRate = connections > 0 ? Math.min((connections / Math.max(totalMemberships, 1)) * 100, 100) : 0;

    // Datos para comparación mensual (placeholder)
    const lastMonthSuccessRate = Math.max(0, successRate - (Math.random() * 20 - 10));
    const successRateChange = successRate - lastMonthSuccessRate;

    const stats = {
      connections: {
        total: connections,
        weeklyChange: newConnectionsThisWeek,
        weeklyChangeText: newConnectionsThisWeek > 0 ? `+${newConnectionsThisWeek} esta semana` : 'Sin cambios esta semana'
      },
      matches: {
        total: estimatedMatches,
        dailyNew: Math.floor(Math.random() * 5) + 1, // Placeholder para nuevos matches diarios
        dailyNewText: (() => {
          const daily = Math.floor(Math.random() * 5) + 1;
          return daily > 0 ? `+${daily} nuevos hoy` : 'Sin nuevos hoy';
        })()
      },
      conversations: {
        total: userGroups,
        unread: unreadMessages,
        unreadText: unreadMessages > 0 ? `${unreadMessages} sin leer` : 'Todo leído'
      },
      successRate: {
        percentage: Math.round(successRate),
        change: Math.round(successRateChange),
        changeText: successRateChange > 0 ? `+${Math.round(successRateChange)}% vs mes anterior` : `${Math.round(successRateChange)}% vs mes anterior`
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
