// === MESSAGES HOOKS ===
// Centralized exports for all messaging-related hooks

export { useMessagesState } from './useMessagesState';
export { useConversations } from './useConversations';
export { useActiveChat } from './useActiveChat';
export { useMessageSending } from './useMessageSending';
export { useSearchAndFilter, useSimpleSearch } from './useSearchAndFilter';
export { 
  usePerformanceOptimization, 
  useMessagingMemo, 
  useScrollOptimization 
} from './usePerformanceOptimization';

// Types are exported from the types directory
export type * from '../types/messages.types';
