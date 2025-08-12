import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatMadridTime } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const afterId = searchParams.get('after'); // Para polling de nuevos mensajes

    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de conversación requerido' }, { status: 400 });
    }

    const userId = session.user.id;

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

    // Obtener los mensajes de la conversación
    let query = supabase
      .from('private_messages')
      .select(`
        id,
        sender_id,
        message,
        created_at,
        read_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

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
    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      sender: msg.sender_id === userId ? 'me' : 'other',
      message: msg.message,
      timestamp: formatMadridTime(msg.created_at),
      status: msg.sender_id === userId ? 'sent' : 'delivered' // TODO: Implementar estados reales
    })) || [];

    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { conversationId, message } = body;

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

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      messageData: {
        id: newMessage.id,
        sender: 'me',
        message: newMessage.message,
        timestamp: formatMadridTime(newMessage.created_at),
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
