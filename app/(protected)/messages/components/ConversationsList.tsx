'use client';

import React from 'react';
import { ConversationsListProps } from '../types/messages.types';
import { ConversationItem } from './ConversationItem';
import { SearchBar } from './SearchBar';
import { ViewModeToggle } from './ViewModeToggle';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

/**
 * Lista principal de conversaciones con búsqueda y filtros
 * Incluye header con controles y lista virtualizada para performance
 */
export function ConversationsList({
  conversations,
  activeConversationId,
  viewMode,
  searchQuery,
  isLoading,
  error,
  onConversationSelect,
  onSearchChange,
  onViewModeChange,
  onCreateConversation,
  className
}: ConversationsListProps) {
  
  // Filter conversations based on search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const matchesName = conv.name?.toLowerCase().includes(query);
      const matchesLastMessage = conv.lastMessage?.toLowerCase().includes(query);
      
      return matchesName || matchesLastMessage;
    });
  }, [conversations, searchQuery]);

  // Group conversations by status for better UX
  const groupedConversations = React.useMemo(() => {
    const unread = filteredConversations.filter(conv => conv.unread && conv.unread > 0);
    const read = filteredConversations.filter(conv => !conv.unread || conv.unread === 0);
    const archived = filteredConversations.filter(conv => conv.status === 'archived');
    
    return { unread, read, archived };
  }, [filteredConversations]);

  const handleConversationClick = (conversationId: string | number) => {
    onConversationSelect(conversationId);
  };

  const handleCreateNew = () => {
    onCreateConversation?.();
  };

  if (error) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <ConversationsHeader
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={onSearchChange}
          onViewModeChange={onViewModeChange}
          onCreateConversation={handleCreateNew}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error al cargar conversaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-800", className)}>
      {/* Header con búsqueda y controles */}
      <ConversationsHeader
        searchQuery={searchQuery}
        viewMode={viewMode}
        onSearchChange={onSearchChange}
        onViewModeChange={onViewModeChange}
        onCreateConversation={handleCreateNew}
      />

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationsLoadingSkeleton />
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <EmptySearchResults searchQuery={searchQuery} />
          ) : (
            <EmptyConversations onCreateConversation={handleCreateNew} />
          )
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Conversaciones no leídas */}
            {groupedConversations.unread.length > 0 && (
              <ConversationSection
                title="No leídas"
                conversations={groupedConversations.unread}
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationClick}
                priority="high"
              />
            )}
            
            {/* Conversaciones recientes */}
            {groupedConversations.read.length > 0 && (
              <ConversationSection
                title={groupedConversations.unread.length > 0 ? "Recientes" : undefined}
                conversations={groupedConversations.read}
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationClick}
                priority="normal"
              />
            )}
            
            {/* Conversaciones archivadas (solo en modo "Todas") */}
            {viewMode === 'all' && groupedConversations.archived.length > 0 && (
              <ConversationSection
                title="Archivadas"
                conversations={groupedConversations.archived}
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationClick}
                priority="low"
                isCollapsible={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Header de la lista con búsqueda y controles
 */
function ConversationsHeader({
  searchQuery,
  viewMode,
  onSearchChange,
  onViewModeChange,
  onCreateConversation
}: {
  searchQuery: string;
  viewMode: any;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: any) => void;
  onCreateConversation: () => void;
}) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Mensajes
        </h2>
        <button
          onClick={onCreateConversation}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Nueva conversación"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <SearchBar
        query={searchQuery}
        onQueryChange={onSearchChange}
        placeholder="Buscar conversaciones..."
      />
      
      <ViewModeToggle
        currentMode={viewMode}
        onModeChange={onViewModeChange}
      />
    </div>
  );
}

/**
 * Sección de conversaciones agrupadas
 */
function ConversationSection({
  title,
  conversations,
  activeConversationId,
  onConversationSelect,
  priority,
  isCollapsible = false
}: {
  title?: string;
  conversations: any[];
  activeConversationId: string | number | null;
  onConversationSelect: (id: string | number) => void;
  priority: 'high' | 'normal' | 'low';
  isCollapsible?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title} ({conversations.length})
          </h3>
          {isCollapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <svg 
                className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {!isCollapsed && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {conversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => onConversationSelect(conversation.id)}
              priority={priority}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton de carga
 */
function ConversationsLoadingSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Estado vacío cuando no hay resultados de búsqueda
 */
function EmptySearchResults({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No se encontraron conversaciones
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        No hay conversaciones que coincidan con "{searchQuery}"
      </p>
    </div>
  );
}

/**
 * Estado vacío cuando no hay conversaciones
 */
function EmptyConversations({ onCreateConversation }: { onCreateConversation: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No tienes conversaciones aún
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Comienza una nueva conversación con otros emprendedores
      </p>
      <button
        onClick={onCreateConversation}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Iniciar conversación
      </button>
    </div>
  );
}
