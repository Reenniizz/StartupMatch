// === MESSAGES COMPONENTS ===
// Centralized exports for all messaging UI components

// Layout components
export { MessagesLayout, MessagesSidebar, MessagesChatArea } from './MessagesLayout';
export { MainMessagesLayout } from './MainMessagesLayout';

// List components  
export { ConversationsList } from './ConversationsList';
export { ConversationItem } from './ConversationItem';
export { SearchBar } from './SearchBar';
export { ViewModeToggle, ViewModeToggleWithCounts } from './ViewModeToggle';

// Chat components
export { ChatArea } from './ChatArea';
export { ChatHeader } from './ChatHeader';
export { MessageItem } from './MessageItem';
export { MessageInput } from './MessageInput';

// Modal components (Phase 4 - Advanced Features)
export { GroupCreationModal } from './GroupCreationModal';

// Types are exported from the parent level
export type * from '../types/messages.types';
