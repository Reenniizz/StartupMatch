// app/api/socketio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as ServerIO } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic'

const SocketHandler = async (req: NextRequest) => {
  const res = NextResponse.next()
  
  // Cast para acceder a socket
  const response = res as any

  if (response.socket?.server.io) {
    console.log('🔗 Socket ya está inicializado');
    return new NextResponse('Socket server already running', { status: 200 })
  }

  console.log('🚀 Inicializando Socket.IO server');
  
  try {
    const httpServer = response.socket?.server || new NetServer()
    
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    if (response.socket?.server) {
      response.socket.server.io = io;
    }

    io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.id}`);

      // Usuario se une a su sala personal (basada en su user ID)
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`👤 Usuario ${userId} se unió a su sala personal`);
      });

      // Usuario se une a una conversación específica
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`💬 Usuario se unió a conversación: ${conversationId}`);
      });

      // Manejar nuevo mensaje
      socket.on('send-message', async (data) => {
        const { conversationId, message, userId } = data;
        console.log(`📤 Nuevo mensaje en conversación ${conversationId}:`, message);

        try {
          // Guardar mensaje en la base de datos
          const { data: newMessage, error } = await supabase
            .from('private_messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userId,
              message: message
            })
            .select()
            .single();

          if (error) {
            console.error('❌ Error guardando mensaje:', error);
            socket.emit('message-error', { error: error.message });
            return;
          }

          console.log('✅ Mensaje guardado:', newMessage.id);

          // Enviar mensaje a todos los usuarios en la conversación
          const messageData = {
            id: newMessage.id,
            conversation_id: conversationId,
            sender_id: userId,
            message: message,
            created_at: newMessage.created_at,
            status: 'delivered'
          };

          // Enviar a la sala de la conversación
          io.to(`conversation:${conversationId}`).emit('new-message', messageData);

          // Confirmar al remitente
          socket.emit('message-sent', { messageId: newMessage.id, status: 'delivered' });

        } catch (error) {
          console.error('💥 Error inesperado:', error);
          socket.emit('message-error', { error: 'Error del servidor' });
        }
      });

      // Indicador de "escribiendo"
      socket.on('typing-start', (data) => {
        const { conversationId, userId } = data;
        socket.to(`conversation:${conversationId}`).emit('user-typing', { userId });
      });

      socket.on('typing-stop', (data) => {
        const { conversationId, userId } = data;
        socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', { userId });
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Usuario desconectado: ${socket.id}`);
      });
    });

    return new NextResponse('Socket server started', { status: 200 })
    
  } catch (error) {
    console.error('💥 Error inicializando Socket.IO:', error);
    return new NextResponse('Error starting socket server', { status: 500 })
  }
}

export { SocketHandler as GET, SocketHandler as POST }
