// server.js - Servidor personalizado con Socket.IO
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

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

  // Socket.IO server
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store user sessions
  const userSessions = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.id}`);

    // Usuario se une cuando envía su ID
    socket.on('join-user', (userId) => {
      socket.userId = userId;
      userSessions.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`👤 Usuario ${userId} se unió con socket ${socket.id}`);
      
      // Emitir que el usuario está online
      socket.broadcast.emit('user-online', userId);
    });

    // Usuario se une a una conversación específica
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 Usuario se unió a conversación: ${conversationId}`);
    });

    // Manejar nuevo mensaje
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data;
      console.log(`📤 Nuevo mensaje en conversación ${conversationId}:`, message);

      try {
        // Simular guardado en base de datos (aquí deberías usar Supabase)
        const messageData = {
          id: Date.now(), // temporal
          conversation_id: conversationId,
          sender_id: userId,
          message: message,
          created_at: new Date().toISOString(),
          status: 'delivered',
          tempId: tempId
        };

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
        socket.emit('message-error', { error: 'Error del servidor', tempId });
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

    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${socket.id}`);
      if (socket.userId) {
        userSessions.delete(socket.userId);
        // Emitir que el usuario está offline
        socket.broadcast.emit('user-offline', socket.userId);
      }
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
