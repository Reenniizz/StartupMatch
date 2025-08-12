// pages/api/socket.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse & { socket: { server: NetServer & { io?: ServerIO } } }) {
  if (res.socket.server.io) {
    console.log('🔗 Socket.IO ya está inicializado');
    res.end()
    return
  }

  console.log('🚀 Inicializando Socket.IO server...')
  
  const io = new ServerIO(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    }
  })

  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.id}`)

    // Usuario se une a su sala personal
    socket.on('join-user', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`👤 Usuario ${userId} se unió a su sala personal`)
    })

    // Usuario se une a una conversación
    socket.on('join-conversation', (conversationId: string, conversationType: string) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`💬 Usuario se unió a conversación ${conversationType}: ${conversationId}`)
    })

    // Manejar envío de mensajes
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data
      console.log(`📤 Nuevo mensaje de ${userId}:`, message)

      try {
        // Guardar en base de datos
        const { data: newMessage, error } = await supabase
          .from('private_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            message: message
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Error guardando mensaje:', error)
          socket.emit('message-error', { error: error.message, tempId })
          return
        }

        console.log('✅ Mensaje guardado con ID:', newMessage.id)

        // Preparar datos del mensaje para envío
        const messageData = {
          id: newMessage.id,
          conversation_id: conversationId,
          sender_id: userId,
          message: message,
          created_at: newMessage.created_at,
          status: 'delivered'
        }

        // Enviar a todos en la conversación
        io.to(`conversation:${conversationId}`).emit('new-message', messageData)
        
        // Confirmar al remitente
        socket.emit('message-sent', { 
          messageId: newMessage.id, 
          tempId,
          status: 'delivered' 
        })

      } catch (error) {
        console.error('💥 Error inesperado enviando mensaje:', error)
        socket.emit('message-error', { 
          error: 'Error del servidor', 
          tempId 
        })
      }
    })

    // Indicadores de escritura
    socket.on('typing-start', (data) => {
      const { conversationId, userId } = data
      socket.to(`conversation:${conversationId}`).emit('user-typing', { userId, isTyping: true })
    })

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data
      socket.to(`conversation:${conversationId}`).emit('user-typing', { userId, isTyping: false })
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${socket.id}`)
    })
  })

  console.log('✅ Socket.IO server inicializado correctamente')
  res.end()
}
