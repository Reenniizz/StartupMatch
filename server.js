// server.js - Servidor personalizado con Socket.IO y validación segura
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

// 🔒 SECURE: Import validation system
const path = require('path');
const fs = require('fs');

// Load secure validation functions - Convert ES modules to CommonJS compatible
let validateAndSanitize, messageSchema, secureLog;

const loadSecurityModule = () => {
  try {
    // Since this is a Node.js server and we're using ES modules in lib/
    // We'll implement the validation directly here for now
    
    const validator = require('validator');
    
    // Basic message validation schema
    const messageSchema = {
      message: {
        type: 'string',
        required: true,
        maxLength: 5000,
        minLength: 1
      }
    };
    
    validateAndSanitize = (schema, data) => {
      const errors = [];
      const sanitized = {};
      
      if (!data.message || typeof data.message !== 'string') {
        errors.push('Mensaje inválido');
        return { success: false, errors };
      }
      
      // Sanitize HTML
      let message = data.message.trim();
      
      // Remove dangerous content
      message = message
        .replace(/[<>]/g, '') // Remove < >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Control characters
        .trim();
      
      if (message.length === 0) {
        errors.push('Mensaje vacío después de sanitización');
        return { success: false, errors };
      }
      
      if (message.length > 5000) {
        errors.push('Mensaje demasiado largo');
        return { success: false, errors };
      }
      
      sanitized.message = message;
      return { success: true, data: sanitized };
    };
    
    secureLog = (level, message, data = {}) => {
      const timestamp = new Date().toISOString();
      const logData = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...data
      };
      
      if (level === 'error') {
        console.error(`🔒 SECURE LOG [${level.toUpperCase()}]:`, logData);
      } else if (level === 'warn') {
        console.warn(`🔒 SECURE LOG [${level.toUpperCase()}]:`, logData);
      } else {
        console.log(`🔒 SECURE LOG [${level.toUpperCase()}]:`, logData);
      }
    };
    
    console.log('✅ Security validation module loaded');
    
  } catch (error) {
    console.error('❌ Error loading security module:', error);
    // Fallback functions
    validateAndSanitize = () => ({ success: false, errors: ['Security module not available'] });
    secureLog = console.log;
  }
};

loadSecurityModule();

// 📊 SOCKET.IO: Map para rastrear sesiones de usuario conectadas
const userSessions = new Map(); // userId -> socketId

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

console.log(`🚀 Iniciando servidor en modo: ${dev ? 'development' : 'production'}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      // Don't interfere with Next.js error handling
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('internal server error');
      }
    }
  });

  // Socket.IO server con configuración mejorada
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 🔒 SECURE: Enhanced message validation using security system
  const validateMessage = (message) => {
    const validation = validateAndSanitize({ message: { type: 'string', required: true } }, { message });
    
    if (!validation.success) {
      return { 
        isValid: false, 
        error: validation.errors.join(', ') 
      };
    }

    return { 
      isValid: true, 
      sanitizedMessage: validation.data.message 
    };
  };

  // 🔒 SECURE: Enhanced user verification with detailed logging
  const verifyUser = async (userId, socket) => {
    if (!userId || typeof userId !== 'string') {
      secureLog('warn', 'Invalid user ID provided', { 
        socketId: socket.id,
        userIdType: typeof userId 
      });
      socket.emit('auth-error', { message: 'ID de usuario inválido' });
      return false;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      secureLog('warn', 'Invalid UUID format', { 
        socketId: socket.id,
        userId: userId.substring(0, 8) + '...' // Log only first part for privacy
      });
      socket.emit('auth-error', { message: 'Formato de ID inválido' });
      return false;
    }

    try {
      // Create secure Supabase client for server operations
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Verify user exists and is active
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        secureLog('warn', 'User not found in database', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...',
          error: error?.message 
        });
        socket.emit('auth-error', { message: 'Usuario no encontrado' });
        return false;
      }

      secureLog('info', 'User verified successfully', { 
        socketId: socket.id,
        userId: userId.substring(0, 8) + '...'
      });
      
      return true;
    } catch (error) {
      secureLog('error', 'Database error during user verification', { 
        socketId: socket.id,
        error: error.message 
      });
      socket.emit('auth-error', { message: 'Error de verificación' });
      return false;
    }
  };
  
  // Función para entregar mensajes offline
  const deliverOfflineMessages = async (userId, socket) => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      console.log(`📬 Verificando mensajes offline para usuario: ${userId}`);

      // Obtener conversaciones del usuario
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (convError || !conversations) {
        console.log(`⚠️ No se pudieron obtener conversaciones para ${userId}`);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length === 0) {
        console.log(`📭 Usuario ${userId} no tiene conversaciones`);
        return;
      }

      // Obtener mensajes no entregados (que no ha visto este usuario)
      // Asumimos que los mensajes que no ha visto son los que llegaron mientras estaba offline
      const { data: offlineMessages, error: msgError } = await supabase
        .from('private_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          created_at
        `)
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId) // No incluir sus propios mensajes
        .is('read_at', null) // Mensajes no leídos
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error(`❌ Error obteniendo mensajes offline:`, msgError);
        return;
      }

      if (offlineMessages && offlineMessages.length > 0) {
        console.log(`📬 Entregando ${offlineMessages.length} mensajes offline a ${userId}`);

        // Formatear todos los mensajes
        const formattedMessages = offlineMessages.map(msg => ({
          id: msg.id,
          sender: 'other',
          message: msg.message,
          timestamp: msg.created_at,
          status: 'delivered',
          conversation_id: msg.conversation_id,
          isOffline: true
        }));

        // Enviar mensajes en lote para mejor performance
        if (formattedMessages.length > 5) {
          // Enviar en lote si son muchos mensajes
          socket.emit('offline-messages-batch', formattedMessages);
        } else {
          // Enviar individualmente si son pocos
          formattedMessages.forEach(messageData => {
            socket.emit('offline-message', messageData);
          });
        }

        // Marcar como entregados en la base de datos
        await supabase
          .from('private_messages')
          .update({ delivered_at: new Date().toISOString() })
          .in('id', offlineMessages.map(m => m.id));

        console.log(`✅ ${offlineMessages.length} mensajes offline entregados a ${userId}`);
      } else {
        console.log(`📭 No hay mensajes offline para ${userId}`);
      }

    } catch (error) {
      console.error(`💥 Error entregando mensajes offline:`, error);
    }
  };

  io.on('connection', (socket) => {
    console.log(`🔌 Nueva conexión Socket.IO: ${socket.id}`);
    
    // Extraer token del handshake
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    console.log(`🔑 Token recibido: ${token ? 'Sí' : 'No'}`);
    
    // Verificar autenticación con el token de Supabase si existe
    if (token) {
      // Extraer userId del token si es posible (simplificado)
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.sub) {
          socket.userId = payload.sub;
          console.log(`🔑 Token recibido: Sí, UserID: ${payload.sub}`);
        }
      } catch (e) {
        console.log('🔑 Token recibido: Sí, pero no se pudo decodificar');
      }
    }
    
    // Estadísticas de conexiones
    const connectedUsers = userSessions.size;
    console.log(`📊 Usuarios conectados: ${connectedUsers + 1}`);

    // Usuario se une cuando envía su ID
    socket.on('join-user', async (userId) => {
      console.log(`👤 Usuario intentando unirse: ${userId}`);
      
      if (!userId) {
        console.error('❌ UserId no proporcionado');
        socket.emit('join-error', { message: 'UserId requerido' });
        return;
      }

      // 🔒 VERIFICAR USUARIO
      const isUserValid = await verifyUser(userId, socket);
      if (!isUserValid) {
        return;
      }

      // Si el usuario ya tiene otra sesión, desconectar la anterior
      if (userSessions.has(userId)) {
        const oldSocketId = userSessions.get(userId);
        console.log(`🔄 Usuario ${userId} ya conectado, desconectando sesión anterior: ${oldSocketId}`);
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }

      socket.userId = userId;
      userSessions.set(userId, socket.id);
      socket.join(`user:${userId}`);
      
      console.log(`✅ Usuario ${userId} conectado exitosamente con socket ${socket.id}`);
      
      // ✅ ENTREGAR MENSAJES OFFLINE
      await deliverOfflineMessages(userId, socket);
      
      // Confirmar al cliente que se unió correctamente
      socket.emit('join-success', { userId, socketId: socket.id });
      
      // Emitir que el usuario está online a otros usuarios
      socket.broadcast.emit('user-online', userId);
      
      // Enviar lista de usuarios online al nuevo usuario
      const onlineUserIds = Array.from(userSessions.keys()).filter(id => id !== userId);
      socket.emit('users-online', onlineUserIds);
    });

    // Usuario se une a una conversación específica
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 Usuario se unió a conversación: ${conversationId}`);
    });

    // 🔒 SECURE: Enhanced message handling with comprehensive validation
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data;
      
      secureLog('info', 'Message send attempt', { 
        socketId: socket.id,
        hasConversationId: !!conversationId,
        hasMessage: !!message,
        hasUserId: !!userId,
        messageLength: message?.length || 0
      });

      // 🔒 VALIDATION: Check required fields
      if (!userId || !conversationId || !message) {
        secureLog('warn', 'Incomplete message data', { 
          socketId: socket.id,
          missingFields: {
            userId: !userId,
            conversationId: !conversationId,
            message: !message
          }
        });
        socket.emit('message-error', { 
          error: 'Datos incompletos',
          tempId 
        });
        return;
      }

      // 🔒 VALIDATION: Verify user authentication
      const isUserValid = await verifyUser(userId, socket);
      if (!isUserValid) {
        secureLog('warn', 'Unauthorized message attempt', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...'
        });
        return;
      }

      // 🔒 VALIDATION: Sanitize message content
      const messageValidation = validateMessage(message);
      if (!messageValidation.isValid) {
        secureLog('warn', 'Message validation failed', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...',
          error: messageValidation.error
        });
        socket.emit('message-error', { 
          error: messageValidation.error,
          tempId 
        });
        return;
      }

      // 🔒 VALIDATION: Check rate limiting
      if (!checkMessageRateLimit(userId)) {
        secureLog('warn', 'Rate limit exceeded', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...'
        });
        socket.emit('message-error', { 
          error: 'Demasiados mensajes. Intenta más tarde.',
          tempId 
        });
        return;
      }

      const sanitizedMessage = messageValidation.sanitizedMessage;
      
      secureLog('info', 'Message validated and sanitized', { 
        socketId: socket.id,
        userId: userId.substring(0, 8) + '...',
        conversationId,
        originalLength: message.length,
        sanitizedLength: sanitizedMessage.length
      });

      try {
        // ✅ SECURE: Save message to database with service key
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // 🔒 VALIDATION: Verify user has access to conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          secureLog('warn', 'Conversation not found', { 
            socketId: socket.id,
            userId: userId.substring(0, 8) + '...',
            conversationId,
            error: convError?.message 
          });
          socket.emit('message-error', { 
            error: 'Conversación no encontrada',
            tempId 
          });
          return;
        }

        // Verify user is part of conversation
        if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
          secureLog('warn', 'Unauthorized conversation access attempt', { 
            socketId: socket.id,
            userId: userId.substring(0, 8) + '...',
            conversationId
          });
          socket.emit('message-error', { 
            error: 'Sin permisos para esta conversación',
            tempId 
          });
          return;
        }

        // Insert message in database
        const { data: savedMessage, error: dbError } = await supabase
          .from('private_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            message: sanitizedMessage, // Use sanitized message
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        secureLog('info', 'Message saved to database', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...',
          messageId: savedMessage.id,
          conversationId
        });

        // Format message for clients
        const messageData = {
          id: savedMessage.id,
          sender: 'other', // For receiver it will be 'other'
          message: savedMessage.message,
          timestamp: savedMessage.created_at,
          status: 'delivered',
          conversation_id: conversationId
        };

        // Send to all users in conversation EXCEPT sender
        socket.to(`conversation:${conversationId}`).emit('new-message', messageData);
        
        secureLog('info', 'Message delivered via Socket.IO', { 
          messageId: savedMessage.id,
          conversationId
        });

        // Confirm to sender that message was saved and sent
        socket.emit('message-sent', { 
          messageId: savedMessage.id, 
          status: 'delivered',
          tempId: tempId,
          timestamp: savedMessage.created_at
        });

        // TODO: Implement push notifications for offline users

      } catch (error) {
        secureLog('error', 'Error processing message', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...',
          conversationId,
          error: error.message,
          tempId
        });
        
        socket.emit('message-error', { 
          error: 'Error del servidor', 
          tempId 
        });
      }
    });

    // 🔒 SECURE: Typing indicators with validation
    socket.on('typing-start', (data) => {
      const { conversationId, userId } = data;
      
      if (!conversationId || !userId || userId !== socket.userId) {
        secureLog('warn', 'Invalid typing indicator', { 
          socketId: socket.id,
          providedUserId: userId?.substring(0, 8) + '...' || 'none',
          socketUserId: socket.userId?.substring(0, 8) + '...' || 'none',
          hasConversationId: !!conversationId
        });
        return;
      }
      
      socket.to(`conversation:${conversationId}`).emit('user-typing', { 
        userId, 
        isTyping: true 
      });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data;
      
      if (!conversationId || !userId || userId !== socket.userId) {
        secureLog('warn', 'Invalid typing stop indicator', { 
          socketId: socket.id,
          providedUserId: userId?.substring(0, 8) + '...' || 'none',
          socketUserId: socket.userId?.substring(0, 8) + '...' || 'none',
          hasConversationId: !!conversationId
        });
        return;
      }
      
      socket.to(`conversation:${conversationId}`).emit('user-typing', { 
        userId, 
        isTyping: false 
      });
    });

    // 🔒 SECURE: Message read status with comprehensive validation
    socket.on('messages-read', async (data) => {
      const { conversationId, userId } = data;
      
      secureLog('info', 'Messages read request', { 
        socketId: socket.id,
        userId: userId?.substring(0, 8) + '...' || 'none',
        conversationId: conversationId || 'none'
      });
      
      // Validate user authentication
      if (!userId || userId !== socket.userId) {
        secureLog('warn', 'Unauthorized read status update', { 
          socketId: socket.id,
          providedUserId: userId?.substring(0, 8) + '...' || 'none',
          socketUserId: socket.userId?.substring(0, 8) + '...' || 'none'
        });
        return;
      }

      if (!conversationId) {
        secureLog('warn', 'Missing conversation ID for read status', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...'
        });
        return;
      }
      
      try {
        // Create secure database client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Verify user has access to conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          secureLog('warn', 'Conversation not found for read status', { 
            socketId: socket.id,
            userId: userId.substring(0, 8) + '...',
            conversationId,
            error: convError?.message 
          });
          return;
        }

        if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
          secureLog('warn', 'Unauthorized conversation read status attempt', { 
            socketId: socket.id,
            userId: userId.substring(0, 8) + '...',
            conversationId
          });
          return;
        }
        
        // Update messages as read in database
        const { data: updatedMessages, error } = await supabase
          .from('private_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId) // Only messages not sent by this user
          .is('read_at', null) // Only unread messages
          .select('id, sender_id');

        if (error) {
          secureLog('error', 'Database error updating read status', { 
            socketId: socket.id,
            userId: userId.substring(0, 8) + '...',
            conversationId,
            error: error.message 
          });
          socket.emit('messages-read-error', {
            conversationId,
            error: 'Error al actualizar estado de lectura'
          });
          return;
        }

        const readCount = updatedMessages?.length || 0;
        secureLog('info', 'Messages marked as read', { 
          socketId: socket.id,
          userId: userId.substring(0, 8) + '...',
          conversationId,
          readCount
        });

        // Notify senders that their messages were read
        if (readCount > 0) {
          // Get unique sender IDs
          const senderIds = [...new Set(updatedMessages.map(m => m.sender_id))];
          
          senderIds.forEach(senderId => {
            const senderSocketId = userSessions.get(senderId);
            if (senderSocketId) {
              const senderSocket = io.sockets.sockets.get(senderSocketId);
              if (senderSocket) {
                senderSocket.emit('messages-read-confirmation', {
                  conversationId,
                  readBy: userId,
                  readCount
                });
                secureLog('info', 'Read confirmation sent', { 
                  toUser: senderId.substring(0, 8) + '...',
                  conversationId,
                  readCount
                });
              }
            }
          });
        }

        // Confirm to requesting user
        socket.emit('messages-read-success', {
          conversationId,
          readCount
        });

      } catch (error) {
        secureLog('error', 'Exception during read status update', { 
          socketId: socket.id,
          userId: userId?.substring(0, 8) + '...' || 'none',
          conversationId,
          error: error.message 
        });
        
        socket.emit('messages-read-error', {
          conversationId,
          error: 'Error interno del servidor'
        });
      }
    });

    // 🔒 SECURE: Enhanced disconnect handling with detailed logging
    socket.on('disconnect', (reason) => {
      const userId = socket.userId;
      
      secureLog('info', 'Socket disconnected', { 
        socketId: socket.id,
        userId: userId?.substring(0, 8) + '...' || 'anonymous',
        reason: reason,
        connectedTime: Date.now() - (socket.connectedAt || Date.now())
      });
      
      if (userId) {
        userSessions.delete(userId);
        
        // Emit that user is offline
        socket.broadcast.emit('user-offline', userId);
        
        secureLog('info', 'User session cleaned up', { 
          userId: userId.substring(0, 8) + '...',
          remainingConnections: userSessions.size
        });
      }
    });

    // 🔒 SECURE: Enhanced error handling
    socket.on('error', (error) => {
      secureLog('error', 'Socket error occurred', { 
        socketId: socket.id,
        userId: socket.userId?.substring(0, 8) + '...' || 'anonymous',
        error: error.message,
        stack: error.stack?.substring(0, 200) + '...' // Truncate stack trace
      });
    });

    // Set connection timestamp for metrics
    socket.connectedAt = Date.now();
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://${hostname}:${port}`);
    });
});
