'use client';

import React, { useState } from 'react';
import { MessageItemProps, Message } from '../types/messages.types';
import { cn } from '@/lib/utils';

/**
 * Item individual de mensaje con diferentes tipos y estados
 * Incluye reacciones, respuestas, edición y menú contextual
 */
export function MessageItem({ 
  message, 
  isOwn, 
  showAvatar = true, 
  showSenderName = true,
  className 
}: MessageItemProps & { 
  showAvatar?: boolean; 
  showSenderName?: boolean; 
  className?: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={cn(
      "group flex gap-3 relative",
      isOwn ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar (only for received messages) */}
      {!isOwn && showAvatar && (
        <MessageAvatar message={message} />
      )}
      
      {/* Spacer when avatar is not shown */}
      {!isOwn && !showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-xs lg:max-w-md xl:max-w-lg",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name (only for received messages) */}
        {!isOwn && showSenderName && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-3">
            {message.senderName}
          </span>
        )}

        {/* Message Bubble */}
        <div 
          className={cn(
            "relative px-4 py-2 rounded-2xl text-sm",
            "transition-all duration-200",
            // Own messages (right side)
            isOwn ? [
              "bg-blue-600 text-white",
              "rounded-br-md"
            ] : [
              "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
              "border border-gray-200 dark:border-gray-600",
              "rounded-bl-md"
            ]
          )}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Message Content by Type */}
          <MessageContent message={message} isOwn={isOwn} />
          
          {/* Edited indicator */}
          {message.edited && (
            <span className={cn(
              "text-xs italic mt-1 block",
              isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
            )}>
              (editado)
            </span>
          )}

          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions 
              reactions={message.reactions}
              isOwn={isOwn}
              onReactionClick={(emoji) => console.log('React with:', emoji)}
            />
          )}
        </div>

        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span>{formatMessageTime(message.timestamp)}</span>
          
          {/* Message status (only for own messages) */}
          {isOwn && (
            <MessageStatusIcon status={message.status} />
          )}
        </div>
      </div>

      {/* Message Actions Menu (shows on hover) */}
      {showMenu && (
        <MessageActionsMenu
          message={message}
          isOwn={isOwn}
          onReaction={() => setShowReactions(!showReactions)}
          onReply={() => console.log('Reply to:', message.id)}
          onEdit={isOwn ? () => console.log('Edit:', message.id) : undefined}
          onDelete={isOwn ? () => console.log('Delete:', message.id) : undefined}
          onCopy={() => navigator.clipboard.writeText(message.content)}
        />
      )}

      {/* Reaction Picker (shows when reaction button is clicked) */}
      {showReactions && (
        <ReactionPicker
          onReactionSelect={(emoji) => {
            console.log('Add reaction:', emoji, 'to message:', message.id);
            setShowReactions(false);
          }}
          onClose={() => setShowReactions(false)}
          position={isOwn ? 'left' : 'right'}
        />
      )}
    </div>
  );
}

/**
 * Avatar del emisor del mensaje
 */
function MessageAvatar({ message }: { message: Message }) {
  const initials = message.senderName 
    ? message.senderName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
      {initials}
    </div>
  );
}

/**
 * Contenido del mensaje según su tipo
 */
function MessageContent({ message, isOwn }: { message: Message; isOwn: boolean }) {
  switch (message.type) {
    case 'text':
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      );
      
    case 'file':
      return (
        <MessageFileAttachment 
          message={message}
          isOwn={isOwn}
        />
      );
      
    default:
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      );
  }
}

/**
 * Archivo adjunto en mensaje
 */
function MessageFileAttachment({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const attachment = message.attachments?.[0]; // Take first attachment
  
  if (!attachment) {
    return <div>{message.content}</div>;
  }

  const isImage = attachment.type === 'image';
  const fileSize = formatFileSize(attachment.size);

  if (isImage) {
    return (
      <div className="space-y-2">
        <img 
          src={attachment.url} 
          alt={attachment.name}
          className="max-w-full h-auto rounded-lg"
          loading="lazy"
        />
        <div className={cn(
          "text-xs",
          isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
        )}>
          {attachment.name} • {fileSize}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg",
      isOwn 
        ? "bg-blue-700 bg-opacity-50" 
        : "bg-gray-100 dark:bg-gray-600"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        isOwn ? "bg-blue-800" : "bg-gray-200 dark:bg-gray-500"
      )}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{attachment.name}</p>
        <p className={cn(
          "text-xs",
          isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
        )}>
          {fileSize}
        </p>
      </div>
      <button className={cn(
        "p-1 rounded hover:bg-opacity-20",
        isOwn ? "hover:bg-white" : "hover:bg-gray-300 dark:hover:bg-gray-400"
      )}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Reacciones del mensaje
 */
function MessageReactions({ 
  reactions, 
  isOwn,
  onReactionClick 
}: { 
  reactions: any[];
  isOwn: boolean;
  onReactionClick: (emoji: string) => void;
}) {
  return (
    <div className={cn(
      "flex flex-wrap gap-1 mt-2",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {reactions.map((reaction, index) => (
        <button
          key={index}
          onClick={() => onReactionClick(reaction.emoji)}
          className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs",
            "hover:bg-opacity-80 transition-colors",
            isOwn 
              ? "bg-blue-500 bg-opacity-20 text-blue-200"
              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Icono de estado del mensaje
 */
function MessageStatusIcon({ status }: { status: string }) {
  const icons = {
    sending: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    sent: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    delivered: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" />
      </svg>
    ),
    read: (
      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        <path d="M13 16.2L8.8 12l-1.4 1.4L13 19 25 7l-1.4-1.4L13 16.2z"/>
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return icons[status as keyof typeof icons] || null;
}

/**
 * Menú de acciones del mensaje
 */
function MessageActionsMenu({ 
  message, 
  isOwn, 
  onReaction, 
  onReply, 
  onEdit, 
  onDelete, 
  onCopy 
}: {
  message: Message;
  isOwn: boolean;
  onReaction: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy: () => void;
}) {
  return (
    <div className={cn(
      "absolute top-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-2 py-1",
      isOwn ? "right-full mr-2" : "left-full ml-2"
    )}>
      {/* Reaction */}
      <button
        onClick={onReaction}
        className="p-1 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
        title="Reaccionar"
      >
        <span className="text-sm">😀</span>
      </button>

      {/* Reply */}
      <button
        onClick={onReply}
        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        title="Responder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      {/* Copy */}
      <button
        onClick={onCopy}
        className="p-1 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
        title="Copiar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Edit (only for own messages) */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
          title="Editar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Delete (only for own messages) */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Selector de reacciones
 */
function ReactionPicker({ 
  onReactionSelect, 
  onClose, 
  position = 'right' 
}: { 
  onReactionSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'left' | 'right';
}) {
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-reaction-picker]')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      data-reaction-picker
      className={cn(
        "absolute top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex space-x-1 z-10",
        position === 'left' ? "right-full mr-2" : "left-full ml-2"
      )}
    >
      {reactions.map(emoji => (
        <button
          key={emoji}
          onClick={() => onReactionSelect(emoji)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Utility functions
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
