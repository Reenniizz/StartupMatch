"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import useSocket from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Hash
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
  const [activeConversation, setActiveConversation] = useState<string | number>(1);
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

  const categories = [
    "Industria",
    "Tecnología", 
    "Stage",
    "Ubicación",
    "Comunidad",
    "Inversión"
  ];

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
          timestamp: new Date(msg.created_at).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
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
        timestamp: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
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
          timestamp: new Date(messageData.created_at).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'delivered'
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
      }
      
      // Actualizar la última message en la lista de conversaciones
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === messageData.conversation_id
            ? { 
                ...conv, 
                lastMessage: messageData.message,
                timestamp: new Date(messageData.created_at).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
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
  }, [socket, effectiveUser?.id, activeConversation]);

  // Unirse a la conversación activa cuando cambie
  useEffect(() => {
    if (socket && isConnected && typeof activeConversation === 'string') {
      console.log('🔗 Uniéndose a conversación:', activeConversation);
      joinConversation(activeConversation, 'individual');
    }
  }, [socket, isConnected, activeConversation, joinConversation]);

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
    // Aquí cargarías los mensajes específicos del grupo o conversación
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !effectiveUser?.id) return;

    const messageText = newMessage.trim();

    // Determinar si es conversación real (UUID) o mock (número)
    if (typeof activeConversation === 'string') {
      // Conversación real - usar Socket.IO para tiempo real
      console.log('📤 Enviando mensaje en tiempo real via Socket.IO');
      
      // Agregar mensaje inmediatamente a la UI con status "sending"
      const tempMessage = {
        id: Date.now(), // ID temporal
        sender: "me",
        message: messageText,
        timestamp: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: "sending"
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage("");

      // Enviar via Socket.IO (se guardará en DB automáticamente)
      if (socket && isConnected) {
        socketSendMessage({
          conversationId: activeConversation,
          message: messageText,
          conversationType: 'individual',
          tempId: tempMessage.id
        });
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

          {/* Chat Area */}
          <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        activeConv.type === 'group' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {activeConv.type === 'group' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          (activeConv as any).avatar
                        )}
                      </div>
                      {activeConv.type === 'individual' && (activeConv as any).online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{activeConv.name}</h3>
                        {activeConv.type === 'group' && (activeConv as any).isPrivate && (
                          <Lock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {activeConv.type === 'individual' 
                          ? (activeConv as any).company 
                          : `${(activeConv as any).memberCount} miembros • ${(activeConv as any).category}`
                        }
                      </p>
                      {activeConv.type === 'individual' && (activeConv as any).online && (
                        <p className="text-xs text-green-600">En línea</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {activeConv.type === 'individual' && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {activeConv.type === 'group' && (
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.sender === "me" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-900"
                      } rounded-lg px-4 py-2`}>
                        <p className="text-sm">{message.message}</p>
                        <div className={`flex items-center justify-between mt-1 text-xs ${
                          message.sender === "me" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          <span>{message.timestamp}</span>
                          {message.sender === "me" && (
                            <div className="ml-2">
                              {getStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Indicador de "escribiendo" */}
                  {Object.keys(typingUsers).some(userId => 
                    typingUsers[userId] && userId !== effectiveUser?.id
                  ) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-2 max-w-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">Escribiendo</span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe un mensaje..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
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
