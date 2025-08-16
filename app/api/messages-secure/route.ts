/**
 * Ejemplo de API Route Segura
 * Implementación usando el nuevo sistema de seguridad
 */

import { NextRequest } from 'next/server';
import { 
  withCompleteSecurity, 
  createSecureResponse, 
  createSecureError, 
  CommonSchemas, 
  RateLimitPresets,
  AuthenticatedRequest 
} from '@/lib/secure-api';
import { z } from 'zod';

// Schema de validación para enviar mensaje
const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  tempId: z.number().optional()
});

// Schema de validación para obtener mensajes
const getMessagesSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

// ===========================================
// POST /api/messages - Enviar mensaje
// ===========================================

export const POST = withCompleteSecurity({
  auth: true,
  validation: sendMessageSchema,
  rateLimit: RateLimitPresets.messaging,
  permissions: {
    // Verificar que el usuario tenga acceso a la conversación
    resourceCheck: async (req: AuthenticatedRequest) => {
      // Aquí verificarías que el usuario es parte de la conversación
      return true; // Por ahora permitir todo
    }
  },
  cors: true
})(async (request: any, validatedData: any) => {
  try {
    if (!validatedData) {
      return createSecureError('No data provided', 400);
    }
    
    const { conversationId, message, tempId } = validatedData;
    const authRequest = request as AuthenticatedRequest;
    
    // Crear mensaje en la base de datos (ejemplo)
    const newMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: authRequest.user.id,
      message: message,
      created_at: new Date().toISOString(),
      status: 'sent'
    };

    // TODO: Insertar en base de datos real
    // const { data, error } = await supabase
    //   .from('private_messages')
    //   .insert(newMessage)
    //   .select()
    //   .single();

    // Emitir via Socket.IO (si está disponible)
    // socket.emit('new-message', { ...newMessage, tempId });

    return createSecureResponse(
      {
        message: newMessage,
        tempId
      },
      undefined,
      undefined,
      201
    );
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    return createSecureError(
      'Failed to send message',
      500,
      'MESSAGE_SEND_FAILED'
    );
  }
});

// ===========================================
// GET /api/messages - Obtener mensajes
// ===========================================

export const GET = withCompleteSecurity({
  auth: true,
  validation: getMessagesSchema,
  rateLimit: RateLimitPresets.api,
  cors: true
})(async (request: any, validatedData: any) => {
  try {
    if (!validatedData) {
      return createSecureError('No data provided', 400);
    }
    
    const { conversationId, page, limit } = validatedData;
    const authRequest = request as AuthenticatedRequest;
    const offset = (page - 1) * limit;

    // Verificar acceso a la conversación
    // const hasAccess = await verifyConversationAccess(conversationId, authRequest.user.id);
    // if (!hasAccess) {
    //   return createSecureError('Access denied', 403, 'ACCESS_DENIED');
    // }

    // Obtener mensajes de la base de datos (ejemplo)
    const messages = [
      {
        id: '1',
        conversation_id: conversationId,
        sender_id: authRequest.user.id,
        message: 'Ejemplo de mensaje',
        created_at: new Date().toISOString(),
        status: 'delivered'
      }
    ];

    // TODO: Query real a la base de datos
    // const { data: messages, error, count } = await supabase
    //   .from('private_messages')
    //   .select('*', { count: 'exact' })
    //   .eq('conversation_id', conversationId)
    //   .order('created_at', { ascending: false })
    //   .range(offset, offset + limit - 1);

    return createSecureResponse(
      messages,
      undefined,
      undefined,
      200,
      {
        page,
        limit,
        total: messages.length,
        hasMore: false
      }
    );
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    
    return createSecureError(
      'Failed to fetch messages',
      500,
      'MESSAGE_FETCH_FAILED'
    );
  }
});
