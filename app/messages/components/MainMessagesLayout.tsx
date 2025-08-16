'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { AnyConversation, Message, ViewMode } from '../types/messages.types';
import { 
  useConversations, 
  useActiveChat,
  useMessageSending
} from '../hooks';
import {
  ConversationsList,
  ChatArea,
  GroupCreationModal
} from '../components';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users } from 'lucide-react';

/**
 * Layout principal de mensajes que integra todos los componentes modulares
 * Maneja el estado global y la comunicación entre componentes
 */
export function MainMessagesLayout({
  className
}: { className?: string }) {
  
  // Auth context
  const { user } = useAuth();

  // Conversations management
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    loadConversations,
    createConversation
  } = useConversations();

  // Message sending
  const {
    sendMessage,
    isSending,
    sendError
  } = useMessageSending();

  // Active chat management
  const {
    activeConversation,
    messages: activeMessages,
    loadingMessages,
    loadMessages,
    addMessage
  } = useActiveChat();

  // UI State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Find current active conversation
  const currentActiveConversation = conversations.find(c => c.id === selectedConversationId) || null;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile); // Hide sidebar on mobile by default
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  // Handlers
  const handleConversationSelect = (conversationId: string | number) => {
    setSelectedConversationId(conversationId);

    // On mobile, hide sidebar when selecting conversation
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user) return;
    
    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: Date.now(), // Temporary ID
        conversationId: selectedConversationId,
        senderId: 'current-user',
        senderName: 'Tú',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sending',
        edited: false
      };

      // Add message to UI immediately (optimistic update)
      addMessage(optimisticMessage);

      // Send message to API
      await sendMessage(content, selectedConversationId);
      
      // Reload messages after a short delay to get the real message from server
      setTimeout(() => {
        loadMessages(selectedConversationId);
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Reload messages to ensure consistency (removes failed optimistic message)
      setTimeout(() => loadMessages(selectedConversationId), 100);
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      // For now, just close the modal since group creation needs more work
      console.log('Group creation not implemented yet:', groupData);
      setShowGroupModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowSidebar(true);
  };

  // Mock available users for group creation
  const availableUsers = [
    { 
      id: '1', 
      name: 'Ana García', 
      avatar: '/avatars/ana.jpg',
      role: 'member' as const,
      joinedAt: new Date().toISOString()
    },
  ];

  return (
    <div className={cn("flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden", className)}>
      {/* Sidebar - Conversations List */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: isMobile ? -320 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? -320 : 0, opacity: isMobile ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
              isMobile ? "absolute inset-y-0 left-0 z-50 w-80" : "w-80 flex-shrink-0"
            )}
          >
            <ConversationsList
              conversations={conversations}
              activeConversationId={selectedConversationId}
              viewMode={viewMode}
              searchQuery={searchQuery}
              isLoading={conversationsLoading}
              error={conversationsError}
              onConversationSelect={handleConversationSelect}
              onSearchChange={setSearchQuery}
              onViewModeChange={setViewMode}
              onCreateConversation={() => setShowGroupModal(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleBackToConversations}
        />
      )}

      {/* Main Chat Area - Takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {currentActiveConversation ? (
          <ChatArea
            conversation={currentActiveConversation}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isLoading={loadingMessages || isSending}
            typingUsers={[]} // Will be populated by real-time updates
            className="flex-1"
          />
        ) : (
          <EmptyMainState 
            onCreateGroup={() => setShowGroupModal(true)}
            onShowConversations={handleBackToConversations}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Group Creation Modal */}
      <GroupCreationModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreateGroup={handleCreateGroup}
        availableUsers={availableUsers}
        isLoading={conversationsLoading}
      />
      
      {/* Error Display */}
      {(sendError || conversationsError) && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          {sendError || conversationsError}
        </div>
      )}
    </div>
  );
}

/**
 * Estado vacío cuando no hay conversación seleccionada
 */
function EmptyMainState({ 
  onCreateGroup, 
  onShowConversations,
  isMobile 
}: { 
  onCreateGroup: () => void;
  onShowConversations: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-md">
        {/* Mobile: Show conversations button */}
        {isMobile && (
          <Button
            onClick={onShowConversations}
            variant="outline"
            className="mb-6 w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ver Conversaciones
          </Button>
        )}

        {/* Welcome message */}
        <div className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Bienvenido a Mensajes
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Conecta con otros emprendedores, colaboradores y miembros de la comunidad StartupMatch. 
          Inicia conversaciones individuales o crea grupos para proyectos específicos.
        </p>

        <div className="space-y-3">
          <Button onClick={onCreateGroup} className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Crear Grupo
          </Button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            O selecciona una conversación de la lista para comenzar a chatear
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainMessagesLayout;

// Re-export for backward compatibility
export { MainMessagesLayout as MessagesLayout };
