'use client';

import React from 'react';
import { ConversationItemProps, AnyConversation } from '../types/messages.types';
import { cn } from '@/lib/utils';

/**
 * Item individual de conversación en la lista
 * Muestra avatar, nombre, último mensaje, tiempo y badges de estado
 */
export function ConversationItem({ 
  conversation, 
  isActive, 
  onClick, 
  onContextMenu,
  priority = 'normal' 
}: ConversationItemProps & { priority?: 'high' | 'normal' | 'low' }) {
  
  const displayName = getConversationDisplayName(conversation);
  const lastMessageText = getLastMessagePreview(conversation);
  const timeDisplay = formatTimestamp(conversation.timestamp);
  const unreadCount = getUnreadCount(conversation);
  const isOnline = getOnlineStatus(conversation);

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        // Base styles
        "flex items-center p-4 cursor-pointer transition-all duration-200",
        "hover:bg-gray-50 dark:hover:bg-gray-700/50",
        "border-l-4 border-transparent",
        
        // Active state
        isActive && [
          "bg-blue-50 dark:bg-blue-900/20",
          "border-l-blue-500",
          "hover:bg-blue-100 dark:hover:bg-blue-900/30"
        ],
        
        // Priority styling
        priority === 'high' && "bg-orange-50/50 dark:bg-orange-900/10",
        priority === 'low' && "opacity-75",
        
        // Unread indicator
        unreadCount > 0 && !isActive && "bg-gray-50 dark:bg-gray-700/30"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 mr-3">
        <ConversationAvatar conversation={conversation} size="md" />
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name + Time */}
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn(
            "text-sm font-medium truncate",
            isActive 
              ? "text-blue-700 dark:text-blue-300" 
              : "text-gray-900 dark:text-gray-100",
            unreadCount > 0 && "font-semibold"
          )}>
            {displayName}
          </h4>
          <span className={cn(
            "text-xs flex-shrink-0 ml-2",
            isActive 
              ? "text-blue-600 dark:text-blue-400" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {timeDisplay}
          </span>
        </div>

        {/* Last message + Status */}
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm truncate flex-1",
            unreadCount > 0 
              ? "text-gray-900 dark:text-gray-100 font-medium" 
              : "text-gray-600 dark:text-gray-400"
          )}>
            {lastMessageText}
          </p>
          
          {/* Status badges */}
          <div className="flex items-center space-x-1 ml-2">
            {/* Unread count */}
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            
            {/* Status indicators */}
            <ConversationStatusBadges conversation={conversation} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Avatar de conversación (individual o grupo)
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
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  if (conversation.type === 'group') {
    return (
      <div className={cn(
        "rounded-full bg-gradient-to-br from-purple-500 to-pink-500",
        "flex items-center justify-center text-white font-medium",
        sizeClasses[size]
      )}>
        {conversation.name ? conversation.name.charAt(0).toUpperCase() : 'G'}
      </div>
    );
  }

  // For individual conversations, show the other participant's avatar
  // In a real app, this would come from the participant data
  const initials = conversation.name ? 
    conversation.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase() : 
    'U';

  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br from-blue-500 to-teal-500",
      "flex items-center justify-center text-white font-medium",
      sizeClasses[size]
    )}>
      {initials}
    </div>
  );
}

/**
 * Badges de estado de la conversación
 */
function ConversationStatusBadges({ conversation }: { conversation: AnyConversation }) {
  const badges = [];

  // Muted indicator - check status instead
  if (conversation.status === 'muted') {
    badges.push(
      <div key="muted" className="w-4 h-4 text-gray-400" title="Silenciado">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      </div>
    );
  }

  // Archived indicator  
  if (conversation.status === 'archived') {
    badges.push(
      <div key="archived" className="w-4 h-4 text-gray-400" title="Archivado">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex space-x-1">
      {badges}
    </div>
  );
}

// Utility functions
function getConversationDisplayName(conversation: AnyConversation): string {
  if (conversation.type === 'group') {
    return conversation.name || 'Grupo sin nombre';
  }
  
  // For individual conversations, get the other participant's name
  // In a real app, this would be resolved from participants data
  return conversation.name || 'Usuario';
}

function getLastMessagePreview(conversation: AnyConversation): string {
  if (!conversation.lastMessage) {
    return 'No hay mensajes aún';
  }
  
  // lastMessage is a string in our current types
  return conversation.lastMessage;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  } else {
    return date.toLocaleDateString();
  }
}

function getUnreadCount(conversation: AnyConversation): number {
  // Use the unread property from the conversation
  return conversation.unread || 0;
}

function getOnlineStatus(conversation: AnyConversation): boolean {
  // For groups, don't show online status
  if (conversation.type === 'group') return false;
  
  // For individual conversations, use the online property
  return conversation.type === 'individual' ? conversation.online : false;
}
