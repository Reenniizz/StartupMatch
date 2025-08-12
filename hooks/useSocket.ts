// hooks/useSocket.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthProvider';

interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: {
    conversationId: string; // UUID
    message: string;
    conversationType: 'individual' | 'group';
    tempId?: number;
  }) => void;
  joinConversation: (conversationId: string, conversationType: 'individual' | 'group') => void; // UUID
  startTyping: (conversationId: string, conversationType: 'individual' | 'group') => void; // UUID
  stopTyping: (conversationId: string, conversationType: 'individual' | 'group') => void; // UUID
  onlineUsers: string[];
  typingUsers: { [key: string]: boolean };
}

const useSocket = (): SocketHook => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user?.id) {
      console.log('🔄 Usuario no disponible para Socket.IO:', user);
      return;
    }

    const initSocket = async () => {
      console.log('🚀 Iniciando Socket.IO para usuario:', user.id);

      try {
        // Inicializar servidor Socket.IO
        await fetch('/api/socketio')
        
        // Conectar cliente
        const socketInstance = io({
          path: '/api/socketio',
          addTrailingSlash: false,
        });

        setSocket(socketInstance);

        // Event listeners
        socketInstance.on('connect', () => {
          console.log('🔗 Socket conectado:', socketInstance.id);
          setIsConnected(true);
          
          // Join personal room
          console.log('👤 Enviando join-user con ID:', user.id);
          socketInstance.emit('join-user', user.id);
        });

        socketInstance.on('disconnect', () => {
          console.log('🔌 Socket desconectado');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('❌ Error de conexión Socket.IO:', error);
          setIsConnected(false);
        });

        // Manejo de usuarios online/offline
        socketInstance.on('user-online', (userId: string) => {
          setOnlineUsers(prev => {
            if (prev.includes(userId)) return prev;
            return [...prev, userId];
          });
        });

        socketInstance.on('user-offline', (userId: string) => {
          setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        // Usuario escribiendo
        socketInstance.on('user-typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: isTyping
          }));

          // Auto-limpiar después de 3 segundos
          if (isTyping) {
            setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [userId]: false
              }));
            }, 3000);
          }
        });

        // Cleanup
        return () => {
          socketInstance.disconnect();
        };
        
      } catch (error) {
        console.error('💥 Error inicializando Socket.IO:', error);
      }
    }

    initSocket()
  }, [user?.id]);

  const sendMessage = useCallback((data: {
    conversationId: string;
    message: string;
    conversationType: 'individual' | 'group';
    tempId?: number;
  }) => {
    if (!socket || !user?.id) {
      console.error('❌ No se puede enviar mensaje - Socket o usuario no disponible:', { socket: !!socket, userId: user?.id });
      return;
    }

    const messageData = {
      conversationId: data.conversationId,
      message: data.message,
      userId: user.id,
      tempId: data.tempId
    };

    console.log('📤 Enviando mensaje via Socket.IO:', messageData);
    socket.emit('send-message', messageData);
  }, [socket, user?.id]);

  const joinConversation = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket) return;

    socket.emit('join-conversation', conversationId, conversationType);
  }, [socket]);

  const startTyping = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket || !user?.id) return;

    socket.emit('typing-start', {
      conversationId,
      conversationType,
      userId: user.id
    });
  }, [socket, user?.id]);

  const stopTyping = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket || !user?.id) return;

    socket.emit('typing-stop', {
      conversationId,
      conversationType,
      userId: user.id
    });
  }, [socket, user?.id]);

  return {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers,
  };
};

export default useSocket;
