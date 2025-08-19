"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// Tipos de la aplicación
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  location?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  creatorId: string;
  collaborators: string[];
  skills: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'connection_request' | 'project_invite' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  compatibilityScore: number;
  commonSkills: string[];
  mutualInterests: string[];
  createdAt: Date;
}

// Estado principal de la aplicación
export interface AppState {
  // Estado del usuario
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Datos principales
  projects: Project[];
  connections: Connection[];
  notifications: Notification[];
  conversations: Conversation[];
  messages: Message[];
  matches: Match[];
  
  // Estado de UI
  sidebarOpen: boolean;
  currentPage: string;
  theme: 'light' | 'dark' | 'system';
  formProgress: number;
  
  // Filtros y búsqueda
  searchQuery: string;
  activeFilters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedSkills: string[];
  
  // Paginación
  currentPageNumber: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Estado de real-time
  isConnected: boolean;
  lastSync: Date;
  
  // Acciones del usuario
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  setFormProgress: (progress: number) => void;
  
  // Gestión de proyectos
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setProjects: (projects: Project[]) => void;
  
  // Gestión de conexiones
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  setConnections: (connections: Connection[]) => void;
  
  // Gestión de notificaciones
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  
  // Gestión de conversaciones
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  
  // Gestión de mensajes
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  
  // Gestión de matches
  addMatch: (match: Match) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  removeMatch: (id: string) => void;
  setMatches: (matches: Match[]) => void;
  
  // Estado de UI
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Filtros y búsqueda
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSelectedSkills: (skills: string[]) => void;
  
  // Paginación
  setCurrentPageNumber: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  
  // Estado de real-time
  setConnectionStatus: (status: boolean) => void;
  setLastSync: (date: Date) => void;
  
  // Utilidades
  resetState: () => void;
  getProjectById: (id: string) => Project | undefined;
  getConnectionById: (id: string) => Connection | undefined;
  getNotificationById: (id: string) => Notification | undefined;
  getConversationById: (id: string) => Conversation | undefined;
  getMessageById: (id: string) => Message | undefined;
  getMatchById: (id: string) => Match | undefined;
}

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  projects: [],
  connections: [],
  notifications: [],
  conversations: [],
  messages: [],
  matches: [],
  
  sidebarOpen: false,
  currentPage: 'dashboard',
  theme: 'system' as const,
  formProgress: 0,
  
  searchQuery: '',
  activeFilters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  selectedSkills: [],
  
  currentPageNumber: 1,
  itemsPerPage: 20,
  totalItems: 0,
  
  isConnected: false,
  lastSync: new Date(),
};

// Store principal de la aplicación
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Acciones del usuario
        setUser: (user) => set((state) => { 
          state.user = user; 
          state.isAuthenticated = !!user;
        }),
        setAuthenticated: (status) => set((state) => { state.isAuthenticated = status; }),
        setLoading: (loading) => set((state) => { state.isLoading = loading; }),
        setFormProgress: (progress) => set((state) => { state.formProgress = progress; }),
        
        // Gestión de proyectos
        addProject: (project) => set((state) => { 
          state.projects.unshift(project); // Añadir al principio
        }),
        updateProject: (id, updates) => set((state) => {
          const project = state.projects.find(p => p.id === id);
          if (project) Object.assign(project, updates);
        }),
        deleteProject: (id) => set((state) => {
          state.projects = state.projects.filter(p => p.id !== id);
        }),
        setProjects: (projects) => set((state) => { state.projects = projects; }),
        
        // Gestión de conexiones
        addConnection: (connection) => set((state) => { 
          state.connections.unshift(connection);
        }),
        updateConnection: (id, updates) => set((state) => {
          const connection = state.connections.find(c => c.id === id);
          if (connection) Object.assign(connection, updates);
        }),
        removeConnection: (id) => set((state) => {
          state.connections = state.connections.filter(c => c.id !== id);
        }),
        setConnections: (connections) => set((state) => { state.connections = connections; }),
        
        // Gestión de notificaciones
        addNotification: (notification) => set((state) => { 
          state.notifications.unshift(notification);
        }),
        markNotificationRead: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification) notification.read = true;
        }),
        markAllNotificationsRead: () => set((state) => {
          state.notifications.forEach(n => n.read = true);
        }),
        removeNotification: (id) => set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        }),
        setNotifications: (notifications) => set((state) => { state.notifications = notifications; }),
        
        // Gestión de conversaciones
        addConversation: (conversation) => set((state) => { 
          state.conversations.unshift(conversation);
        }),
        updateConversation: (id, updates) => set((state) => {
          const conversation = state.conversations.find(c => c.id === id);
          if (conversation) Object.assign(conversation, updates);
        }),
        removeConversation: (id) => set((state) => {
          state.conversations = state.conversations.filter(c => c.id !== id);
        }),
        setConversations: (conversations) => set((state) => { state.conversations = conversations; }),
        
        // Gestión de mensajes
        addMessage: (message) => set((state) => { 
          state.messages.unshift(message);
        }),
        updateMessage: (id, updates) => set((state) => {
          const message = state.messages.find(m => m.id === id);
          if (message) Object.assign(message, updates);
        }),
        removeMessage: (id) => set((state) => {
          state.messages = state.messages.filter(m => m.id !== id);
        }),
        setMessages: (messages) => set((state) => { state.messages = messages; }),
        
        // Gestión de matches
        addMatch: (match) => set((state) => { 
          state.matches.unshift(match);
        }),
        updateMatch: (id, updates) => set((state) => {
          const match = state.matches.find(m => m.id === id);
          if (match) Object.assign(match, updates);
        }),
        removeMatch: (id) => set((state) => {
          state.matches = state.matches.filter(m => m.id !== id);
        }),
        setMatches: (matches) => set((state) => { state.matches = matches; }),
        
        // Estado de UI
        toggleSidebar: () => set((state) => { state.sidebarOpen = !state.sidebarOpen; }),
        setCurrentPage: (page) => set((state) => { state.currentPage = page; }),
        setTheme: (theme) => set((state) => { state.theme = theme; }),
        
        // Filtros y búsqueda
        setSearchQuery: (query) => set((state) => { state.searchQuery = query; }),
        setActiveFilters: (filters) => set((state) => { state.activeFilters = filters; }),
        clearFilters: () => set((state) => { 
          state.activeFilters = {}; 
          state.searchQuery = '';
        }),
        setSortBy: (field) => set((state) => { state.sortBy = field; }),
        setSortOrder: (order) => set((state) => { state.sortOrder = order; }),
        setSelectedSkills: (skills) => set((state) => { state.selectedSkills = skills; }),
        
        // Paginación
        setCurrentPageNumber: (page) => set((state) => { state.currentPageNumber = page; }),
        setItemsPerPage: (items) => set((state) => { state.itemsPerPage = items; }),
        setTotalItems: (total) => set((state) => { state.totalItems = total; }),
        
        // Estado de real-time
        setConnectionStatus: (status) => set((state) => { state.isConnected = status; }),
        setLastSync: (date) => set((state) => { state.lastSync = date; }),
        
        // Utilidades
        resetState: () => set(initialState),
        getProjectById: (id) => get().projects.find(p => p.id === id),
        getConnectionById: (id) => get().connections.find(c => c.id === id),
        getNotificationById: (id) => get().notifications.find(n => n.id === id),
        getConversationById: (id) => get().conversations.find(c => c.id === id),
        getMessageById: (id) => get().messages.find(m => m.id === id),
        getMatchById: (id) => get().matches.find(m => m.id === id),
      })),
      {
        name: 'startupmatch-storage',
        storage: createJSONStorage(() => localStorage),
        // Solo persistir datos esenciales para evitar problemas de memoria
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          formProgress: state.formProgress,
          // Solo últimos 50 proyectos para evitar almacenamiento excesivo
          projects: state.projects.slice(0, 50),
          // Solo últimas 100 conexiones
          connections: state.connections.slice(0, 100),
          // Solo notificaciones no leídas
          notifications: state.notifications.filter(n => !n.read).slice(0, 50),
          // Solo últimas 20 conversaciones
          conversations: state.conversations.slice(0, 20),
          // Solo últimos 100 mensajes
          messages: state.messages.slice(0, 100),
          // Solo últimos 50 matches
          matches: state.matches.slice(0, 50),
          // Preferencias de UI
          selectedSkills: state.selectedSkills,
        }),
        // Migración de versiones del store
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migración de versión 0 a 1
            return {
              ...persistedState,
              // Añadir nuevos campos si es necesario
              isConnected: false,
              lastSync: new Date(),
              selectedSkills: [],
            };
          }
          return persistedState;
        },
      }
    ),
    {
      name: 'startupmatch-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectores optimizados para evitar re-renders innecesarios
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAppStore((state) => state.isLoading);

export const useProjects = () => useAppStore((state) => state.projects);
export const useConnections = () => useAppStore((state) => state.connections);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useConversations = () => useAppStore((state) => state.conversations);
export const useMessages = () => useAppStore((state) => state.messages);
export const useMatches = () => useAppStore((state) => state.matches);

export const useUIState = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  currentPage: state.currentPage,
  theme: state.theme,
}));

export const useSearchState = () => useAppStore((state) => ({
  searchQuery: state.searchQuery,
  activeFilters: state.activeFilters,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  selectedSkills: state.selectedSkills,
}));

export const usePaginationState = () => useAppStore((state) => ({
  currentPageNumber: state.currentPageNumber,
  itemsPerPage: state.itemsPerPage,
  totalItems: state.totalItems,
}));

export const useRealTimeState = () => useAppStore((state) => ({
  isConnected: state.isConnected,
  lastSync: state.lastSync,
}));

// Acciones del store
export const {
  setUser,
  setAuthenticated,
  setLoading,
  addProject,
  updateProject,
  deleteProject,
  setProjects,
  addConnection,
  updateConnection,
  removeConnection,
  setConnections,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  setNotifications,
  addConversation,
  updateConversation,
  removeConversation,
  setConversations,
  addMessage,
  updateMessage,
  removeMessage,
  setMessages,
  addMatch,
  updateMatch,
  removeMatch,
  setMatches,
  toggleSidebar,
  setCurrentPage,
  setTheme,
  setFormProgress,
  setSearchQuery,
  setActiveFilters,
  clearFilters,
  setSortBy,
  setSortOrder,
  setSelectedSkills,
  setCurrentPageNumber,
  setItemsPerPage,
  setTotalItems,
  setConnectionStatus,
  setLastSync,
  resetState,
  getProjectById,
  getConnectionById,
  getNotificationById,
  getConversationById,
  getMessageById,
  getMatchById,
} = useAppStore.getState();