import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';

/**
 * Mark messages as read
 * Used when user opens/views messages in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // ✅ SECURE AUTHENTICATION
    const user = await requireAuth(request);
    const userId = user.id;

    const body = await request.json();
    const { conversationId, messageIds } = body;

    if (!conversationId && (!messageIds || !Array.isArray(messageIds))) {
      return NextResponse.json({ 
        error: 'ID de conversación o IDs de mensajes requeridos' 
      }, { status: 400 });
    }

    let query = supabase
      .from('private_messages')
      .update({ read_at: new Date().toISOString() })
      .neq('sender_id', userId) // Only mark messages not sent by this user
      .is('read_at', null); // Only mark unread messages

    // Mark specific messages or all messages in conversation
    if (messageIds && messageIds.length > 0) {
      query = query.in('id', messageIds);
      console.log(`📖 Marcando ${messageIds.length} mensajes específicos como leídos para usuario ${userId}`);
    } else if (conversationId) {
      query = query.eq('conversation_id', conversationId);
      console.log(`📖 Marcando todos los mensajes no leídos como leídos en conversación ${conversationId} para usuario ${userId}`);
    }

    const { data: updatedMessages, error: updateError } = await query
      .select('id, conversation_id, sender_id');

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Error marcando mensajes como leídos' }, { status: 500 });
    }

    const readCount = updatedMessages?.length || 0;
    console.log(`✅ ${readCount} mensajes marcados como leídos`);

    return NextResponse.json({ 
      success: true,
      read: readCount,
      messageIds: updatedMessages?.map(m => m.id) || [],
      conversationId
    });

  } catch (error: any) {
    console.error('Error in mark-read endpoint:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

/**
 * Get read status for messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // ✅ SECURE AUTHENTICATION
    const user = await requireAuth(request);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');

    if (!conversationId && !messageId) {
      return NextResponse.json({ 
        error: 'ID de conversación o mensaje requerido' 
      }, { status: 400 });
    }

    let query = supabase
      .from('private_messages')
      .select('id, delivered_at, read_at, sender_id, created_at');

    if (messageId) {
      query = query.eq('id', messageId);
    } else if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data: messages, error: queryError } = await query;

    if (queryError) {
      console.error('Error getting read status:', queryError);
      return NextResponse.json({ error: 'Error obteniendo estado de lectura' }, { status: 500 });
    }

    // Calculate read statistics
    const readStats = {
      total: messages?.length || 0,
      sent: messages?.filter(m => m.sender_id === userId).length || 0,
      received: messages?.filter(m => m.sender_id !== userId).length || 0,
      delivered: messages?.filter(m => m.delivered_at && m.sender_id === userId).length || 0,
      read: messages?.filter(m => m.read_at && m.sender_id === userId).length || 0,
      unread: messages?.filter(m => !m.read_at && m.sender_id !== userId).length || 0
    };

    return NextResponse.json({
      stats: readStats,
      messages: messages?.map(m => ({
        id: m.id,
        status: m.sender_id === userId ? 
          (m.read_at ? 'read' : m.delivered_at ? 'delivered' : 'sent') : 
          (m.read_at ? 'read' : 'unread'),
        delivered_at: m.delivered_at,
        read_at: m.read_at,
        created_at: m.created_at,
        is_own: m.sender_id === userId
      }))
    });

  } catch (error: any) {
    console.error('Error in read status endpoint:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
