import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-utils';

/**
 * Mark messages as delivered
 * Used when user connects and receives offline messages
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // ✅ SECURE AUTHENTICATION
    const user = await requireAuth(request);
    const userId = user.id;

    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'IDs de mensajes requeridos' }, { status: 400 });
    }

    console.log(`📋 Marcando ${messageIds.length} mensajes como entregados para usuario ${userId}`);

    // Mark messages as delivered
    const { data: updatedMessages, error: updateError } = await supabase
      .from('private_messages')
      .update({ delivered_at: new Date().toISOString() })
      .in('id', messageIds)
      .neq('sender_id', userId) // Only mark messages not sent by this user
      .is('delivered_at', null) // Only mark messages not already delivered
      .select('id, conversation_id');

    if (updateError) {
      console.error('Error marking messages as delivered:', updateError);
      return NextResponse.json({ error: 'Error marcando mensajes como entregados' }, { status: 500 });
    }

    console.log(`✅ ${updatedMessages?.length || 0} mensajes marcados como entregados`);

    return NextResponse.json({ 
      success: true,
      delivered: updatedMessages?.length || 0,
      messageIds: updatedMessages?.map(m => m.id) || []
    });

  } catch (error: any) {
    console.error('Error in mark-delivered endpoint:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

/**
 * Get delivery status for messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // ✅ SECURE AUTHENTICATION
    const user = await requireAuth(request);
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    // Get delivery statistics for the conversation
    const { data: stats, error: statsError } = await supabase
      .from('private_messages')
      .select('id, delivered_at, read_at')
      .eq('conversation_id', conversationId)
      .eq('sender_id', userId); // Only user's own messages

    if (statsError) {
      console.error('Error getting delivery stats:', statsError);
      return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
    }

    const deliveryStats = {
      total: stats?.length || 0,
      delivered: stats?.filter(m => m.delivered_at).length || 0,
      read: stats?.filter(m => m.read_at).length || 0,
      pending: stats?.filter(m => !m.delivered_at).length || 0
    };

    return NextResponse.json(deliveryStats);

  } catch (error: any) {
    console.error('Error in delivery stats endpoint:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
