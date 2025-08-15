"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (data: {
    conversationId: string;
    message: string;
    conversationType: 'individual' | 'group';
    tempId?: number;
  }) => void;
  joinConversation: (conversationId: string, conversationType: 'individual' | 'group') => void;
  startTyping: (conversationId: string, conversationType: 'individual' | 'group') => void;
  stopTyping: (conversationId: string, conversationType: 'individual' | 'group') => void;
  onlineUsers: string[];
  typingUsers: { [key: string]: boolean };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user?.id) {
      // Si no hay usuario, desconectar socket existente
      if (socket) {
        console.log('🔌 Desconectando socket - usuario no disponible');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers({});
      }
      return;
    }

    // Si ya tenemos un socket y el usuario es el mismo, no recrear
    if (socket && socket.connected) {
      console.log('🔄 Socket ya conectado para usuario:', user.id);
      return;
    }

    const initSocket = async () => {
      console.log('🚀 Iniciando Socket.IO para usuario:', user.id);

      try {
        // Desconectar socket anterior si existe
        if (socket) {
          socket.disconnect();
        }

        // Obtener el token de sesión de Supabase para autenticación
        const { supabase } = await import('@/lib/supabase-client');
        const { data: { session } } = await supabase.auth.getSession();

        console.log('🔑 Token de sesión obtenido:', session?.access_token ? 'Sí' : 'No');

        // Conectar cliente al servidor Socket.IO personalizado
        const socketInstance = io('http://localhost:3000', {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          forceNew: true,
          // Enviar el token de autenticación en la conexión
          auth: {
            token: session?.access_token,
            userId: user.id
          },
          query: {
            userId: user.id
          }
        });

        console.log('🔗 Cliente Socket.IO inicializado');

        setSocket(socketInstance);

        // Event listeners
        socketInstance.on('connect', () => {
          console.log('🔗 Socket conectado:', socketInstance.id);
          setIsConnected(true);
          
          // Join personal room
          console.log('👤 Enviando join-user con ID:', user.id);
          socketInstance.emit('join-user', user.id);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('🔌 Socket desconectado. Razón:', reason);
          setIsConnected(false);
        });

        socketInstance.on('reconnect', (attempt) => {
          console.log('🔄 Socket reconectado después de', attempt, 'intentos');
          setIsConnected(true);
          // Re-join user room after reconnection
          socketInstance.emit('join-user', user.id);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('❌ Error de conexión Socket.IO:', error);
          setIsConnected(false);
        });

        socketInstance.on('reconnect_error', (error) => {
          console.error('❌ Error de reconexión Socket.IO:', error);
        });

        // Confirmación de join exitoso
        socketInstance.on('join-success', ({ userId, socketId }) => {
          console.log('✅ Join exitoso para usuario:', userId, 'Socket:', socketId);
        });

        socketInstance.on('join-error', (error) => {
          console.error('❌ Error al hacer join:', error);
        });

        // Lista inicial de usuarios online
        socketInstance.on('users-online', (userIds: string[]) => {
          console.log('👥 Usuarios online recibidos:', userIds);
          setOnlineUsers(userIds);
        });

        // Manejo de usuarios online/offline
        socketInstance.on('user-online', (userId: string) => {
          console.log('🟢 Usuario online:', userId);
          setOnlineUsers(prev => {
            if (prev.includes(userId)) return prev;
            return [...prev, userId];
          });
        });

        socketInstance.on('user-offline', (userId: string) => {
          console.log('🔴 Usuario offline:', userId);
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
        
      } catch (error) {
        console.error('💥 Error inicializando Socket.IO:', error);
      }
    };

    initSocket();

    // Cleanup cuando se desmonta el provider (navegación completa o cierre de app)
    return () => {
      if (socket) {
        console.log('🧹 Limpiando Socket.IO...');
        socket.disconnect();
      }
    };
  }, [user?.id]); // Solo depende del user.id, no del socket

  const sendMessage = useCallback((data: {
    conversationId: string;
    message: string;
    conversationType: 'individual' | 'group';
    tempId?: number;
  }) => {
    if (!socket || !user?.id || !isConnected) {
      console.error('❌ No se puede enviar mensaje - Socket, usuario o conexión no disponible:', { 
        socket: !!socket, 
        userId: user?.id, 
        isConnected 
      });
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
  }, [socket, user?.id, isConnected]);

  const joinConversation = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket || !isConnected) {
      console.warn('⚠️ No se puede unir a conversación - Socket no conectado');
      return;
    }

    console.log('🏠 Uniéndose a conversación:', conversationId, 'Tipo:', conversationType);
    socket.emit('join-conversation', conversationId, conversationType);
  }, [socket, isConnected]);

  const startTyping = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket || !user?.id || !isConnected) return;

    socket.emit('typing-start', {
      conversationId,
      conversationType,
      userId: user.id
    });
  }, [socket, user?.id, isConnected]);

  const stopTyping = useCallback((conversationId: string, conversationType: 'individual' | 'group') => {
    if (!socket || !user?.id || !isConnected) return;

    socket.emit('typing-stop', {
      conversationId,
      conversationType,
      userId: user.id
    });
  }, [socket, user?.id, isConnected]);

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
