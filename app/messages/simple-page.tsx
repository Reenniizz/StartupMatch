'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  ArrowDown,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  sender: 'me' | 'other';
  message: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered';
  tempId?: string;
}

interface Conversation {
  id: string;
  other_user_name: string;
  other_user_id: string;
  last_message: string;
  last_message_time: string;
  unread?: number;
}

// Función para formatear tiempo de manera segura
const formatTime = (timestamp: string | Date): string => {
  try {
    if (!timestamp) return '--:--';
    
    const date = new Date(timestamp);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    // Formatear solo la hora
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Formato 24 horas
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '--:--';
  }
};

export default function ModernMessagesPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Función para marcar mensajes como entregados
  const markMessagesAsDelivered = async (messageIds: number[]) => {
    if (messageIds.length === 0) return;
    
    try {
      const response = await fetch('/api/messages/mark-delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.delivered} mensajes marcados como entregados`);
      } else {
        console.warn('⚠️ Error marcando mensajes como entregados');
      }
    } catch (error) {
      console.error('Error marcando mensajes como entregados:', error);
    }
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll management
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setIsUserScrolledUp(!isAtBottom);
      setShowScrollToBottom(!isAtBottom && messages.length > 0);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setIsUserScrolledUp(false);
    setShowScrollToBottom(false);
  };

  useEffect(() => {
    if (messages.length > 0 && !isUserScrolledUp) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages]);

  // Get user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      setUser(user);
    };
    getUser();
  }, []);

  // Socket.IO setup
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Conectando a Socket.IO...');
    
    const socketConnection = io('http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      forceNew: true,
      timeout: 20000
    });

    socketConnection.on('connect', () => {
      console.log('✅ Socket.IO conectado:', socketConnection.id);
      setIsConnected(true);
      socketConnection.emit('join-user', user.id);
    });

    socketConnection.on('disconnect', () => {
      console.log('❌ Socket.IO desconectado');
      setIsConnected(false);
    });

    socketConnection.on('new-message', (message: Message) => {
      console.log('📨 Nuevo mensaje recibido:', message);
      setMessages(prev => [...prev, message]);
    });

    // ✅ MANEJAR MENSAJES OFFLINE
    socketConnection.on('offline-message', (message: Message) => {
      console.log('📬 Mensaje offline recibido:', message);
      setMessages(prev => {
        // Evitar duplicados verificando si ya existe el mensaje
        const exists = prev.some(m => m.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    });

    // Manejar múltiples mensajes offline de una vez
    socketConnection.on('offline-messages-batch', (messages: Message[]) => {
      console.log(`📬 Recibidos ${messages.length} mensajes offline en lote`);
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = messages.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });

      // Marcar mensajes como entregados
      if (messages.length > 0) {
        markMessagesAsDelivered(messages.map(m => m.id));
      }
    });

    socketConnection.on('message-sent', (data) => {
      console.log('✅ Mensaje enviado confirmado:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === data.tempId 
            ? { ...msg, status: 'sent', id: data.messageId }
            : msg
        )
      );
    });

    socketConnection.on('message-error', (data) => {
      console.error('❌ Error enviando mensaje:', data);
      setMessages(prev => prev.filter(msg => msg.tempId !== data.tempId));
      alert(`Error enviando mensaje: ${data.error}`);
    });

    setSocket(socketConnection);

    return () => {
      console.log('🧹 Limpiando conexión Socket.IO');
      socketConnection.disconnect();
    };
  }, [user]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Load messages
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/private-messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle conversation select
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
    
    if (socket && isConnected) {
      socket.emit('join-conversation', conversation.id);
    }

    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage: Message = {
      id: -1,
      sender: 'me',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
      tempId
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      if (socket && isConnected) {
        socket.emit('send-message', {
          conversationId: selectedConversation.id,
          message: optimisticMessage.message,
          userId: user.id,
          tempId
        });
      } else {
        const response = await fetch('/api/private-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            message: optimisticMessage.message
          })
        });

        if (response.ok) {
          const result = await response.json();
          setMessages(prev => 
            prev.map(msg => 
              msg.tempId === tempId 
                ? { ...msg, status: 'sent', id: result.messageData.id }
                : msg
            )
          );
        } else {
          throw new Error('Error enviando mensaje');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      alert('Error enviando mensaje');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    (conv.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.last_message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <ModernLoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
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
            <ModernConversationsList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              searchQuery={searchQuery}
              isConnected={isConnected}
              onConversationSelect={handleConversationSelect}
              onSearchChange={setSearchQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {selectedConversation ? (
          <ModernChatArea
            conversation={selectedConversation}
            messages={messages}
            newMessage={newMessage}
            isConnected={isConnected}
            showScrollToBottom={showScrollToBottom}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            onSendMessage={handleSendMessage}
            onMessageChange={setNewMessage}
            onScroll={handleScroll}
            onScrollToBottom={() => scrollToBottom()}
            onShowSidebar={() => setShowSidebar(true)}
            isMobile={isMobile}
          />
        ) : (
          <ModernEmptyState 
            onShowSidebar={() => setShowSidebar(true)}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}

// Modern Conversations List Component
function ModernConversationsList({
  conversations,
  selectedConversation,
  searchQuery,
  isConnected,
  onConversationSelect,
  onSearchChange
}: {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  searchQuery: string;
  isConnected: boolean;
  onConversationSelect: (conversation: Conversation) => void;
  onSearchChange: (query: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Mensajes
          </h1>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'En línea' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <motion.div
            key={conversation.id}
            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onConversationSelect(conversation)}
            className={cn(
              "p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors",
              selectedConversation?.id === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {(conversation.other_user_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {conversation.other_user_name || 'Usuario Desconocido'}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatTime(conversation.last_message_time)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conversation.last_message || 'Sin mensajes'}
                  </p>
                  {conversation.unread && conversation.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Modern Chat Area Component
function ModernChatArea({
  conversation,
  messages,
  newMessage,
  isConnected,
  showScrollToBottom,
  messagesContainerRef,
  messagesEndRef,
  onSendMessage,
  onMessageChange,
  onScroll,
  onScrollToBottom,
  onShowSidebar,
  isMobile
}: {
  conversation: Conversation;
  messages: Message[];
  newMessage: string;
  isConnected: boolean;
  showScrollToBottom: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (e: React.FormEvent) => void;
  onMessageChange: (value: string) => void;
  onScroll: () => void;
  onScrollToBottom: () => void;
  onShowSidebar: () => void;
  isMobile: boolean;
}) {
  return (
    <>
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={onShowSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {(conversation.other_user_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {conversation.other_user_name || 'Usuario Desconocido'}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-500">En línea</span>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-4 relative"
      >
        {messages.map((message, index) => (
          <motion.div
            key={message.tempId || message.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex",
              message.sender === 'me' ? 'justify-end' : 'justify-start'
            )}
          >
            <div className={cn(
              "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm",
              message.sender === 'me'
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md"
            )}>
              <p className="text-sm leading-relaxed">{message.message}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  "text-xs",
                  message.sender === 'me' 
                    ? "text-blue-100" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {formatTime(message.timestamp)}
                </span>
                {message.sender === 'me' && (
                  <span className="text-blue-100 ml-2">
                    {message.status === 'sending' ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : message.status === 'sent' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onScrollToBottom}
              className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg z-10 transition-colors"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={onSendMessage} className="flex items-end space-x-3">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage(e);
                }
              }}
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={cn(
              "p-3 rounded-2xl transition-all duration-200",
              newMessage.trim()
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  );
}

// Modern Empty State Component
function ModernEmptyState({
  onShowSidebar,
  isMobile
}: {
  onShowSidebar: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-md">
        {isMobile && (
          <button
            onClick={onShowSidebar}
            className="mb-6 flex items-center justify-center w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ver Conversaciones
          </button>
        )}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
        >
          <MessageCircle className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Bienvenido a Mensajes
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Conecta con otros emprendedores, colaboradores y miembros de la comunidad StartupMatch. 
            Inicia conversaciones para hacer networking y colaborar en proyectos.
          </p>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              <Users className="w-5 h-5 mr-2" />
              Explorar Comunidad
            </button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              O selecciona una conversación existente para comenzar a chatear
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Modern Loading Skeleton Component
function ModernLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
      
      {/* Main chat area skeleton */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
