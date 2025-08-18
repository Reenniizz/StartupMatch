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

    // Obtener conversaciones del usuario usando la función get_user_conversations
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { for_user_id: userId });

    if (error) {
      console.error('Error getting conversations:', error);
      return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 });
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
        other_user_name: displayName, // Para compatibilidad con el frontend
        company: conv.other_user_data?.company || '',
        avatar: conv.other_user_data?.firstName ? conv.other_user_data.firstName.charAt(0).toUpperCase() : 
                conv.other_user_data?.username ? conv.other_user_data.username.charAt(0).toUpperCase() : 'U',
        last_message: conv.last_message || '', // Usar last_message para consistencia con el frontend
        lastMessage: conv.last_message || 'Chat vacío - ¡Envía un mensaje!', // Mantener por compatibilidad
        last_message_time: conv.last_message_at, // Para el frontend
        timestamp: conv.last_message_at ? formatRelativeTime(conv.last_message_at) : 'Nuevo',
        unread: Number(conv.unread_count) || 0,
        online: false, // TODO: Implementar estado online
        isMatch: true, // Todas las conversaciones son matches
        type: 'individual' as const
      };
    }) || [];

    return NextResponse.json(formattedConversations);

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
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    // Verificar que el usuario sea parte de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario sea parte de la conversación
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta conversación' }, { status: 403 });
    }

    // Eliminar todos los mensajes de la conversación
    const { error: messagesError } = await supabase
      .from('private_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json({ error: 'Error al eliminar mensajes' }, { status: 500 });
    }

    // Eliminar la conversación
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar conversación' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Conversación eliminada exitosamente' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
