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

const DeleteQuerySchema = z.object({
  conversationId: z.string().min(1, 'ID de conversación requerido')
});

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_conversations_get', 200, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on conversations GET', { source: 'conversations', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Verificar autenticación usando getUser() que es más seguro
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    const userId = user.id;

    // Obtener conversaciones del usuario usando la función get_user_conversations
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { for_user_id: userId });

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error getting conversations', { source: 'conversations', error: error.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    // Transformar los datos al formato esperado por el frontend
    const formattedConversations = conversations?.map((conv: any) => {
      // Priorizar username, luego firstName + lastName
      let displayName = '';
      if (conv.other_user_data?.username) {
        displayName = `@${conv.other_user_data.username}`;
      } else {
        const fullName = `${conv.other_user_data?.firstName || ''} ${conv.other_user_data?.lastName || ''}`.trim();
        displayName = fullName || 'Usuario Desconocido';
      }

      return {
        id: conv.conversation_id,
        name: displayName,
        other_user_name: displayName,
        company: conv.other_user_data?.company || '',
        avatar: conv.other_user_data?.firstName ? conv.other_user_data.firstName.charAt(0).toUpperCase() : 
                conv.other_user_data?.username ? conv.other_user_data.username.charAt(0).toUpperCase() : 'U',
        last_message: conv.last_message || '',
        lastMessage: conv.last_message || 'Chat vacío - ¡Envía un mensaje!',
        last_message_time: conv.last_message_at,
        timestamp: conv.last_message_at ? formatRelativeTime(conv.last_message_at) : 'Nuevo',
        unread: Number(conv.unread_count) || 0,
        online: false,
        isMatch: true,
        type: 'individual' as const
      };
    }) || [];

    logSecurityEvent('system', 'low', 'Conversations GET success', { source: 'conversations', userId, count: formattedConversations.length, ip: clientIP });

    return NextResponse.json(formattedConversations, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error conversations GET', { source: 'conversations', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_conversations_delete', 20, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on conversations DELETE', { source: 'conversations', ip: clientIP });
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
    const queryData = { conversationId: searchParams.get('conversationId') || '' };
    
    // Validar query params
    const validation = inputValidationService.validate(queryData, DeleteQuerySchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const conversationId = validation.sanitizedData.conversationId;

    // Verificar que el usuario sea parte de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404, headers: getAPISecurityHeaders() });
    }

    // Verificar que el usuario sea parte de la conversación
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta conversación' }, { status: 403, headers: getAPISecurityHeaders() });
    }

    // Eliminar todos los mensajes de la conversación
    const { error: messagesError } = await supabase
      .from('private_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      logSecurityEvent('system', 'medium', 'DB error deleting messages', { source: 'conversations', error: messagesError.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al eliminar mensajes' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    // Eliminar la conversación
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      logSecurityEvent('system', 'medium', 'DB error deleting conversation', { source: 'conversations', error: deleteError.message, ip: clientIP, userId });
      return NextResponse.json({ error: 'Error al eliminar conversación' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    logSecurityEvent('system', 'low', 'Conversation deleted successfully', { source: 'conversations', userId, conversationId, ip: clientIP });

    return NextResponse.json({ message: 'Conversación eliminada exitosamente' }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error conversations DELETE', { source: 'conversations', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}
