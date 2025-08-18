import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatMadridTime } from '@/lib/timezone';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const afterId = searchParams.get('after'); // Para polling de nuevos mensajes

    // ✅ SECURE AUTHENTICATION: Use getUser() instead of getSession()
    const user = await requireAuth(request);
    const userId = user.id;

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    // Verificar que el usuario es parte de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Obtener los mensajes de la conversación (más recientes primero, luego revertir)
    let query = supabase
      .from('private_messages')
      .select(`
        id,
        sender_id,
        message,
        created_at,
        read_at,
        delivered_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }) // Más recientes primero
      .limit(50); // Limitar a los últimos 50 mensajes

    // Si hay afterId, solo obtener mensajes nuevos (para polling)
    if (afterId && !isNaN(Number(afterId))) {
      query = query.gt('id', Number(afterId));
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error getting messages:', messagesError);
      return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
    }

    // Transformar los datos al formato esperado por el frontend
    const formattedMessages = (messages || [])
      .reverse() // Revertir para orden cronológico (más antiguos primero)
      .map((msg: any) => ({
        id: msg.id,
        sender: msg.sender_id === userId ? 'me' : 'other',
        message: msg.message,
        timestamp: msg.created_at, // Mantener timestamp ISO para consistencia
        status: msg.read_at ? 'read' : (msg.delivered_at ? 'delivered' : 'sent')
      }));

    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // ✅ SECURE AUTHENTICATION: Use getUser() instead of getSession()
    const user = await requireAuth(request);
    const userId = user.id;

    const body = await request.json();
    const { conversationId, message, socketMessageId } = body;

    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: 'ID de conversación y mensaje son requeridos' }, { status: 400 });
    }

    // Verificar que el usuario es parte de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Insertar el mensaje
    const { data: newMessage, error: insertError } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
    }

    // Actualizar la conversación con el último mensaje
    const { error: updateError } = await supabase
      .rpc('update_conversation_last_message', {
        conversation_id: conversationId,
        last_msg: message.trim(),
        msg_time: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      // No devolver error, el mensaje ya se envió
    }

    const messageData = {
      id: newMessage.id,
      sender: 'me',
      message: newMessage.message,
      timestamp: newMessage.created_at, // Mantener timestamp ISO para consistencia
      status: 'sent',
      socketMessageId // Incluir ID del socket para referencia
    };

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      messageData
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
