/**
 * Messages Module - TypeScript Definitions
 * Comprehensive type system for messaging functionality
 */

// === CORE ENTITIES ===

export type ConversationType = 'individual' | 'group';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';
export type ViewMode = 'all' | 'individual' | 'groups';
export type ConversationStatus = 'active' | 'archived' | 'muted' | 'blocked';

// Individual conversation interface
export interface Conversation {
  id: string | number;
  name: string;
  company?: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  isMatch: boolean;
  type: 'individual';
  status: ConversationStatus;
  // Profile info
  profileInfo?: {
    role?: string;
    location?: string;
    industries?: string[];
    matchScore?: number;
  };
}

// Group conversation interface  
export interface GroupConversation {
  id: string | number;
  name: string;
  description: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  memberCount: number;
  isPrivate: boolean;
  type: 'group';
  category: string;
  status: ConversationStatus;
  // Group specific
  createdBy?: string;
  members?: GroupMember[];
  permissions?: GroupPermissions;
}

// Union type for both conversation types
export type AnyConversation = Conversation | GroupConversation;

// Message interface
export interface Message {
  id: number | string;
  conversationId: string | number;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  type: 'text' | 'file' | 'image' | 'system';
  // Optional fields
  replyTo?: string; // ID of message being replied to
  edited?: boolean;
  editedAt?: string;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

// === GROUP MANAGEMENT ===

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  lastSeen?: string;
}

export interface GroupPermissions {
  canInvite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canModerate: boolean;
}

export interface GroupForm {
  name: string;
  description: string;
  isPrivate: boolean;
  allowInvites: boolean;
  category: string;
  selectedMembers: string[];
}

// === MESSAGE FEATURES ===

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'video';
  size: number;
  mimeType: string;
}

export interface TypingIndicator {
  conversationId: string | number;
  userId: string;
  userName: string;
  timestamp: string;
}

// === SEARCH AND FILTERING ===

export interface SearchFilters {
  query: string;
  type: ViewMode;
  status: ConversationStatus | 'all';
  hasUnread: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface SearchResult {
  conversations: AnyConversation[];
  messages: Message[];
  totalResults: number;
}

// === HOOK RETURN TYPES ===

export interface UseMessagesStateReturn {
  // Conversations
  conversations: Conversation[];
  groupConversations: GroupConversation[];
  
  // Active conversation
  activeConversation: string | number | null;
  activeConversationType: ConversationType;
  
  // Messages
  messages: Message[];
  
  // UI State  
  viewMode: ViewMode;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveConversation: (id: string | number | null, type: ConversationType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export interface UseConversationsReturn {
  conversations: AnyConversation[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (userId: string) => Promise<Conversation>;
  createGroupConversation: (form: GroupForm) => Promise<GroupConversation>;
  updateConversation: (id: string | number, updates: Partial<AnyConversation>) => void;
  deleteConversation: (id: string | number) => void;
  loadConversations: () => Promise<void>;
  
  // Status management
  markAsRead: (id: string | number) => void;
  markAsUnread: (id: string | number) => void;
  archiveConversation: (id: string | number) => void;
  muteConversation: (id: string | number) => void;
}

export interface UseActiveChatReturn {
  // Current conversation
  activeConversation: AnyConversation | null;
  messages: Message[];
  
  // Loading states
  loadingMessages: boolean;
  loadingConversation: boolean;
  
  // Typing indicators
  typingUsers: TypingIndicator[];
  
  // Actions
  loadMessages: (conversationId: string | number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markMessagesAsRead: () => void;
  addMessage: (message: Message) => void;
  
  // Real-time
  setTyping: (isTyping: boolean) => void;
}

export interface UseMessageSendingReturn {
  // Sending state
  isSending: boolean;
  sendError: string | null;
  
  // Actions
  sendMessage: (content: string, conversationId: string | number) => Promise<void>;
  sendFileMessage: (file: File, conversationId: string | number) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Reactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

export interface UseSearchAndFilterReturn {
  // Search state
  searchQuery: string;
  filters: SearchFilters;
  results: SearchResult | null;
  isSearching: boolean;
  
  // Filtered data
  filteredConversations: AnyConversation[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  performSearch: (query: string, filters?: Partial<SearchFilters>) => Promise<void>;
}

// === COMPONENT PROPS ===

export interface MessagesLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface ConversationsListProps {
  conversations: AnyConversation[];
  activeConversationId: string | number | null;
  viewMode: ViewMode;
  searchQuery: string;
  isLoading: boolean;
  error?: string | null;
  onConversationSelect: (id: string | number) => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateConversation?: () => void;
  className?: string;
}

export interface ConversationItemProps {
  conversation: AnyConversation;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export interface ChatAreaProps {
  conversation: AnyConversation | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  typingUsers: TypingIndicator[];
}

export interface ChatHeaderProps {
  conversation: AnyConversation | null;
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onShowInfo?: () => void;
}

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReaction?: (emoji: string) => void;
}

export interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendFile?: (file: File) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  isTyping?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
}

export interface GroupCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (form: GroupForm) => Promise<void>;
  availableUsers: GroupMember[];
  isLoading?: boolean;
  className?: string;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  placeholder?: string;
}

export interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  conversationCounts: {
    all: number;
    individual: number;
    groups: number;
  };
}

// === SOCKET EVENTS ===

export interface SocketEvents {
  // Message events
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: string) => void;
  'message:read': (data: { conversationId: string, userId: string, messageId: string }) => void;
  
  // Typing events
  'typing:start': (data: TypingIndicator) => void;
  'typing:stop': (data: { conversationId: string, userId: string }) => void;
  
  // Conversation events
  'conversation:updated': (conversation: AnyConversation) => void;
  'conversation:deleted': (conversationId: string) => void;
  
  // User events
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
}

// === UTILITY TYPES ===

export interface MessagesConfig {
  maxMessageLength: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableReactions: boolean;
  enableGroupChats: boolean;
  enableFileSharing: boolean;
  autoDeleteAfterDays?: number;
}

export interface MessagesTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  messageBackground: string;
  ownMessageBackground: string;
  textColor: string;
  timestampColor: string;
  borderRadius: string;
}

// === PERFORMANCE OPTIMIZATION ===

export interface PerformanceMetrics {
  conversationRenders: number;
  messageRenders: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

// Export aliases for external usage  
export type {
  // Core interfaces with aliases
  Conversation as IndividualConversation,
  GroupConversation as GroupChat,
  Message as ChatMessage,
  
  // Union types
  AnyConversation as ConversationUnion,
};
