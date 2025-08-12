import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: number;
  sender: 'me' | 'other';
  message: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export const useRealtimeMessages = (
  activeConversation: number | null,
  activeConversationType: 'individual' | 'group',
  currentUserId: string | undefined,
  onNewMessage: (message: Message) => void
) => {
  useEffect(() => {
    if (!activeConversation || !currentUserId) return;

    const tableName = activeConversationType === 'group' ? 'group_messages' : 'private_messages';
    const filterColumn = activeConversationType === 'group' ? 'group_id' : 'conversation_id';

    console.log(`🔴 Setting up realtime for ${tableName} with ${filterColumn}=${activeConversation}`);

    const channel: RealtimeChannel = supabase
      .channel(`messages-${activeConversation}-${activeConversationType}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: `${filterColumn}=eq.${activeConversation}`
      }, (payload: any) => {
        console.log('🔴 New message received:', payload);
        
        const newMessageData = payload.new as any;
        
        // Formatear mensaje para la UI
        const formattedMessage: Message = {
          id: newMessageData.id,
          sender: newMessageData.sender_id === currentUserId ? 'me' : 'other',
          message: newMessageData.message,
          timestamp: new Date(newMessageData.created_at).toLocaleTimeString(),
          status: 'delivered'
        };

        // Solo agregar si no es nuestro propio mensaje (ya lo tenemos localmente)
        if (newMessageData.sender_id !== currentUserId) {
          onNewMessage(formattedMessage);
        }
      })
      .subscribe((status: any) => {
        console.log('🔴 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeConversation, activeConversationType, currentUserId, onNewMessage]);
};
