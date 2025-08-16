'use client';

import React from 'react';

interface MessageStatusIconProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente de indicadores de estado de mensajes
 * Equivalente a los indicadores de WhatsApp:
 * ⏰ Enviando
 * ✓ Enviado  
 * ✓✓ Entregado
 * ✓✓ (azul) Leído
 */
export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ 
  status, 
  className = '', 
  size = 'sm' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  switch (status) {
    case 'sending':
      return (
        <div className={`${iconSize} ${className}`} title="Enviando...">
          <svg className="text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );

    case 'sent':
      return (
        <div className={`${iconSize} ${className}`} title="Enviado">
          <svg className="text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );

    case 'delivered':
      return (
        <div className={`relative ${iconSize} ${className}`} title="Entregado">
          <svg className="text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <svg className="text-gray-500 absolute -right-1 top-0 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );

    case 'read':
      return (
        <div className={`relative ${iconSize} ${className}`} title="Leído">
          <svg className="text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <svg className="text-blue-500 absolute -right-1 top-0 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

interface MessageStatusTextProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: string;
  className?: string;
}

/**
 * Componente de texto de estado de mensaje
 * Muestra el estado y timestamp de forma legible
 */
export const MessageStatusText: React.FC<MessageStatusTextProps> = ({ 
  status, 
  timestamp, 
  className = '' 
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Enviando...';
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'read':
        return 'Leído';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-gray-400';
      case 'sent':
        return 'text-gray-500';
      case 'delivered':
        return 'text-gray-600';
      case 'read':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${getStatusColor()} ${className}`}>
      <MessageStatusIcon status={status} size="sm" />
      <span>{getStatusText()}</span>
      {timestamp && (
        <span className="text-gray-400 ml-1">
          {formatTimestamp(timestamp)}
        </span>
      )}
    </div>
  );
};

interface MessageStatusBadgeProps {
  unreadCount?: number;
  className?: string;
}

/**
 * Badge de mensajes no leídos
 * Equivalente al contador de WhatsApp
 */
export const MessageStatusBadge: React.FC<MessageStatusBadgeProps> = ({ 
  unreadCount = 0, 
  className = '' 
}) => {
  if (unreadCount <= 0) return null;

  return (
    <div className={`
      inline-flex items-center justify-center 
      min-w-[1.25rem] h-5 px-1
      bg-green-500 text-white text-xs font-medium
      rounded-full
      ${className}
    `}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

interface ConversationStatusIndicatorProps {
  lastMessageStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  unreadCount?: number;
  timestamp?: string;
  className?: string;
}

/**
 * Indicador de estado para lista de conversaciones
 * Combina estado del último mensaje y contador de no leídos
 */
export const ConversationStatusIndicator: React.FC<ConversationStatusIndicatorProps> = ({
  lastMessageStatus,
  unreadCount = 0,
  timestamp,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        {lastMessageStatus && (
          <MessageStatusIcon status={lastMessageStatus} size="sm" />
        )}
        {timestamp && (
          <span className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
      
      <MessageStatusBadge unreadCount={unreadCount} />
    </div>
  );
};

export default MessageStatusIcon;
