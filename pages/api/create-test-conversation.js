// pages/api/create-test-conversation.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user1Id = 'a1089270-efec-4c4b-a97f-22bb0cd2f313';
    const user2Id = '3ba6c41a-1f33-4832-97e4-774e523fe001';
    
    console.log('🔄 API: Creando conversación entre:', user1Id, 'y', user2Id);
    
    // Verificar si ya existe una conversación
    const { data: existingConv, error: checkError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();

    if (existingConv) {
      console.log('✅ API: Conversación ya existe:', existingConv.id);
      return res.status(200).json({ 
        success: true, 
        message: 'Conversación ya existe',
        conversationId: existingConv.id,
        existing: true
      });
    }

    // Crear nueva conversación
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ API: Error creando conversación:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ API: Conversación creada:', newConv.id);
    
    // Crear algunos mensajes de prueba
    const testMessages = [
      { 
        conversation_id: newConv.id, 
        sender_id: user1Id, 
        message: '¡Hola! ¿Cómo estás?',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
      },
      { 
        conversation_id: newConv.id, 
        sender_id: user2Id, 
        message: '¡Hola! Todo bien, ¿y tú?',
        created_at: new Date(Date.now() - 3000000).toISOString() // 50 min atrás
      },
      { 
        conversation_id: newConv.id, 
        sender_id: user1Id, 
        message: 'Excelente. ¿Te interesa colaborar en un proyecto?',
        created_at: new Date(Date.now() - 2400000).toISOString() // 40 min atrás
      },
      { 
        conversation_id: newConv.id, 
        sender_id: user2Id, 
        message: 'Claro, cuéntame más detalles',
        created_at: new Date(Date.now() - 1800000).toISOString() // 30 min atrás
      }
    ];

    const { data: messages, error: msgError } = await supabase
      .from('private_messages')
      .insert(testMessages)
      .select();

    if (msgError) {
      console.error('❌ API: Error creando mensajes:', msgError);
      // No retornar error, la conversación ya está creada
    } else {
      console.log('✅ API: Mensajes de prueba creados:', messages?.length);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Conversación y mensajes creados exitosamente',
      conversationId: newConv.id,
      messagesCreated: messages?.length || 0,
      existing: false
    });
    
  } catch (error) {
    console.error('❌ API: Error general:', error);
    res.status(500).json({ error: error.message });
  }
}
