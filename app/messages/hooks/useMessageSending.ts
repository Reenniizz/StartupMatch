'use client';

import { useState, useCallback } from 'react';
import { UseMessageSendingReturn } from '../types/messages.types';

export function useMessageSending(): UseMessageSendingReturn {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, conversationId: string | number) => {
    if (!content.trim()) {
      setSendError('El mensaje no puede estar vacío');
      return;
    }

    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate API call to send message
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newMessage = {
        id: Date.now(), // In real app, this would come from server
        conversationId,
        senderId: 'current-user', // This would come from auth context
        senderName: 'Usuario Actual',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        status: 'sent' as const,
        edited: false
      };

      // In real app, this would be handled by a global state or websocket
      console.log('Message sent:', newMessage);
      
      // Success feedback could be handled by parent component
      return;
      
    } catch (err) {
      setSendError('Error al enviar el mensaje');
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendFileMessage = useCallback(async (file: File, conversationId: string | number) => {
    if (!file) {
      setSendError('No se ha seleccionado ningún archivo');
      return;
    }

    // Validate file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSendError('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/*', 'text/*', 'application/pdf'];
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      setSendError('Tipo de archivo no permitido');
      return;
    }

    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileMessage = {
        id: Date.now(),
        conversationId,
        senderId: 'current-user',
        senderName: 'Usuario Actual',
        content: `📎 ${file.name}`,
        timestamp: new Date().toISOString(),
        type: 'file' as const,
        status: 'sent' as const,
        edited: false,
        attachment: {
          id: `file-${Date.now()}`,
          name: file.name,
          url: URL.createObjectURL(file), // In real app, this would be server URL
          type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
          size: file.size,
          mimeType: file.type
        }
      };

      console.log('File message sent:', fileMessage);
      
    } catch (err) {
      setSendError('Error al enviar el archivo');
      console.error('Error sending file:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!newContent.trim()) {
      setSendError('El mensaje editado no puede estar vacío');
      return;
    }

    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate API call to edit message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Message ${messageId} edited to: "${newContent}"`);
      
      // In real app, this would update the message in global state
      
    } catch (err) {
      setSendError('Error al editar el mensaje');
      console.error('Error editing message:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate API call to delete message
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(`Message ${messageId} deleted`);
      
      // In real app, this would remove the message from global state
      
    } catch (err) {
      setSendError('Error al eliminar el mensaje');
      console.error('Error deleting message:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate API call to add reaction
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`Added reaction ${emoji} to message ${messageId}`);
      
      // In real app, this would update message reactions in global state
      
    } catch (err) {
      setSendError('Error al agregar reacción');
      console.error('Error adding reaction:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    setIsSending(true);
    setSendError(null);
    
    try {
      // Simulate API call to remove reaction
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`Removed reaction ${emoji} from message ${messageId}`);
      
      // In real app, this would update message reactions in global state
      
    } catch (err) {
      setSendError('Error al eliminar reacción');
      console.error('Error removing reaction:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setSendError(null);
  }, []);

  return {
    isSending,
    sendError,
    sendMessage,
    sendFileMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction
  };
}
