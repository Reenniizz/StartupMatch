'use client';

import React, { useEffect, useRef } from 'react';
import { ChatAreaProps, Message, AnyConversation } from '../types/messages.types';
import { ChatHeader } from './ChatHeader';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { cn } from '@/lib/utils';

/**
 * Área principal de chat con mensajes y input
 * Incluye scroll automático y virtualización para listas grandes
 */
export function ChatArea({
  conversation,
  messages,
  onSendMessage,
  isLoading,
  typingUsers,
  className
}: ChatAreaProps & { className?: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    try {
      await onSendMessage(content);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!conversation) {
    return (
      <div className={cn("flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <EmptyChatState />
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col bg-white dark:bg-gray-800", className)}>
      {/* Chat Header */}
      <ChatHeader
        conversation={conversation}
        onBack={() => console.log('Go back')}
        onCall={() => console.log('Start call')}
        onVideoCall={() => console.log('Start video call')}
      />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900"
      >
        {isLoading && messages.length === 0 ? (
          <MessagesLoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <EmptyMessagesState conversation={conversation} />
            ) : (
              <>
                {/* Messages List */}
                <MessagesList
                  messages={messages}
                  currentUserId="current-user" // This would come from auth context
                />
                
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <TypingIndicators typingUsers={typingUsers} />
                )}
              </>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={`Mensaje para ${getConversationName(conversation)}`}
      />
    </div>
  );
}

/**
 * Lista de mensajes agrupados por fecha y usuario
 */
function MessagesList({ 
  messages, 
  currentUserId 
}: { 
  messages: Message[]; 
  currentUserId: string; 
}) {
  // Group messages by date for better organization
  const groupedMessages = React.useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  }, [messages]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([date, dayMessages]) => (
        <div key={date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-full">
              {formatDateSeparator(date)}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dayMessages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar = shouldShowAvatar(dayMessages, index, isOwn);
              const showSenderName = shouldShowSenderName(dayMessages, index, isOwn);
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showSenderName={showSenderName}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Indicadores de escritura
 */
function TypingIndicators({ typingUsers }: { typingUsers: any[] }) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <div className="flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {typingUsers.length === 1
          ? `${typingUsers[0].userName} está escribiendo...`
          : `${typingUsers.length} personas están escribiendo...`
        }
      </span>
    </div>
  );
}

/**
 * Estado vacío cuando no hay conversación seleccionada
 */
function EmptyChatState() {
  return (
    <div className="text-center p-8 max-w-md">
      <div className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
        Selecciona una conversación
      </h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
        Elige una conversación de la lista para empezar a chatear con otros emprendedores y colaboradores.
      </p>
    </div>
  );
}

/**
 * Estado vacío cuando la conversación no tiene mensajes
 */
function EmptyMessagesState({ conversation }: { conversation: AnyConversation }) {
  return (
    <div className="text-center p-8">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V9h2v2zm0-4h-2V5h2v2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Empieza la conversación
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Envía el primer mensaje a {getConversationName(conversation)}
      </p>
    </div>
  );
}

/**
 * Skeleton de carga para mensajes
 */
function MessagesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={cn(
          "flex space-x-3",
          i % 2 === 0 ? "justify-start" : "justify-end"
        )}>
          {i % 2 === 0 && (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          )}
          <div className={cn(
            "space-y-2",
            i % 2 === 0 ? "max-w-xs" : "max-w-xs"
          )}>
            <div className={cn(
              "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
              i % 2 === 0 ? "w-full" : "w-3/4 ml-auto"
            )} />
            <div className={cn(
              "h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse",
              i % 2 === 0 ? "w-2/3" : "w-full ml-auto"
            )} />
          </div>
          {i % 2 === 1 && (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}

// Utility functions
function getConversationName(conversation: AnyConversation): string {
  return conversation.name || 'Usuario';
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

function shouldShowAvatar(messages: Message[], index: number, isOwn: boolean): boolean {
  if (isOwn) return false; // Don't show avatar for own messages
  
  // Show avatar if it's the last message from this sender in a sequence
  const nextMessage = messages[index + 1];
  return !nextMessage || nextMessage.senderId !== messages[index].senderId;
}

function shouldShowSenderName(messages: Message[], index: number, isOwn: boolean): boolean {
  if (isOwn) return false; // Don't show name for own messages
  
  // Show name if it's the first message from this sender in a sequence
  const prevMessage = messages[index - 1];
  return !prevMessage || prevMessage.senderId !== messages[index].senderId;
}
