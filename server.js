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

  // Store user sessions
  const userSessions = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`🔌 Nueva conexión Socket.IO: ${socket.id}`);
    
    // Obtener datos de autenticación
    const authToken = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    console.log(`🔑 Token recibido: ${authToken ? 'Sí' : 'No'}, UserID: ${userId}`);
    
    // Estadísticas de conexiones
    const connectedUsers = userSessions.size;
    console.log(`📊 Usuarios conectados: ${connectedUsers + 1}`);

    // Usuario se une cuando envía su ID
    socket.on('join-user', (userId) => {
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

    // Manejar nuevo mensaje
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data;
      const authToken = socket.handshake.auth.token;
      
      console.log(`📤 Nuevo mensaje en conversación ${conversationId}:`, message);
      console.log(`🔑 Usuario autenticado: ${userId}, Token: ${authToken ? 'Presente' : 'Ausente'}`);

      try {
        // Validar autenticación
        if (!authToken || !userId) {
          throw new Error('Token de autenticación o userId no proporcionado');
        }

        // Verificar token con Supabase
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verificar el token de usuario
        const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
        
        if (authError || !user || user.id !== userId) {
          console.error('❌ Error de autenticación:', authError?.message || 'Token inválido');
          throw new Error('Token de autenticación inválido');
        }

        console.log('✅ Usuario autenticado:', user.id);

        // Verificar que el usuario es parte de la conversación
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .single();

        if (convError || !conversation) {
          throw new Error('Conversación no encontrada o usuario no autorizado');
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
          throw new Error(`Error insertando mensaje: ${insertError.message}`);
        }

        // Crear datos del mensaje para enviar
        const messageData = {
          id: newMessage.id,
          conversation_id: conversationId,
          sender_id: userId,
          message: newMessage.message,
          created_at: newMessage.created_at,
          status: 'delivered',
          tempId: tempId
        };

        console.log(`✅ Mensaje guardado en DB con ID: ${messageData.id}`);

        // Enviar a todos los usuarios en la conversación
        io.to(`conversation:${conversationId}`).emit('new-message', messageData);

        // Confirmar al remitente
        socket.emit('message-sent', { 
          messageId: messageData.id, 
          status: 'delivered',
          tempId: tempId
        });

      } catch (error) {
        console.error('💥 Error procesando mensaje:', error);
        socket.emit('message-error', { 
          error: error.message || 'Error del servidor', 
          tempId: tempId 
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
