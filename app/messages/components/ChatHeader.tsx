'use client';

import React, { useState } from 'react';
import { ChatHeaderProps, AnyConversation } from '../types/messages.types';
import { cn } from '@/lib/utils';

/**
 * Header del chat con información del contacto/grupo y acciones
 * Incluye estado online, llamadas y menú de opciones
 */
export function ChatHeader({ 
  conversation, 
  onBack, 
  onCall, 
  onVideoCall, 
  onShowInfo,
  className 
}: ChatHeaderProps & { className?: string }) {
  const [showMenu, setShowMenu] = useState(false);

  if (!conversation) return null;

  const isOnline = getOnlineStatus(conversation);
  const participantCount = getParticipantCount(conversation);

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3",
      "border-b border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-800",
      className
    )}>
      {/* Left section: Back button + Avatar + Info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <ConversationAvatar conversation={conversation} size="md" />
          {isOnline && conversation.type === 'individual' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onShowInfo}
            className="text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1 -m-1 transition-colors w-full"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {conversation.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {getStatusText(conversation, isOnline, participantCount)}
            </p>
          </button>
        </div>
      </div>

      {/* Right section: Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Call button */}
        {conversation.type === 'individual' && onCall && (
          <button
            onClick={onCall}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Llamar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        )}

        {/* Video call button */}
        {conversation.type === 'individual' && onVideoCall && (
          <button
            onClick={onVideoCall}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Videollamada"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* More options menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Más opciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <ChatOptionsMenu
              conversation={conversation}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Avatar del chat (similar al de ConversationItem pero optimizado)
 */
function ConversationAvatar({ 
  conversation, 
  size = 'md' 
}: { 
  conversation: AnyConversation; 
  size?: 'sm' | 'md' | 'lg' 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (conversation.type === 'group') {
    return (
      <div className={cn(
        "rounded-full bg-gradient-to-br from-purple-500 to-pink-500",
        "flex items-center justify-center text-white font-semibold",
        sizeClasses[size]
      )}>
        {conversation.name ? conversation.name.charAt(0).toUpperCase() : 'G'}
      </div>
    );
  }

  const initials = conversation.name ? 
    conversation.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 
    'U';

  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br from-blue-500 to-teal-500",
      "flex items-center justify-center text-white font-semibold",
      sizeClasses[size]
    )}>
      {initials}
    </div>
  );
}

/**
 * Menú de opciones del chat
 */
function ChatOptionsMenu({ 
  conversation, 
  onClose 
}: { 
  conversation: AnyConversation; 
  onClose: () => void;
}) {
  const handleAction = (action: string) => {
    console.log(`Action: ${action} for conversation ${conversation.id}`);
    onClose();
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-menu]')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      data-menu
      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
    >
      <button
        onClick={() => handleAction('view-info')}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ver información
      </button>

      <button
        onClick={() => handleAction('search')}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Buscar en mensajes
      </button>

      <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

      <button
        onClick={() => handleAction('mute')}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
        {conversation.status === 'muted' ? 'Reactivar' : 'Silenciar'}
      </button>

      <button
        onClick={() => handleAction('archive')}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
        </svg>
        Archivar chat
      </button>

      <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

      <button
        onClick={() => handleAction('delete')}
        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar chat
      </button>
    </div>
  );
}

// Utility functions
function getOnlineStatus(conversation: AnyConversation): boolean {
  return conversation.type === 'individual' ? conversation.online : false;
}

function getParticipantCount(conversation: AnyConversation): number {
  if (conversation.type === 'group') {
    return conversation.memberCount || 0;
  }
  return 2; // Individual conversation has 2 participants
}

function getStatusText(
  conversation: AnyConversation, 
  isOnline: boolean, 
  participantCount: number
): string {
  if (conversation.type === 'group') {
    return `${participantCount} miembros`;
  }
  
  if (isOnline) {
    return 'En línea';
  }
  
  // For individual chats, show last seen time if available
  const lastSeen = getLastSeenText(conversation);
  return lastSeen || 'Desconectado';
}

function getLastSeenText(conversation: AnyConversation): string {
  // This would come from real presence data
  // For now, return empty string to show "Desconectado"
  return '';
}
