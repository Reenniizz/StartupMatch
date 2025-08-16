'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { MessagesLayoutProps, AnyConversation, Message, ViewMode } from '../types/messages.types';
import { 
  useMessagesState, 
  useConversations, 
  useActiveChat
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

  // Main state management
  const {
    conversations: individualConversations,
    groupConversations,
    activeConversation: activeConversationId,
    messages,
    viewMode,
    searchQuery,
    isLoading,
    error,
    setActiveConversation,
    setViewMode,
    setSearchQuery
  } = useMessagesState();

  // Conversations management
  const {
    createConversation
  } = useConversations();

  // Active chat management
  const {
    messages: activeMessages
  } = useActiveChat();

  // UI State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Combine conversations for the list
  const allConversations: AnyConversation[] = [
    ...individualConversations,
    ...groupConversations
  ];

  // Get current active conversation
  const currentActiveConversation = allConversations.find(c => c.id === activeConversationId);

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

  // Handlers
  const handleConversationSelect = (conversationId: string | number) => {
    // Determine conversation type
    const isGroup = groupConversations.some(c => c.id === conversationId);
    const type = isGroup ? 'group' : 'individual';
    
    setActiveConversation(conversationId, type);

    // On mobile, hide sidebar when selecting conversation
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !user) return;
    
    try {
      // This would integrate with the actual sendMessage hook
      console.log('Sending message:', content, 'to conversation:', activeConversationId);
      // await sendMessage(activeConversationId, content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      const groupName = groupData.name;
      await createConversation(groupName);
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
    { 
      id: '2', 
      name: 'Carlos López', 
      avatar: '/avatars/carlos.jpg',
      role: 'member' as const,
      joinedAt: new Date().toISOString()
    },
    { 
      id: '3', 
      name: 'María Rodríguez', 
      avatar: '/avatars/maria.jpg',
      role: 'member' as const,
      joinedAt: new Date().toISOString()
    },
    { 
      id: '4', 
      name: 'David Martín', 
      avatar: '/avatars/david.jpg',
      role: 'admin' as const,
      joinedAt: new Date().toISOString()
    },
  ];

  return (
    <div className={cn("flex h-screen bg-gray-100 dark:bg-gray-900", className)}>
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
              conversations={allConversations}
              activeConversationId={activeConversationId}
              viewMode={viewMode}
              searchQuery={searchQuery}
              isLoading={isLoading}
              error={error}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentActiveConversation ? (
          <ChatArea
            conversation={currentActiveConversation}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            typingUsers={[]} // Will be populated by real-time updates
            className={cn(isMobile && "relative")}
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
        isLoading={isLoading}
      />
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
