'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '@/lib/supabase-client';
import type { Message } from '../types/messages.types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface UseSocketIOProps {
  onNewMessage?: (message: Message) => void;
  onMessageSent?: (data: { messageId: number; status: string; tempId: string; timestamp: string }) => void;
  onMessageError?: (data: { error: string; tempId: string }) => void;
  onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export const useSocketIO = ({
  onNewMessage,
  onMessageSent,
  onMessageError,
  onUserTyping
}: UseSocketIOProps = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Obtener usuario de Supabase de forma segura
  useEffect(() => {
    const getUser = async () => {
      // ✅ SECURE: Use getUser() instead of getSession()
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      setUser(user);
    };

    getUser();

    // ⚠️ WARNING: onAuthStateChange session may not be secure
    // Re-validate user when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        // Re-validate for security
        const { data: { user }, error } = await supabase.auth.getUser();
        setUser(error ? null : user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log('🔌 Conectando a Socket.IO...');
    
    // Crear conexión Socket.IO
    const socketConnection = io('http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: user.access_token || ''
      },
      forceNew: true,
      timeout: 20000
    });

    // Eventos de conexión
    socketConnection.on('connect', () => {
      console.log('✅ Socket.IO conectado:', socketConnection.id);
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Unirse como usuario autenticado
      if (user.id) {
        socketConnection.emit('join-user', user.id);
      }
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ Socket.IO desconectado:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Reconexión manual si el servidor nos desconectó
        setTimeout(() => {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            socketConnection.connect();
          }
        }, 1000 * reconnectAttempts.current);
      }
    });

    socketConnection.on('connect_error', (error) => {
      console.error('💥 Error de conexión Socket.IO:', error);
      setError(error.message);
      setIsConnected(false);
    });

    // Eventos de usuario
    socketConnection.on('join-success', (data) => {
      console.log('✅ Usuario unido exitosamente:', data);
    });

    socketConnection.on('join-error', (data) => {
      console.error('❌ Error uniéndose:', data);
      setError(data.message);
    });

    // Eventos de mensajes
    socketConnection.on('new-message', (message: Message) => {
      console.log('📨 Nuevo mensaje recibido:', message);
      onNewMessage?.(message);
    });

    socketConnection.on('message-sent', (data) => {
      console.log('✅ Mensaje enviado confirmado:', data);
      onMessageSent?.(data);
    });

    socketConnection.on('message-error', (data) => {
      console.error('❌ Error enviando mensaje:', data);
      onMessageError?.(data);
    });

    // Eventos de typing
    socketConnection.on('user-typing', (data) => {
      onUserTyping?.(data);
    });

    setSocket(socketConnection);

    // Cleanup
    return () => {
      console.log('🧹 Limpiando conexión Socket.IO');
      socketConnection.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, onNewMessage, onMessageSent, onMessageError, onUserTyping]);

  // Funciones para emitir eventos
  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      console.log(`💬 Uniéndose a conversación: ${conversationId}`);
      socket.emit('join-conversation', conversationId);
    }
  };

  const sendMessage = (data: {
    conversationId: string;
    message: string;
    userId: string;
    tempId: string;
  }) => {
    if (socket && isConnected) {
      console.log('📤 Enviando mensaje via Socket.IO:', data);
      socket.emit('send-message', data);
      return true;
    }
    console.warn('⚠️ Socket no conectado, no se puede enviar mensaje');
    return false;
  };

  const startTyping = (conversationId: string, userId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { conversationId, userId });
    }
  };

  const stopTyping = (conversationId: string, userId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { conversationId, userId });
    }
  };

  return {
    socket,
    isConnected,
    error,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping
  };
};
