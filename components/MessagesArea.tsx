"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
}

interface UiSettings {
  darkMode: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  autoScroll: boolean;
}

interface Message {
  id: number | string;
  sender: 'me' | 'other';
  message: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

interface MessagesAreaProps {
  messages: Message[];
  typingUsers: Record<string, boolean>;
  effectiveUserId: string;
  accessibilitySettings: AccessibilitySettings;
  uiSettings: UiSettings;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 animate-spin" />;
    case "sent":
      return <Check className="h-3 w-3" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

export default function MessagesArea({
  messages,
  typingUsers,
  effectiveUserId,
  accessibilitySettings,
  uiSettings,
  messagesEndRef,
  className
}: MessagesAreaProps) {
  
  // Estado para detectar si el usuario está al final del scroll
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Función para verificar si está al final del scroll
  const checkIfAtBottom = () => {
    if (!scrollAreaRef.current) return;
    
    const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 10; // píxeles de tolerancia
    const atBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    setIsAtBottom(atBottom);
  };

  // Escuchar eventos de scroll
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!container) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    container.addEventListener('scroll', handleScroll);
    
    // Verificar posición inicial
    checkIfAtBottom();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [messages]);

  // Verificar posición cuando cambian los mensajes
  useEffect(() => {
    checkIfAtBottom();
  }, [messages]);
  
  const getMessageAriaLabel = (message: Message) => {
    const sender = message.sender === "me" ? "Tú" : "Contacto";
    const time = uiSettings.showTimestamps ? ` enviado a las ${message.timestamp}` : "";
    return `${sender}: ${message.message}${time}`;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Área de scroll principal - estilo WhatsApp */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-4 py-2" 
        aria-label="Mensajes del chat"
        role="log"
        aria-live="polite"
      >
        {/* Espaciador superior para que los mensajes no estén pegados al top */}
        <div className="h-4" />
        
        <div className={`space-y-3 ${uiSettings.compactMode ? 'space-y-2' : 'space-y-3'} pb-4`}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={accessibilitySettings.reducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={accessibilitySettings.reducedMotion ? {} : { duration: 0.2 }}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} px-1`}
              role="article"
              aria-label={getMessageAriaLabel(message)}
            >
              <div 
                className={`max-w-[75%] lg:max-w-md rounded-2xl px-4 py-2.5 relative ${
                  uiSettings.compactMode ? 'px-3 py-2' : 'px-4 py-2.5'
                } ${
                  message.sender === "me" 
                    ? accessibilitySettings.highContrast 
                      ? "bg-blue-900 text-white border-2 border-blue-700" 
                      : "bg-blue-600 text-white shadow-sm"
                    : accessibilitySettings.highContrast 
                      ? "bg-gray-800 text-white border-2 border-gray-600" 
                      : "bg-white text-gray-900 shadow-sm border border-gray-200"
                } ${
                  accessibilitySettings.largeText ? 'text-base' : 'text-sm'
                } transition-all duration-150 hover:shadow-md`}
                style={{
                  // Bubble style like WhatsApp
                  borderRadius: message.sender === "me" 
                    ? "18px 18px 4px 18px" 
                    : "18px 18px 18px 4px"
                }}
              >
                {/* Mensaje */}
                <p className={`${
                  accessibilitySettings.largeText ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
                } break-words mb-1`}>
                  {message.message}
                </p>
                
                {/* Info del mensaje (timestamp + estado) */}
                {(uiSettings.showTimestamps || message.sender === "me") && (
                  <div className={`flex items-center justify-end gap-1 ${
                    accessibilitySettings.largeText ? 'text-xs' : 'text-xs'
                  } ${
                    message.sender === "me" 
                      ? accessibilitySettings.highContrast ? "text-blue-200" : "text-blue-100"
                      : accessibilitySettings.highContrast ? "text-gray-400" : "text-gray-500"
                  } mt-1`}>
                    {uiSettings.showTimestamps && (
                      <span 
                        aria-label={`Enviado a las ${message.timestamp}`}
                        className="select-none opacity-75"
                      >
                        {message.timestamp}
                      </span>
                    )}
                    
                    {message.sender === "me" && (
                      <div 
                        className="flex items-center opacity-75" 
                        aria-label={`Estado del mensaje: ${message.status}`}
                        title={`Estado: ${message.status}`}
                      >
                        {getStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Tail del globo de WhatsApp */}
                <div 
                  className={`absolute bottom-0 w-3 h-3 ${
                    message.sender === "me" 
                      ? accessibilitySettings.highContrast 
                        ? "bg-blue-900 right-0" 
                        : "bg-blue-600 right-0"
                      : accessibilitySettings.highContrast 
                        ? "bg-gray-800 left-0" 
                        : "bg-white left-0"
                  }`}
                  style={{
                    clipPath: message.sender === "me" 
                      ? "polygon(0 0, 100% 0, 0 100%)" 
                      : "polygon(100% 0, 0 0, 100% 100%)",
                    bottom: "-1px",
                    [message.sender === "me" ? "right" : "left"]: "-6px"
                  }}
                />
              </div>
            </motion.div>
          ))}
          
          {/* Elemento para scroll automático */}
          <div 
            ref={messagesEndRef} 
            className="h-1" 
            aria-hidden="true"
          />
        </div>
      </ScrollArea>
      
      {/* Indicador de escritura fuera del scroll - siempre visible */}
      {Object.keys(typingUsers).some(userId => 
        typingUsers[userId] && userId !== effectiveUserId
      ) && (
        <div className="px-4 pb-2">
          <motion.div
            initial={accessibilitySettings.reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={accessibilitySettings.reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
            className="flex justify-start px-1"
            role="status"
            aria-live="polite"
            aria-label="El usuario está escribiendo un mensaje"
          >
            <div className={`rounded-2xl px-4 py-3 ${
              uiSettings.compactMode ? 'px-3 py-2' : 'px-4 py-3'
            } ${
              accessibilitySettings.highContrast 
                ? 'bg-gray-800 text-gray-300 border-2 border-gray-600' 
                : 'bg-gray-100 text-gray-600 shadow-sm'
            } transition-all duration-150`}
            style={{
              borderRadius: "18px 18px 18px 4px"
            }}>
              <div className="flex items-center space-x-2">
                <span className={`${
                  accessibilitySettings.largeText ? 'text-sm' : 'text-sm'
                } select-none opacity-75`}>
                  Escribiendo
                </span>
                {!accessibilitySettings.reducedMotion && (
                  <div className="flex space-x-1" aria-hidden="true">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Botón de scroll hacia abajo - solo aparece cuando no estás al final */}
      {!isAtBottom && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setIsAtBottom(true); // Optimisticamente asumir que llegaremos al final
            }}
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 ${
              accessibilitySettings.highContrast ? 'ring-2 ring-white' : ''
            }`}
            aria-label="Ir a los mensajes más recientes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
