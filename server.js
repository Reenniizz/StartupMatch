// server.js - Servidor personalizado con Socket.IO
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

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
      
      // Log para debugging
      console.log(`📝 Handling request: ${req.method} ${req.url}`);
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
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

  console.log('🚀 Socket.IO server iniciado en puerto', port);

  const userSessions = new Map(); // userId -> socketId
  
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
    
    // Extraer token del handshake de forma más robusta
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    console.log(`🔑 Token presente: ${token ? 'Sí' : 'No'}`);
    
    // Verificar autenticación con el token de Supabase si existe
    if (token && typeof token === 'string' && token.length > 0) {
      try {
        // Validar que el token tenga el formato correcto (3 partes separadas por punto)
        const tokenParts = token.replace('Bearer ', '').split('.');
        if (tokenParts.length === 3 && tokenParts[1]) {
          const base64Payload = tokenParts[1];
          // Asegurar padding correcto para base64
          const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
          const payloadString = Buffer.from(paddedPayload, 'base64').toString('utf8');
          
          if (payloadString && payloadString.length > 0) {
            const payload = JSON.parse(payloadString);
            if (payload.sub) {
              socket.userId = payload.sub;
              console.log(`🔑 Token decodificado exitosamente. UserID: ${payload.sub}`);
            }
          }
        } else {
          console.log('🔑 Token con formato inválido (no es JWT)');
        }
      } catch (e) {
        console.log(`🔑 Error decodificando token: ${e.message}`);
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

    // Manejar nuevo mensaje con persistencia en base de datos
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data;
      console.log(`📤 Nuevo mensaje en conversación ${conversationId}:`, message);

      try {
        // ✅ GUARDAR MENSAJE EN BASE DE DATOS
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service key para server
        );

        // Insertar mensaje en la base de datos
        const { data: savedMessage, error: dbError } = await supabase
          .from('private_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            message: message.trim(),
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Error guardando mensaje en DB: ${dbError.message}`);
        }

        console.log(`✅ Mensaje guardado en DB con ID: ${savedMessage.id}`);

        // Formatear mensaje para los clientes
        const messageData = {
          id: savedMessage.id,
          sender: 'other', // Para el receptor será 'other'
          message: savedMessage.message,
          timestamp: savedMessage.created_at,
          status: 'delivered',
          conversation_id: conversationId
        };

        // Enviar a todos los usuarios en la conversación EXCEPTO el remitente
        const delivered = socket.to(`conversation:${conversationId}`).emit('new-message', messageData);
        
        console.log(`📨 Mensaje enviado via Socket.IO a conversación ${conversationId}`);

        // Confirmar al remitente que el mensaje se guardó y envió
        socket.emit('message-sent', { 
          messageId: savedMessage.id, 
          status: 'delivered',
          tempId: tempId,
          timestamp: savedMessage.created_at
        });

        // TODO: Implementar push notifications para usuarios offline

      } catch (error) {
        console.error('💥 Error procesando mensaje:', error);
        socket.emit('message-error', { 
          error: error.message || 'Error del servidor', 
          tempId 
        });
      }
    });

    // Indicador de "escribiendo"
    socket.on('typing-start', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('user-typing', { userId, isTyping: true });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('user-typing', { userId, isTyping: false });
    });

    // ✅ Manejar marcado de mensajes como leídos
    socket.on('messages-read', async (data) => {
      const { conversationId, userId } = data;
      console.log(`📖 Usuario ${userId} marcó mensajes como leídos en conversación ${conversationId}`);
      
      try {
        // Importar Supabase para esta operación
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Actualizar mensajes como leídos en la base de datos
        const { data: updatedMessages, error } = await supabase
          .from('private_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId) // Solo mensajes que no envió este usuario
          .is('read_at', null) // Solo mensajes no leídos
          .select('id, sender_id');

        if (error) {
          console.error('Error updating read status:', error);
          return;
        }

        const readCount = updatedMessages?.length || 0;
        console.log(`✅ ${readCount} mensajes marcados como leídos en BD`);

        // Notificar al remitente que sus mensajes fueron leídos
        if (readCount > 0) {
          // Obtener los IDs únicos de los remitentes
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
                console.log(`✅ Confirmación de lectura enviada a usuario ${senderId}`);
              }
            }
          });
        }

        // Confirmar al usuario que solicitó el marcado
        socket.emit('messages-read-success', {
          conversationId,
          readCount
        });

      } catch (error) {
        console.error('Error processing read messages:', error);
        socket.emit('messages-read-error', {
          conversationId,
          error: 'Error al procesar mensajes leídos'
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.id}, razón: ${reason}`);
      
      if (socket.userId) {
        console.log(`👋 Usuario ${socket.userId} se desconectó`);
        userSessions.delete(socket.userId);
        
        // Emitir que el usuario está offline
        socket.broadcast.emit('user-offline', socket.userId);
        
        // Estadísticas actualizadas
        console.log(`📊 Usuarios conectados restantes: ${userSessions.size}`);
      }
    });

    // Manejo de errores de socket
    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
    });
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
