// lib/socket.js
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// Función para formatear hora en Madrid desde el servidor
const formatMadridTimeServer = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Adelantar 2 horas
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  return adjustedDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
    hour12: false
  });
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Socket is initializing');
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  res.socket.server.io = io;

  // Conexión de usuario
  io.on('connection', (socket) => {
    console.log('🔗 Usuario conectado:', socket.id);

    // Join user to their personal room
    socket.on('join-user', (userId) => {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`👤 Usuario ${userId} joined personal room`);
      
      // Notificar que está online
      socket.broadcast.emit('user-online', userId);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId, conversationType) => {
      const roomName = `${conversationType}:${conversationId}`;
      socket.join(roomName);
      socket.currentRoom = roomName;
      console.log(`💬 Usuario ${socket.userId} joined room: ${roomName}`);
    });

    // Nuevo mensaje
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, message, userId, conversationType, tempId } = data;
        
        console.log('📨 Datos recibidos:', { conversationId, message, userId, conversationType, tempId });
        
        // Usar userId del socket si no viene en los datos
        const finalUserId = userId || socket.userId;
        
        if (!finalUserId) {
          console.error('❌ No se encontró userId válido');
          socket.emit('message-error', { tempId, error: 'Usuario no autenticado' });
          return;
        }
        
        // Guardar mensaje en Supabase
        const table = conversationType === 'group' ? 'group_messages' : 'private_messages';
        
        const insertData = {
          [conversationType === 'group' ? 'group_id' : 'conversation_id']: conversationId,
          [conversationType === 'group' ? 'user_id' : 'sender_id']: finalUserId,
          message: message,
          created_at: new Date().toISOString()
        };
        
        console.log('💾 Insertando en tabla:', table, insertData);
        
        const { data: newMessage, error } = await supabase
          .from(table)
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('❌ Error de Supabase:', error);
          socket.emit('message-error', { tempId, error: error.message });
          return;
        }

        console.log('✅ Mensaje guardado:', newMessage);

        // Confirmar al remitente
        socket.emit('message-sent', { tempId, realId: newMessage.id });

        // Broadcast a todos en la conversación
        const roomName = `${conversationType}:${conversationId}`;
        io.to(roomName).emit('new-message', {
          id: newMessage.id,
          sender: finalUserId === socket.userId ? "me" : "other",
          message: newMessage.message,
          timestamp: formatMadridTimeServer(newMessage.created_at),
          status: "delivered",
          senderId: finalUserId
        });

        console.log(`📨 Mensaje enviado a room ${roomName}`);

      } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        socket.emit('message-error', { tempId: data.tempId, error: error.message });
      }
    });

    // Usuario escribiendo
    socket.on('typing-start', (data) => {
      const { conversationId, conversationType, userId } = data;
      const roomName = `${conversationType}:${conversationId}`;
      socket.to(roomName).emit('user-typing', { userId, isTyping: true });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, conversationType, userId } = data;
      const roomName = `${conversationType}:${conversationId}`;
      socket.to(roomName).emit('user-typing', { userId, isTyping: false });
    });

    // Mensaje leído
    socket.on('message-read', (data) => {
      const { conversationId, conversationType, messageId, userId } = data;
      const roomName = `${conversationType}:${conversationId}`;
      socket.to(roomName).emit('message-read-receipt', { messageId, readBy: userId });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Usuario desconectado:', socket.id);
      if (socket.userId) {
        // Notificar que está offline
        socket.broadcast.emit('user-offline', socket.userId);
      }
    });
  });

  res.end();
};

export default SocketHandler;
