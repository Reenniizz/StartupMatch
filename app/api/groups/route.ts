import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatRelativeTime } from '@/lib/timezone';
import { secureAuthService } from '@/lib/auth-security';
import { rateLimit } from '@/lib/rate-limiting';
import { inputValidationService } from '@/lib/input-validation';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PostSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  category: z.string().optional(),
  isPrivate: z.boolean().optional(),
  tags: z.string().optional()
});

const DeleteQuerySchema = z.object({
  groupId: z.string().min(1, 'ID de grupo requerido')
});

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_groups_get', 200, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on groups GET', { source: 'groups', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const userId = user.id;

    // Obtener grupos del usuario usando la función get_user_groups
    const { data: groups, error } = await supabase
      .rpc('get_user_groups', { for_user_id: userId });

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error getting groups', { source: 'groups', error: error.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    // Transformar los datos al formato esperado por el frontend
    const formattedGroups = groups?.map((group: any) => ({
      id: group.group_id,
      name: group.group_data?.name || 'Grupo sin nombre',
      description: group.group_data?.description || '',
      avatar: group.group_data?.name ? group.group_data.name.charAt(0).toUpperCase() : 'G',
      lastMessage: 'Grupo vacío - ¡Sé el primero en escribir!',
      timestamp: group.last_activity ? formatRelativeTime(group.last_activity) : 'Nuevo',
      unread: 0,
      memberCount: group.member_count || 0,
      isPrivate: group.group_data?.isPrivate || false,
      type: 'group' as const,
      category: group.group_data?.category || 'General'
    })) || [];

    logSecurityEvent('system', 'low', 'Groups GET success', { source: 'groups', userId, count: formattedGroups.length, ip: clientIP });

    return NextResponse.json(formattedGroups, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error groups GET', { source: 'groups', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_groups_post', 50, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on groups POST', { source: 'groups', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const userId = user.id;
    const body = await request.json();
    
    // Validar body
    const validation = inputValidationService.validate(body, PostSchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input for groups POST', { source: 'groups', errors: validation.errors, ip: clientIP, userId });
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const { name, description, category, isPrivate, tags } = validation.sanitizedData;

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
      logSecurityEvent('system', 'medium', 'DB error creating group', { source: 'groups', error: createError.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al crear el grupo' }, { status: 500, headers: getAPISecurityHeaders() });
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
      logSecurityEvent('system', 'medium', 'DB error adding user to group', { source: 'groups', error: membershipError.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Grupo creado pero error al agregar membresía' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    logSecurityEvent('system', 'low', 'Group created successfully', { source: 'groups', userId, groupId: group.id, ip: clientIP });

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
    }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error groups POST', { source: 'groups', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_groups_delete', 20, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on groups DELETE', { source: 'groups', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const queryData = { groupId: searchParams.get('groupId') || '' };
    
    // Validar query params
    const validation = inputValidationService.validate(queryData, DeleteQuerySchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const groupId = validation.sanitizedData.groupId;

    // Verificar que el usuario sea admin del grupo o el creador
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No eres miembro de este grupo' }, { status: 403, headers: getAPISecurityHeaders() });
    }

    // Verificar que sea admin o owner del grupo
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404, headers: getAPISecurityHeaders() });
    }

    // Solo el creador o admin puede eliminar el grupo
    if (group.created_by !== userId && membership.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este grupo' }, { status: 403, headers: getAPISecurityHeaders() });
    }

    // Eliminar todos los mensajes del grupo
    const { error: messagesError } = await supabase
      .from('group_messages')
      .delete()
      .eq('group_id', groupId);

    if (messagesError) {
      logSecurityEvent('system', 'low', 'Error deleting group messages', { source: 'groups', error: messagesError.message, ip: clientIP, userId });
    }

    // Eliminar todas las membresías del grupo
    const { error: membershipsError } = await supabase
      .from('group_memberships')
      .delete()
      .eq('group_id', groupId);

    if (membershipsError) {
      logSecurityEvent('system', 'low', 'Error deleting group memberships', { source: 'groups', error: membershipsError.message, ip: clientIP, userId });
    }

    // Eliminar el grupo
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      logSecurityEvent('system', 'medium', 'DB error deleting group', { source: 'groups', error: deleteError.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al eliminar grupo' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    logSecurityEvent('system', 'low', 'Group deleted successfully', { source: 'groups', userId, groupId, ip: clientIP });

    return NextResponse.json({ message: 'Grupo eliminado exitosamente' }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error groups DELETE', { source: 'groups', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}
