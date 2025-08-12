import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatMadridTime } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId'); // En este caso será el group_id
    const afterId = searchParams.get('after'); // Para polling de nuevos mensajes

    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'ID de grupo requerido' }, { status: 400 });
    }

    const userId = session.user.id;

    // Verificar que el usuario es miembro del grupo
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 });
    }

    // Obtener los mensajes del grupo
    let query = supabase
      .from('group_messages')
      .select(`
        id,
        user_id,
        message,
        created_at
      `)
      .eq('group_id', conversationId)
      .order('created_at', { ascending: true });

    // Si hay afterId, solo obtener mensajes nuevos (para polling)
    if (afterId && !isNaN(Number(afterId))) {
      query = query.gt('id', Number(afterId));
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error getting group messages:', messagesError);
      return NextResponse.json({ error: 'Error al obtener mensajes del grupo' }, { status: 500 });
    }

    // Transformar los datos al formato esperado por el frontend
    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      sender: msg.user_id === userId ? 'me' : 'other',
      message: msg.message,
      timestamp: formatMadridTime(msg.created_at),
      status: msg.user_id === userId ? 'sent' : 'delivered',
      senderName: msg.user_id === userId ? 'Tú' : 'Usuario'
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
    const { conversationId, message } = body; // conversationId será el group_id

    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ error: 'ID de grupo y mensaje son requeridos' }, { status: 400 });
    }

    // Verificar que el usuario es miembro del grupo
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 });
    }

    // Insertar el mensaje en el grupo
    const { data: newMessage, error: insertError } = await supabase
      .from('group_messages')
      .insert({
        group_id: conversationId,
        user_id: userId,
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting group message:', insertError);
      return NextResponse.json({ error: 'Error al enviar mensaje al grupo' }, { status: 500 });
    }

    // Actualizar el grupo con el último mensaje (si tienes esta funcionalidad)
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating group last message:', updateError);
      // No devolver error, el mensaje ya se envió
    }

    return NextResponse.json({
      message: 'Mensaje enviado al grupo exitosamente',
      messageData: {
        id: newMessage.id,
        sender: 'me',
        message: newMessage.message,
        timestamp: formatMadridTime(newMessage.created_at),
        status: 'sent',
        senderName: 'Tú'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
