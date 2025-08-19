import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatMadridTime } from '@/lib/timezone';
import { secureAuthService } from '@/lib/auth-security';
import { inputValidationService } from '@/lib/input-validation';
import { rateLimit } from '@/lib/rate-limiting';
import { sanitizeInput } from '@/lib/xss-protection';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { z } from 'zod';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

// Schema de validación para parámetros de query
const QuerySchema = z.object({
  conversationId: z.string().min(1, 'ID de conversación requerido'),
  after: z.string().optional().transform(val => {
    if (!val) return undefined;
    const parsed = parseInt(val);
    return isNaN(parsed) ? undefined : parsed;
  })
});

// Schema de validación para envío de mensajes
const MessageCreateSchema = z.object({
  conversationId: z.string().min(1, 'ID de conversación requerido'),
  message: z.string().min(1, 'Mensaje requerido').max(2000, 'Mensaje muy largo'),
  socketMessageId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkLimit(clientIP, 'api_messages_get', 300, 60000);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded for messages GET API', {
        source: 'messages_api',
        ip: clientIP,
        endpoint: '/api/private-messages'
      });
      
      return NextResponse.json({
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter || 60
      }, { 
        status: 429,
        headers: {
          ...getAPISecurityHeaders(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      });
    }

    // 2. Validación de entrada
    const { searchParams } = new URL(request.url);
    const queryData = {
      conversationId: searchParams.get('conversationId'),
      after: searchParams.get('after')
    };

    const validation = inputValidationService.validate(queryData, QuerySchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input in messages GET API', {
        source: 'messages_api',
        errors: validation.errors,
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Parámetros de entrada inválidos',
        code: 'INVALID_INPUT',
        details: validation.errors
      }, { 
        status: 400,
        headers: getAPISecurityHeaders()
      });
    }

    const { conversationId, after } = validation.sanitizedData;

    // 3. Autenticación
    let authContext;
    try {
      authContext = await secureAuthService.verifyAuth(request);
      if (!authContext.user) {
        throw new Error('Usuario no autenticado');
      }
    } catch (authError) {
      logSecurityEvent('auth', 'medium', 'Authentication failed in messages GET API', {
        source: 'messages_api',
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Autenticación requerida',
        code: 'UNAUTHORIZED'
      }, { 
        status: 401,
        headers: getAPISecurityHeaders()
      });
    }

    const userId = authContext.user.id;

    // 4. Verificar que el usuario es parte de la conversación
    const supabase = await createSupabaseServer();
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      logSecurityEvent('threat', 'medium', 'Unauthorized conversation access attempt', {
        source: 'messages_api',
        conversationId,
        userId,
        ip: clientIP
      });
      
      return NextResponse.json({ 
        error: 'Conversación no encontrada',
        code: 'NOT_FOUND'
      }, { 
        status: 404,
        headers: getAPISecurityHeaders()
      });
    }

    // 5. Obtener los mensajes de la conversación
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
      .order('created_at', { ascending: false })
      .limit(50);

    // Si hay afterId, solo obtener mensajes nuevos (para polling)
    if (after && !isNaN(after)) {
      query = query.gt('id', after);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      logSecurityEvent('system', 'medium', 'Database error getting messages', {
        source: 'messages_api',
        error: messagesError.message,
        ip: clientIP,
        conversationId
      });
      
      return NextResponse.json({ 
        error: 'Error al obtener mensajes',
        code: 'DATABASE_ERROR'
      }, { 
        status: 500,
        headers: getAPISecurityHeaders()
      });
    }

    // 6. Transformar y sanitizar los datos
    const formattedMessages = (messages || [])
      .reverse() // Revertir para orden cronológico (más antiguos primero)
      .map((msg: any) => ({
        id: msg.id,
        sender: msg.sender_id === userId ? 'me' : 'other',
        message: sanitizeInput(msg.message, 'html'), // Sanitizar contenido del mensaje
        timestamp: msg.created_at,
        status: msg.read_at ? 'read' : (msg.delivered_at ? 'delivered' : 'sent')
      }));

    // 7. Log de acceso exitoso
    logSecurityEvent('system', 'low', 'Messages GET API accessed successfully', {
      source: 'messages_api',
      conversationId,
      userId,
      messagesCount: formattedMessages.length,
      ip: clientIP
    });

    return NextResponse.json(formattedMessages, { 
      headers: getAPISecurityHeaders()
    });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error in messages GET API', {
      source: 'messages_api',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: getAPISecurityHeaders()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting más restrictivo para envío de mensajes
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkLimit(clientIP, 'api_messages_create', 50, 60000);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded for messages POST API', {
        source: 'messages_api',
        ip: clientIP,
        endpoint: '/api/private-messages'
      });
      
      return NextResponse.json({
        error: 'Demasiados mensajes. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter || 60
      }, { 
        status: 429,
        headers: {
          ...getAPISecurityHeaders(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      });
    }

    // 2. Autenticación
    let authContext;
    try {
      authContext = await secureAuthService.verifyAuth(request);
      if (!authContext.user) {
        throw new Error('Usuario no autenticado');
      }
    } catch (authError) {
      logSecurityEvent('auth', 'medium', 'Authentication failed in messages POST API', {
        source: 'messages_api',
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Autenticación requerida',
        code: 'UNAUTHORIZED'
      }, { 
        status: 401,
        headers: getAPISecurityHeaders()
      });
    }

    const userId = authContext.user.id;

    // 3. Validación de entrada
    const body = await request.json();
    
    const validation = inputValidationService.validate(body, MessageCreateSchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input in messages POST API', {
        source: 'messages_api',
        errors: validation.errors,
        ip: clientIP,
        userId
      });
      
      return NextResponse.json({ 
        error: 'Datos del mensaje inválidos',
        code: 'INVALID_INPUT',
        details: validation.errors
      }, { 
        status: 400,
        headers: getAPISecurityHeaders()
      });
    }

    const { conversationId, message, socketMessageId } = validation.sanitizedData;

    // 4. Verificar que el usuario es parte de la conversación
    const supabase = await createSupabaseServer();
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      logSecurityEvent('threat', 'medium', 'Unauthorized conversation access attempt in POST', {
        source: 'messages_api',
        conversationId,
        userId,
        ip: clientIP
      });
      
      return NextResponse.json({ 
        error: 'Conversación no encontrada',
        code: 'NOT_FOUND'
      }, { 
        status: 404,
        headers: getAPISecurityHeaders()
      });
    }

    // 5. Sanitizar el mensaje antes de insertarlo
    const sanitizedMessage = sanitizeInput(message.trim(), 'html');

    // 6. Insertar el mensaje
    const { data: newMessage, error: insertError } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: sanitizedMessage,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      logSecurityEvent('system', 'medium', 'Database error inserting message', {
        source: 'messages_api',
        error: insertError.message,
        ip: clientIP,
        conversationId,
        userId
      });
      
      return NextResponse.json({ 
        error: 'Error al enviar mensaje',
        code: 'DATABASE_ERROR'
      }, { 
        status: 500,
        headers: getAPISecurityHeaders()
      });
    }

    // 7. Actualizar la conversación con el último mensaje
    const { error: updateError } = await supabase
      .rpc('update_conversation_last_message', {
        conversation_id: conversationId,
        last_msg: sanitizedMessage,
        msg_time: new Date().toISOString()
      });

    if (updateError) {
      logSecurityEvent('system', 'low', 'Error updating conversation last message', {
        source: 'messages_api',
        error: updateError.message,
        ip: clientIP,
        conversationId,
        userId
      });
      // No devolver error, el mensaje ya se envió
    }

    const messageData = {
      id: newMessage.id,
      sender: 'me',
      message: sanitizedMessage,
      timestamp: newMessage.created_at,
      status: 'sent',
      socketMessageId
    };

    // 8. Log de envío exitoso
    logSecurityEvent('system', 'low', 'Message sent successfully', {
      source: 'messages_api',
      messageId: newMessage.id,
      conversationId,
      userId,
      ip: clientIP
    });

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      messageData
    }, { 
      headers: getAPISecurityHeaders()
    });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error in messages POST API', {
      source: 'messages_api',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: getAPISecurityHeaders()
    });
  }
}
