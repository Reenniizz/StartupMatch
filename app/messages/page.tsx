"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import useSocket from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { 
  ArrowLeft, 
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Star,
  Archive,
  Users,
  Plus,
  X,
  Globe,
  Lock,
  Hash,
  Settings,
  Mic,
  MicOff,
  VolumeX,
  Volume2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import MessagesArea from "@/components/MessagesArea";
import MessageInput from "@/components/MessageInput";
import TimezoneInfo from "@/components/TimezoneInfo";
import { formatMadridTime, formatRelativeTime, formatMessageTime } from "@/lib/timezone";

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    name: "María González",
    company: "TechStart Solutions",
    avatar: "MG",
    lastMessage: "¿Podemos programar una llamada para mañana?",
    timestamp: "2 min",
    unread: 2,
    online: true,
    isMatch: true,
    type: "individual"
  },
  {
    id: 2,
    name: "Carlos Rodríguez", 
    company: "EcoGreen Startup",
    avatar: "CR",
    lastMessage: "Perfecto, envío los documentos ahora",
    timestamp: "1h",
    unread: 0,
    online: false,
    isMatch: true,
    type: "individual"
  },
  {
    id: 3,
    name: "Dr. Ana Martínez",
    company: "HealthAI Platform",
    avatar: "AM", 
    lastMessage: "Gracias por la información compartida",
    timestamp: "3h",
    unread: 1,
    online: true,
    isMatch: true,
    type: "individual"
  },
  {
    id: 4,
    name: "Roberto Silva",
    company: "FinanceApp Co",
    avatar: "RS",
    lastMessage: "¿Tienes experiencia con blockchain?",
    timestamp: "1d",
    unread: 0,
    online: false,
    isMatch: false,
    type: "individual"
  }
];

// Mock data for group conversations
const mockGroupConversations = [
  {
    id: 101,
    name: "Founders FinTech LATAM",
    description: "Red de fundadores FinTech en Latinoamérica",
    avatar: "FF",
    lastMessage: "Ana: Nueva regulación en México, ¿opiniones?",
    timestamp: "5 min",
    unread: 3,
    memberCount: 24,
    isPrivate: false,
    type: "group",
    category: "Industria"
  },
  {
    id: 102,
    name: "React & Next.js Devs",
    description: "Desarrolladores especializados en React y Next.js",
    avatar: "RN",
    lastMessage: "Carlos: Alguien tiene experiencia con App Router?",
    timestamp: "15 min",
    unread: 1,
    memberCount: 18,
    isPrivate: false,
    type: "group",
    category: "Tecnología"
  },
  {
    id: 103,
    name: "Seed Stage Founders",
    description: "Fundadores en etapa de seed funding",
    avatar: "SS",
    lastMessage: "María: Compartiendo pitch deck template",
    timestamp: "1h",
    unread: 0,
    memberCount: 12,
    isPrivate: true,
    type: "group",
    category: "Stage"
  },
  {
    id: 104,
    name: "México City Startup Hub",
    description: "Comunidad de startups en CDMX",
    avatar: "MC",
    lastMessage: "Luis: Evento de networking este viernes",
    timestamp: "2h",
    unread: 2,
    memberCount: 35,
    isPrivate: false,
    type: "group",
    category: "Ubicación"
  }
];

// Mock messages for active conversation
const mockMessages = [
  {
    id: 1,
    sender: "other",
    message: "¡Hola! Vi tu perfil y me parece muy interesante tu experiencia en React",
    timestamp: "10:30 AM",
    status: "read"
  },
  {
    id: 2,
    sender: "me",
    message: "¡Gracias! Tu startup también me llamó mucho la atención. El enfoque en FinTech es muy prometedor",
    timestamp: "10:32 AM", 
    status: "read"
  },
  {
    id: 3,
    sender: "other",
    message: "Exacto, estamos buscando un desarrollador frontend senior. ¿Te interesaría conocer más detalles?",
    timestamp: "10:35 AM",
    status: "read"
  },
  {
    id: 4,
    sender: "me",
    message: "Definitivamente me interesa. ¿Podemos programar una videollamada?",
    timestamp: "10:40 AM",
    status: "delivered"
  },
  {
    id: 5,
    sender: "other",
    message: "¿Podemos programar una llamada para mañana?",
    timestamp: "2 min ago",
    status: "sent"
  }
];

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Temporary: Create a mock user for testing if no real user is logged in
  const testUser = {
    id: 'a1089270-efec-4c4b-a97f-22bb0cd2f313', // This should match our test conversation
    email: 'test@startupmatch.com'
  };
  
  const effectiveUser = user || testUser; // Use real user or fallback to test user
  const [conversations, setConversations] = useState(mockConversations);
  const [groupConversations, setGroupConversations] = useState(mockGroupConversations);
  const [activeConversation, setActiveConversation] = useState<string | number | null>(1);
  const [activeConversationType, setActiveConversationType] = useState('individual');
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'individual', 'groups'
  
  // Estados para crear grupo
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "", 
    category: "",
    isPrivate: false,
    tags: ""
  });

  // Hook de Socket.IO para mensajería en tiempo real
  const {
    socket,
    isConnected,
    sendMessage: socketSendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers,
  } = useSocket();

  // Estados para funcionalidades en tiempo real
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Estados de Accesibilidad y UI Mejorada
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    soundEnabled: true,
    screenReaderMode: false,
    reducedMotion: false,
    keyboardNavigation: true
  });

  const [uiSettings, setUiSettings] = useState({
    darkMode: false,
    compactMode: false,
    showTimestamps: true,
    showAvatars: true,
    autoScroll: false // Cambiado a false por defecto como WhatsApp/Telegram
  });

  // Referencias para accesibilidad
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const conversationListRef = useRef<HTMLDivElement>(null);

  const categories = [
    "Industria",
    "Tecnología", 
    "Stage",
    "Ubicación",
    "Comunidad",
    "Inversión"
  ];

  // Funciones de Accesibilidad Mejoradas
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current) {
      // Forzar scroll si se pide explícitamente o si autoScroll está habilitado
      if (force || uiSettings.autoScroll) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: accessibilitySettings.reducedMotion ? 'instant' : 'smooth' 
        });
      }
    }
  }, [uiSettings.autoScroll, accessibilitySettings.reducedMotion]);

  const playNotificationSound = useCallback(() => {
    if (accessibilitySettings.soundEnabled) {
      // Crear sonido de notificación accesible
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [accessibilitySettings.soundEnabled]);

  const announceToScreenReader = useCallback((message: string) => {
    if (accessibilitySettings.screenReaderMode) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }, [accessibilitySettings.screenReaderMode]);

  // Manejo de teclado mejorado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!accessibilitySettings.keyboardNavigation) return;

    switch (e.key) {
      case 'Enter':
        if (e.shiftKey) return; // Permitir nueva línea con Shift+Enter
        e.preventDefault();
        // sendMessage se llamará desde el componente
        break;
      case 'Escape':
        messageInputRef.current?.blur();
        break;
      case 'F6':
        e.preventDefault();
        searchInputRef.current?.focus();
        break;
    }
  }, [accessibilitySettings.keyboardNavigation]);

  // 📝 FUNCIONES BÁSICAS PARA MENSAJERÍA REAL
  const loadRealConversations = async () => {
    if (!effectiveUser?.id) {
      console.log('👤 No hay usuario efectivo');
      return;
    }

    console.log('🔄 Cargando conversaciones para usuario:', effectiveUser.id);
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${effectiveUser.id},user2_id.eq.${effectiveUser.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error:', error.message);
        // Mantener mocks como fallback
        return;
      }

      console.log('✅ Conversaciones encontradas:', data?.length || 0);

      if (data && data.length > 0) {
        const realConversations = data.map((conv) => {
          const otherUserId = conv.user1_id === effectiveUser.id ? conv.user2_id : conv.user1_id;
          return {
            id: conv.id, // UUID de la conversación real
            name: `Usuario ${otherUserId.slice(0, 8)}`,
            company: 'StartupMatch',
            avatar: 'SM',
            lastMessage: 'Conversación activa',
            timestamp: 'Ahora',
            unread: 0,
            online: true,
            isMatch: true,
            type: 'individual'
          };
        });

        setConversations(realConversations);
        
        // Seleccionar la primera conversación
        if (realConversations.length > 0) {
          setActiveConversation(realConversations[0].id);
          loadRealMessages(realConversations[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error general:', error);
    }
  };

  const loadRealMessages = async (conversationId: string) => {
    if (!conversationId) return;

    console.log('💬 Cargando mensajes para:', conversationId);

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('id, message, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error cargando mensajes:', error.message);
        return;
      }

      console.log('✅ Mensajes encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        const realMessages = data.map((msg) => ({
          id: msg.id,
          sender: msg.sender_id === user?.id ? 'me' : 'other',
          message: msg.message,
          timestamp: formatMadridTime(msg.created_at),
          status: 'delivered'
        }));

        setMessages(realMessages);
      } else {
        // Si no hay mensajes, usar algunos de prueba
        setMessages(mockMessages.slice(0, 3));
      }
    } catch (error) {
      console.error('❌ Error general cargando mensajes:', error);
    }
  };

  const sendRealMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !effectiveUser?.id) return;

    const messageText = newMessage.trim();
    console.log('📤 Enviando mensaje:', messageText);

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: effectiveUser.id,
          message: messageText
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error enviando mensaje:', error.message);
        return;
      }

      console.log('✅ Mensaje enviado:', data.id);

      // Agregar mensaje a la UI inmediatamente
      const newMsg = {
        id: data.id,
        sender: 'me',
        message: messageText,
        timestamp: formatMadridTime(new Date()),
        status: 'sent'
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

    } catch (error) {
      console.error('❌ Error general enviando:', error);
    }
  };

  // Redirect if not authenticated (bypass for development)
  useEffect(() => {
    if (!loading && !effectiveUser) {
      // For now, we're using effectiveUser so this won't trigger
      // router.push("/login");
    }
  }, [effectiveUser, loading, router]);

  // Cargar conversaciones reales cuando el usuario esté disponible
  useEffect(() => {
    if (effectiveUser?.id && !loading) {
      console.log('👤 Usuario efectivo disponible, cargando conversaciones...');
      loadRealConversations();
    }
  }, [effectiveUser?.id, loading]);

  // Configurar listeners de Socket.IO para mensajes en tiempo real
  useEffect(() => {
    if (!socket || !effectiveUser?.id) return;

    console.log('🔌 Configurando listeners de Socket.IO');

    // Listener para nuevos mensajes
    const handleNewMessage = (messageData: any) => {
      console.log('📨 Mensaje recibido en tiempo real:', messageData);
      
      // Agregar el mensaje a la lista si es de la conversación activa
      if (messageData.conversation_id === activeConversation) {
        const newMsg = {
          id: messageData.id,
          sender: messageData.sender_id === effectiveUser.id ? 'me' : 'other',
          message: messageData.message,
          timestamp: formatMadridTime(messageData.created_at),
          status: 'delivered'
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
        
        // Mejoras de UX y Accesibilidad para mensajes nuevos
        // Siempre forzar scroll para mensajes nuevos (tanto propios como de otros)
        scrollToBottom(true); // Forzar scroll para todos los mensajes nuevos
        playNotificationSound();
        announceToScreenReader(`Nuevo mensaje de ${messageData.sender_id === effectiveUser.id ? 'ti' : 'contacto'}: ${messageData.message}`);
      }
      
      // Actualizar la última message en la lista de conversaciones
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === messageData.conversation_id
            ? { 
                ...conv, 
                lastMessage: messageData.message,
                timestamp: formatMadridTime(messageData.created_at)
              }
            : conv
        )
      );
    };

    // Listener para confirmación de mensaje enviado
    const handleMessageSent = (data: any) => {
      console.log('✅ Mensaje enviado confirmado:', data);
      // Actualizar el status del mensaje a 'delivered'
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.status === 'sending' 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
      
      announceToScreenReader('Mensaje enviado correctamente');
    };

    // Listener para errores de mensaje
    const handleMessageError = (error: any) => {
      console.error('❌ Error enviando mensaje:', error);
      // Actualizar status a error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.status === 'sending' 
            ? { ...msg, status: 'error' }
            : msg
        )
      );
      
      announceToScreenReader('Error al enviar mensaje');
    };

    // Registrar listeners
    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-error', handleMessageError);

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-error', handleMessageError);
    };
  }, [socket, effectiveUser?.id, activeConversation, scrollToBottom, playNotificationSound, announceToScreenReader]);

  // Unirse a la conversación activa cuando cambie
  useEffect(() => {
    if (socket && isConnected && typeof activeConversation === 'string') {
      console.log('🔗 Uniéndose a conversación:', activeConversation);
      joinConversation(activeConversation, 'individual');
    }
  }, [socket, isConnected, activeConversation, joinConversation]);

  // Auto-scroll cuando cambian los mensajes (forzar para todos los mensajes nuevos)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Forzar scroll para todos los mensajes nuevos (tanto propios como recibidos)
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Aplicar configuraciones de accesibilidad al DOM
  useEffect(() => {
    const root = document.documentElement;
    
    if (accessibilitySettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (accessibilitySettings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (accessibilitySettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [accessibilitySettings]);

  const createGroup = () => {
    if (groupForm.name.trim() && groupForm.description.trim()) {
      // Aquí normalmente enviarías los datos al backend
      console.log('Creando grupo:', groupForm);
      
      // Simular éxito y redirigir a grupos
      setShowCreateGroup(false);
      setGroupForm({
        name: "",
        description: "",
        category: "",
        isPrivate: false, 
        tags: ""
      });
      
      // Redirigir a la página de grupos
      router.push("/grupos");
    }
  };

  // Combinar y filtrar conversaciones
  const getAllConversations = () => {
    const allConvs = [...conversations, ...groupConversations];
    return allConvs.sort((a, b) => {
      // Ordenar por timestamp (más reciente primero)
      const timeA = a.timestamp.includes('min') ? 1 : a.timestamp.includes('h') ? 2 : 3;
      const timeB = b.timestamp.includes('min') ? 1 : b.timestamp.includes('h') ? 2 : 3;
      return timeA - timeB;
    });
  };

  const getFilteredConversations = () => {
    let filteredConvs = [];
    
    switch (viewMode) {
      case 'individual':
        filteredConvs = conversations;
        break;
      case 'groups':
        filteredConvs = groupConversations;
        break;
      default:
        filteredConvs = getAllConversations();
    }

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      filteredConvs = filteredConvs.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.type === 'individual' && (conv as any).company && (conv as any).company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (conv.type === 'group' && (conv as any).description && (conv as any).description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filteredConvs;
  };

  const selectConversation = (id: number, type: string) => {
    setActiveConversation(id);
    setActiveConversationType(type);
    // Scroll solo cuando seleccionamos una nueva conversación
    setTimeout(() => {
      scrollToBottom(true); // Forzar scroll al cambiar conversación
      messageInputRef.current?.focus();
    }, 100);
  };

  // Función para eliminar chat completo
  const handleDeleteChat = async () => {
    if (!activeConversation || !effectiveUser?.id) return;

    // Confirmar la eliminación
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer y eliminará todos los mensajes.'
    );

    if (!confirmed) return;

    try {
      // Anunciar para accesibilidad
      announceToScreenReader('Eliminando chat...');

      // Solo proceder si es una conversación real (UUID)
      if (typeof activeConversation === 'string') {
        console.log('🗑️ Eliminando conversación:', activeConversation);

        // Llamar a la API para eliminar la conversación
        const response = await fetch(`/api/conversations?conversationId=${activeConversation}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar el chat');
        }

        console.log('✅ Chat eliminado exitosamente');
        
        // Actualizar la UI
        setMessages([]); // Limpiar mensajes
        setActiveConversation(null); // Cerrar el chat
        
        // Recargar la lista de conversaciones
        await loadRealConversations();
        
        // Notificar éxito
        announceToScreenReader('Chat eliminado exitosamente');
        
        // Mostrar mensaje de éxito
        alert('Chat eliminado exitosamente');
        
      } else {
        // Para conversaciones mock (desarrollo), solo limpiar la UI
        console.log('🗑️ Eliminando conversación mock:', activeConversation);
        setMessages([]);
        setActiveConversation(null);
        announceToScreenReader('Chat simulado eliminado');
      }

    } catch (error) {
      console.error('❌ Error eliminando chat:', error);
      announceToScreenReader('Error al eliminar el chat');
      alert(`Error al eliminar el chat: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !effectiveUser?.id) return;

    const messageText = newMessage.trim();

    // Anunciar envío para lectores de pantalla
    announceToScreenReader(`Enviando mensaje: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`);

    // Determinar si es conversación real (UUID) o mock (número)
    if (typeof activeConversation === 'string') {
      // Conversación real - usar Socket.IO para tiempo real
      console.log('📤 Enviando mensaje en tiempo real via Socket.IO');
      
      // NO agregamos el mensaje a la UI aquí, esperamos la respuesta del servidor
      // para evitar duplicados
      setNewMessage("");

      // Enviar via Socket.IO (se guardará en DB automáticamente)
      if (socket && isConnected) {
        socketSendMessage({
          conversationId: activeConversation,
          message: messageText,
          conversationType: 'individual'
        });
        
        // Forzar scroll hacia abajo inmediatamente después de enviar
        // para una mejor experiencia de usuario
        setTimeout(() => {
          scrollToBottom(true); // forzar scroll
        }, 100);
        
      } else {
        console.warn('⚠️ Socket no conectado, usando fallback directo a DB');
        // Fallback: enviar directamente a la base de datos
        sendRealMessage();
      }

    } else {
      // Conversación mock - comportamiento anterior
      const message = {
        id: messages.length + 1,
        sender: "me",
        message: messageText,
        timestamp: "Ahora",
        status: "sending"
      };
      setMessages([...messages, message]);
      setNewMessage("");
      
      // Forzar scroll inmediatamente para mensajes propios
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      
      // Actualizar última mensaje en conversaciones mock
      setConversations(convs => 
        convs.map(conv => 
          conv.id === activeConversation 
            ? { ...conv, lastMessage: messageText, timestamp: "Ahora" }
            : conv
        )
      );
    }
  };

  // Funciones para manejar indicadores de "escribiendo"
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Solo enviar typing events para conversaciones reales
    if (typeof activeConversation === 'string' && socket && isConnected && effectiveUser?.id) {
      // Iniciar typing
      startTyping(activeConversation, 'individual');

      // Limpiar timeout anterior
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Detener typing después de 1 segundo de inactividad
      const timeout = setTimeout(() => {
        stopTyping(activeConversation as string, 'individual');
      }, 1000);

      setTypingTimeout(timeout);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
      // Detener typing al enviar mensaje
      if (typeof activeConversation === 'string' && socket && effectiveUser?.id) {
        stopTyping(activeConversation, 'individual');
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered": return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read": return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const filteredConversations = getFilteredConversations();

  const activeConv = [...conversations, ...groupConversations].find(c => c.id === activeConversation);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
                Mensajes
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Crear Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Nombre del Grupo *</Label>
                      <Input
                        id="groupName"
                        placeholder="ej. Founders FinTech México"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">Descripción *</Label>
                      <Textarea
                        id="groupDescription"
                        placeholder="Describe el propósito y objetivos del grupo..."
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupCategory">Categoría</Label>
                      <Select
                        value={groupForm.category}
                        onValueChange={(value) => setGroupForm({...groupForm, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupTags">Tags (separados por comas)</Label>
                      <Input
                        id="groupTags"
                        placeholder="ej. FinTech, Startup, Funding"
                        value={groupForm.tags}
                        onChange={(e) => setGroupForm({...groupForm, tags: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={groupForm.isPrivate}
                        onChange={(e) => setGroupForm({...groupForm, isPrivate: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isPrivate" className="text-sm flex items-center">
                        <Lock className="h-4 w-4 mr-1" />
                        Grupo Privado (solo por invitación)
                      </Label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateGroup(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={createGroup}
                        disabled={!groupForm.name.trim() || !groupForm.description.trim()}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Crear Grupo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Badge variant="secondary">
                {conversations.reduce((acc, conv) => acc + conv.unread, 0) + 
                 groupConversations.reduce((acc, conv) => acc + conv.unread, 0)} nuevos
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="lg:col-span-4 bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Panel de Debug para pruebas */}
            <div className="p-4 border-b bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">Debug Panel:</p>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => loadRealConversations()}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Recargar Conversaciones
                </button>
                <button 
                  onClick={async () => {
                    const response = await fetch('/api/create-test-conversation', { method: 'POST' });
                    const result = await response.json();
                    console.log('Test conversation:', result);
                    if (result.success) {
                      loadRealConversations();
                    }
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Crear Conversación Test
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Usuario actual: {effectiveUser ? `${effectiveUser.email} (${effectiveUser.id})` : 'No logueado'}</p>
                <p className="flex items-center gap-2">
                  Socket.IO: 
                  <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                  {socket && `(ID: ${socket.id?.slice(-6) || 'N/A'})`}
                </p>
                <p>Conversación activa: {activeConversation} (Tipo: {typeof activeConversation === 'string' ? 'Real' : 'Mock'})</p>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'all' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todos ({conversations.length + groupConversations.length})
                </button>
                <button
                  onClick={() => setViewMode('individual')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'individual' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Individual ({conversations.length})
                </button>
                <button
                  onClick={() => setViewMode('groups')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'groups' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grupos ({groupConversations.length})
                </button>
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  onClick={() => selectConversation(conversation.id, conversation.type)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    activeConversation === conversation.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        conversation.type === 'group' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {conversation.type === 'group' ? (
                          <Users className="h-6 w-6" />
                        ) : (
                          conversation.avatar
                        )}
                      </div>
                      {conversation.type === 'individual' && (conversation as any).online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                      {conversation.type === 'group' && (conversation as any).isPrivate && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
                          <Lock className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.name}
                          </h3>
                          {conversation.type === 'individual' && (conversation as any).isMatch && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                          {conversation.type === 'group' && (
                            <Badge variant="secondary" className="text-xs">
                              {(conversation as any).memberCount}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-1">
                        {conversation.type === 'individual' 
                          ? (conversation as any).company 
                          : `${(conversation as any).category} • ${(conversation as any).memberCount} miembros`
                        }
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 truncate flex-1 mr-2">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat Area - Estilo WhatsApp/Telegram */}
          <div className={`lg:col-span-8 h-full flex flex-col ${
            accessibilitySettings.highContrast ? 'bg-black border-white' : 'bg-white border-gray-200'
          } rounded-lg shadow-sm border overflow-hidden`}>
            {activeConv ? (
              <>
                {/* Chat Header - Fijo en la parte superior */}
                <div className={`flex-shrink-0 p-4 border-b ${
                  accessibilitySettings.highContrast ? 'border-white bg-gray-900' : 'border-gray-200 bg-white'
                } shadow-sm z-10`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          activeConv.type === 'group' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                        }`}>
                          {activeConv.type === 'group' ? (
                            <Users className="h-5 w-5" aria-label="Grupo" />
                          ) : (
                            <span aria-label={`Avatar de ${activeConv.name}`}>
                              {(activeConv as any).avatar}
                            </span>
                          )}
                        </div>
                        {activeConv.type === 'individual' && (activeConv as any).online && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                            aria-label="En línea"
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold truncate ${
                            accessibilitySettings.highContrast ? 'text-white' : 'text-gray-900'
                          }`}>
                            {activeConv.name}
                          </h3>
                          {activeConv.type === 'group' && (activeConv as any).isPrivate && (
                            <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" aria-label="Grupo privado" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          accessibilitySettings.highContrast ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {activeConv.type === 'individual' 
                            ? (activeConv as any).company 
                            : `${(activeConv as any).memberCount} miembros • ${(activeConv as any).category}`
                          }
                        </p>
                        {/* Información de zona horaria */}
                        <TimezoneInfo className="mt-1" />
                        {activeConv.type === 'individual' && (activeConv as any).online && (
                          <p className="text-xs text-green-600" aria-live="polite">En línea</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción en header */}
                    <div className="flex items-center space-x-1">
                      {activeConv.type === 'individual' && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Llamar">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Iniciar llamada</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Videollamada">
                                  <Video className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Iniciar videollamada</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                      {activeConv.type === 'group' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label="Ver miembros">
                                <Users className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver miembros del grupo</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* Botón de eliminar chat */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteChat()}
                              aria-label="Eliminar chat"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar chat completo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Panel de Accesibilidad */}
                      <AccessibilityPanel
                        accessibilitySettings={accessibilitySettings}
                        setAccessibilitySettings={setAccessibilitySettings}
                        uiSettings={uiSettings}
                        setUiSettings={setUiSettings}
                      />
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Más opciones">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Más opciones</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                {/* Messages - Área principal con scroll independiente */}
                <div className="flex-1 overflow-hidden relative">
                  <MessagesArea
                    messages={messages}
                    typingUsers={typingUsers}
                    effectiveUserId={effectiveUser?.id || ''}
                    accessibilitySettings={accessibilitySettings}
                    uiSettings={uiSettings}
                    messagesEndRef={messagesEndRef}
                    className="absolute inset-0"
                  />
                </div>

                {/* Message Input - Fijo en la parte inferior */}
                <div className="flex-shrink-0 border-t bg-white">
                  <MessageInput
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    onSendMessage={sendMessage}
                    onTyping={() => {
                      if (socket && isConnected && typeof activeConversation === 'string') {
                        startTyping(activeConversation, 'individual');
                        
                        if (typingTimeout) clearTimeout(typingTimeout);
                        const timeout = setTimeout(() => {
                          stopTyping(activeConversation, 'individual');
                        }, 1000);
                        setTypingTimeout(timeout);
                      }
                    }}
                    onStopTyping={() => {
                      if (socket && isConnected && typeof activeConversation === 'string') {
                        stopTyping(activeConversation, 'individual');
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                          setTypingTimeout(null);
                        }
                      }
                    }}
                    isConnected={isConnected}
                    accessibilitySettings={accessibilitySettings}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona una conversación para empezar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
