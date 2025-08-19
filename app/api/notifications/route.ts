import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { secureAuthService } from '@/lib/auth-security';
import { rateLimit } from '@/lib/rate-limiting';
import { inputValidationService } from '@/lib/input-validation';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GetSchema = z.object({
  limit: z.string().optional(),
  unread_only: z.string().optional()
});

const PostSchema = z.object({
  notification_ids: z.array(z.string()).optional(),
  mark_all: z.boolean().optional()
}).refine(d => d.mark_all === true || (Array.isArray(d.notification_ids) && d.notification_ids.length > 0), {
  message: 'Se requiere notification_ids o mark_all'
});

const DeleteSchema = z.object({ id: z.string().min(1) });

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_notifications_get', 200, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const url = new URL(request.url);
    const query = { limit: url.searchParams.get('limit'), unread_only: url.searchParams.get('unread_only') };
    const validation = inputValidationService.validate(query, GetSchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const limit = Math.min(Math.max(parseInt(validation.sanitizedData.limit || '20') || 20, 1), 100);
    const unreadOnly = validation.sanitizedData.unread_only === 'true';

    let queryBuilder = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      queryBuilder = queryBuilder.is('read_at', null);
    }

    const { data: notifications, error } = await queryBuilder;

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error fetching notifications', { source: 'notifications', error: error.message, ip: clientIP, userId: user.id });
      return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    const { data: unreadCount } = await supabase
      .rpc('get_unread_notifications_count', { user_uuid: user.id });

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      count: notifications?.length || 0,
      unread_count: unreadCount || 0
    }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error notifications GET', { source: 'notifications', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

// POST - Marcar notificaciones como leídas
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_notifications_post', 100, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const body = await request.json();
    const validation = inputValidationService.validate(body, PostSchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    let result;

    if (validation.sanitizedData.mark_all) {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read', { user_uuid: user.id });

      if (error) {
        logSecurityEvent('system', 'medium', 'DB error mark all notifications', { source: 'notifications', error: error.message, ip: clientIP, userId: user.id });
        return NextResponse.json({ error: 'Error al marcar notificaciones como leídas' }, { status: 500, headers: getAPISecurityHeaders() });
      }

      result = { updated_count: data };
    } else if (validation.sanitizedData.notification_ids) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', validation.sanitizedData.notification_ids)
        .eq('user_id', user.id)
        .select('id');

      if (error) {
        logSecurityEvent('system', 'medium', 'DB error mark specific notifications', { source: 'notifications', error: error.message, ip: clientIP, userId: user.id });
        return NextResponse.json({ error: 'Error al marcar notificaciones como leídas' }, { status: 500, headers: getAPISecurityHeaders() });
      }

      result = { updated_notifications: data };
    } else {
      return NextResponse.json({ error: 'Se requiere notification_ids o mark_all' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    return NextResponse.json({ success: true, ...result }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error notifications POST', { source: 'notifications', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

// DELETE - Eliminar notificaciones
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_notifications_delete', 50, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const url = new URL(request.url);
    const params = { id: url.searchParams.get('id') || '' };
    const validation = inputValidationService.validate(params, DeleteSchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', validation.sanitizedData.id)
      .eq('user_id', user.id);

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error deleting notification', { source: 'notifications', error: error.message, ip: clientIP, userId: user.id });
      return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    return NextResponse.json({ success: true, message: 'Notificación eliminada correctamente' }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error notifications DELETE', { source: 'notifications', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}
