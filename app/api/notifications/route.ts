import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
    }

    // Obtener el conteo de notificaciones no leídas
    const { data: unreadCount, error: countError } = await supabase
      .rpc('get_unread_notifications_count', { user_uuid: user.id });

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      count: notifications?.length || 0,
      unread_count: unreadCount || 0
    });

  } catch (error) {
    console.error('Error in GET notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Marcar notificaciones como leídas
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body;

    let result;

    if (mark_all) {
      // Marcar todas las notificaciones como leídas
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read', { user_uuid: user.id });

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Error al marcar notificaciones como leídas' }, { status: 500 });
      }

      result = { updated_count: data };
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Marcar notificaciones específicas como leídas
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', notification_ids)
        .eq('user_id', user.id)
        .select('id');

      if (error) {
        console.error('Error marking specific notifications as read:', error);
        return NextResponse.json({ error: 'Error al marcar notificaciones como leídas' }, { status: 500 });
      }

      result = { updated_notifications: data };
    } else {
      return NextResponse.json({ error: 'Se requiere notification_ids o mark_all' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error in POST notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificaciones
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada correctamente'
    });

  } catch (error) {
    console.error('Error in DELETE notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
