'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { AnyConversation, Message, PerformanceMetrics } from '../types/messages.types';

/**
 * Hook para optimizaciones de rendimiento en mensajería
 * Incluye memoización, virtualización y métricas de performance
 */
export function usePerformanceOptimization(
  conversations: AnyConversation[],
  messages: Message[],
  windowSize: number = 50
) {
  const renderMetrics = useRef<PerformanceMetrics>({
    conversationRenders: 0,
    messageRenders: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0
  });

  // Virtual scrolling for large conversation lists
  const useVirtualizedConversations = useCallback((
    scrollTop: number,
    containerHeight: number,
    itemHeight: number = 80
  ) => {
    return useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 5, // 5 buffer items
        conversations.length
      );

      return {
        startIndex: Math.max(0, startIndex - 2), // 2 buffer items before
        endIndex,
        visibleConversations: conversations.slice(
          Math.max(0, startIndex - 2),
          endIndex
        ),
        totalHeight: conversations.length * itemHeight,
        offsetY: Math.max(0, startIndex - 2) * itemHeight
      };
    }, [scrollTop, containerHeight, itemHeight, conversations]);
  }, [conversations]);

  // Virtual scrolling for messages in chat
  const useVirtualizedMessages = useCallback((
    scrollTop: number,
    containerHeight: number,
    itemHeight: number = 60
  ) => {
    return useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 10, // More buffer for messages
        messages.length
      );

      return {
        startIndex: Math.max(0, startIndex - 5), // More buffer items before
        endIndex,
        visibleMessages: messages.slice(
          Math.max(0, startIndex - 5),
          endIndex
        ),
        totalHeight: messages.length * itemHeight,
        offsetY: Math.max(0, startIndex - 5) * itemHeight
      };
    }, [scrollTop, containerHeight, itemHeight, messages]);
  }, [messages]);

  // Memoized conversation grouping
  const groupedConversations = useMemo(() => {
    const startTime = performance.now();
    
    const groups = {
      unread: conversations.filter(c => c.unread && c.unread > 0),
      recent: conversations.filter(c => (!c.unread || c.unread === 0) && c.status === 'active'),
      archived: conversations.filter(c => c.status === 'archived')
    };

    const endTime = performance.now();
    renderMetrics.current.conversationRenders++;
    renderMetrics.current.lastRenderTime = endTime - startTime;
    renderMetrics.current.totalRenderTime += (endTime - startTime);
    renderMetrics.current.averageRenderTime = 
      renderMetrics.current.totalRenderTime / renderMetrics.current.conversationRenders;

    return groups;
  }, [conversations]);

  // Memoized message grouping by date and sender
  const groupedMessages = useMemo(() => {
    const startTime = performance.now();
    
    const groups: { [key: string]: Message[] } = {};
    let currentGroup: Message[] = [];
    let currentDate = '';
    let currentSender = '';

    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp).toDateString();
      const isDifferentDate = messageDate !== currentDate;
      const isDifferentSender = message.senderId !== currentSender;
      
      // Create new group if date or sender changes (with time gap)
      const timeSinceLastMessage = index > 0 ? 
        new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() : 0;
      
      const shouldCreateNewGroup = isDifferentDate || 
                                   (isDifferentSender || timeSinceLastMessage > 5 * 60 * 1000); // 5 minutes gap

      if (shouldCreateNewGroup) {
        if (currentGroup.length > 0) {
          const groupKey = `${currentDate}_${currentGroup[0].senderId}`;
          groups[groupKey] = [...currentGroup];
        }
        currentGroup = [message];
        currentDate = messageDate;
        currentSender = message.senderId;
      } else {
        currentGroup.push(message);
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      const groupKey = `${currentDate}_${currentGroup[0].senderId}`;
      groups[groupKey] = currentGroup;
    }

    const endTime = performance.now();
    renderMetrics.current.messageRenders++;
    renderMetrics.current.lastRenderTime = endTime - startTime;

    return groups;
  }, [messages]);

  // Optimized search with debouncing and caching
  const createOptimizedSearch = useCallback(() => {
    const searchCache = new Map<string, AnyConversation[]>();
    
    return (query: string, conversations: AnyConversation[]) => {
      if (searchCache.has(query)) {
        return searchCache.get(query)!;
      }

      const results = conversations.filter(conv => {
        const searchText = `${conv.name} ${conv.lastMessage}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      // Cache results (with size limit)
      if (searchCache.size > 100) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) {
          searchCache.delete(firstKey);
        }
      }
      searchCache.set(query, results);

      return results;
    };
  }, []);

  // Intersection Observer for lazy loading
  const useLazyLoading = useCallback(() => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const observedElements = useRef<Set<Element>>(new Set());

    const observe = useCallback((element: Element, callback: () => void) => {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                callback();
                observerRef.current?.unobserve(entry.target);
                observedElements.current.delete(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: '50px' }
        );
      }

      observerRef.current.observe(element);
      observedElements.current.add(element);
    }, []);

    const disconnect = useCallback(() => {
      observerRef.current?.disconnect();
      observedElements.current.clear();
    }, []);

    return { observe, disconnect };
  }, []);

  // Image loading optimization
  const useImageOptimization = useCallback(() => {
    const imageCache = new Map<string, boolean>();
    
    const preloadImage = useCallback((src: string): Promise<void> => {
      if (imageCache.has(src)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, true);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    }, []);

    const preloadImages = useCallback(async (srcs: string[]) => {
      const promises = srcs.map(src => preloadImage(src));
      try {
        await Promise.all(promises);
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    }, [preloadImage]);

    return { preloadImage, preloadImages };
  }, []);

  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    return {
      ...renderMetrics.current,
      conversationsCount: conversations.length,
      messagesCount: messages.length,
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)
      } : null
    };
  }, [conversations.length, messages.length]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clear any performance monitoring
      renderMetrics.current = {
        conversationRenders: 0,
        messageRenders: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        totalRenderTime: 0
      };
    };
  }, []);

  return {
    // Virtualization
    useVirtualizedConversations,
    useVirtualizedMessages,
    
    // Grouped data
    groupedConversations,
    groupedMessages,
    
    // Search optimization
    createOptimizedSearch,
    
    // Lazy loading
    useLazyLoading,
    
    // Image optimization
    useImageOptimization,
    
    // Performance metrics
    getPerformanceMetrics,
    
    // Utility functions
    shouldUpdateConversation: useCallback((prev: AnyConversation, next: AnyConversation) => {
      return prev.id !== next.id ||
             prev.lastMessage !== next.lastMessage ||
             prev.unread !== next.unread ||
             prev.timestamp !== next.timestamp ||
             prev.status !== next.status;
    }, []),
    
    shouldUpdateMessage: useCallback((prev: Message, next: Message) => {
      return prev.id !== next.id ||
             prev.content !== next.content ||
             prev.status !== next.status ||
             prev.timestamp !== next.timestamp;
    }, [])
  };
}

/**
 * Hook para memoización específica de componentes de mensajería
 */
export function useMessagingMemo() {
  
  // Memoized conversation item props
  const memoConversationProps = useCallback((conversation: AnyConversation, isActive: boolean) => {
    return {
      id: conversation.id,
      name: conversation.name,
      lastMessage: conversation.lastMessage,
      timestamp: conversation.timestamp,
      unread: conversation.unread,
      avatar: conversation.avatar,
      isActive,
      online: conversation.type === 'individual' ? conversation.online : undefined
    };
  }, []);

  // Memoized message item props
  const memoMessageProps = useCallback((message: Message, isOwn: boolean, showAvatar: boolean) => {
    return {
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      status: message.status,
      isOwn,
      showAvatar,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar
    };
  }, []);

  // Memoized search results
  const memoSearchResults = useCallback((query: string, results: AnyConversation[]) => {
    return {
      query,
      results: results.map(conv => ({
        id: conv.id,
        name: conv.name,
        type: conv.type,
        unread: conv.unread
      })),
      count: results.length
    };
  }, []);

  return {
    memoConversationProps,
    memoMessageProps,
    memoSearchResults
  };
}

/**
 * Hook para optimización de scroll en listas grandes
 */
export function useScrollOptimization(containerRef: React.RefObject<HTMLElement>) {
  const scrollState = useRef({
    lastScrollTop: 0,
    scrollDirection: 'down' as 'up' | 'down',
    isScrolling: false,
    scrollTimeout: null as NodeJS.Timeout | null
  });

  const handleScroll = useCallback((callback?: (scrollInfo: {
    scrollTop: number;
    scrollDirection: 'up' | 'down';
    isScrolling: boolean;
  }) => void) => {
    return (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const scrollTop = target.scrollTop;
      const direction = scrollTop > scrollState.current.lastScrollTop ? 'down' : 'up';
      
      scrollState.current.lastScrollTop = scrollTop;
      scrollState.current.scrollDirection = direction;
      scrollState.current.isScrolling = true;

      // Clear previous timeout
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }

      // Set scrolling to false after scroll ends
      scrollState.current.scrollTimeout = setTimeout(() => {
        scrollState.current.isScrolling = false;
      }, 150);

      callback?.({
        scrollTop,
        scrollDirection: direction,
        isScrolling: true
      });
    };
  }, []);

  const setupScrollListener = useCallback((callback?: (scrollInfo: {
    scrollTop: number;
    scrollDirection: 'up' | 'down';
    isScrolling: boolean;
  }) => void) => {
    return handleScroll(callback);
  }, [handleScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollHandler = setupScrollListener();
    container.addEventListener('scroll', scrollHandler);
    
    return () => {
      container.removeEventListener('scroll', scrollHandler);
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };
  }, [setupScrollListener, containerRef]);

  return {
    scrollToTop: useCallback(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [containerRef]),
    
    scrollToBottom: useCallback(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ 
          top: containerRef.current.scrollHeight, 
          behavior: 'smooth' 
        });
      }
    }, [containerRef]),
    
    scrollToElement: useCallback((elementId: string) => {
      const element = containerRef.current?.querySelector(`[data-id="${elementId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [containerRef]),
    
    getScrollState: useCallback(() => ({ ...scrollState.current }), [])
  };
}
