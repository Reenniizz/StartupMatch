"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface AccessibilitySettings {
  keyboardNavigation: boolean;
  largeText: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
}

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
  isConnected: boolean;
  accessibilitySettings: AccessibilitySettings;
  disabled?: boolean;
  className?: string;
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  onTyping,
  onStopTyping,
  isConnected,
  accessibilitySettings,
  disabled = false,
  className
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Update character count
  useEffect(() => {
    setCharCount(newMessage.length);
  }, [newMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!accessibilitySettings.keyboardNavigation) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && isConnected) {
        onSendMessage();
      }
    }
    
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }

    // Trigger typing indicator
    if (e.key !== 'Enter' && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
      onTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setNewMessage(value);
      onTyping();
    }
  };

  const handleSend = () => {
    if (newMessage.trim() && isConnected && !disabled) {
      onSendMessage();
      // Focus back to textarea for better UX
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // Here you would implement actual voice recording functionality
    if (accessibilitySettings.screenReaderMode) {
      const message = isRecording ? "Grabación de voz desactivada" : "Grabación de voz activada";
      // Announce to screen reader
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  const getPlaceholderText = () => {
    if (disabled) return "Chat deshabilitado...";
    if (!isConnected) return "Conectando...";
    return accessibilitySettings.keyboardNavigation 
      ? "Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
      : "Escribe un mensaje...";
  };

  return (
    <TooltipProvider>
      <div className={`p-3 ${
        accessibilitySettings.highContrast ? 'border-white bg-black' : 'border-gray-200 bg-white'
      } ${className}`}>
        
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="mb-2">
            <Badge variant="destructive" className="text-xs">
              Desconectado - Intentando reconectar...
            </Badge>
          </div>
        )}

        <div className="flex items-end space-x-2 max-w-full">
          {/* File attachment button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={disabled || !isConnected}
                aria-label="Adjuntar archivo"
                className={`flex-shrink-0 h-10 w-10 rounded-full ${
                  accessibilitySettings.highContrast ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'
                }`}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adjuntar archivo</TooltipContent>
          </Tooltip>

          {/* Main input container - estilo WhatsApp */}
          <div className="flex-1 relative">
            <div className={`flex items-end bg-white rounded-3xl border ${
              accessibilitySettings.highContrast 
                ? 'bg-gray-900 border-gray-600' 
                : 'bg-white border-gray-300'
            } ${
              charCount > maxChars * 0.9 ? 'border-amber-500' : ''
            } ${
              charCount >= maxChars ? 'border-red-500' : ''
            } shadow-sm hover:shadow-md transition-shadow duration-200`}>
              
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={onStopTyping}
                placeholder={getPlaceholderText()}
                disabled={disabled || !isConnected}
                className={`flex-1 min-h-[44px] max-h-[120px] resize-none border-0 rounded-3xl bg-transparent ${
                  accessibilitySettings.largeText ? 'text-base px-4 py-3' : 'text-sm px-4 py-3'
                } ${
                  accessibilitySettings.highContrast 
                    ? 'text-white placeholder:text-gray-400' 
                    : 'text-gray-900 placeholder:text-gray-500'
                } focus:ring-0 focus:outline-none scrollbar-hide`}
                aria-label="Campo de mensaje"
                aria-describedby="char-count message-help"
                role="textbox"
                aria-multiline="true"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
              
              {/* Emoji picker button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={disabled || !isConnected}
                    aria-label="Seleccionar emoji"
                    className={`flex-shrink-0 h-8 w-8 rounded-full mr-1 mb-1 ${
                      accessibilitySettings.highContrast ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Seleccionar emoji</TooltipContent>
              </Tooltip>
            </div>
            
            {/* Character count - posicionado fuera del input */}
            <div 
              id="char-count"
              className={`absolute -bottom-5 right-2 text-xs ${
                charCount > maxChars * 0.9 
                  ? charCount >= maxChars ? 'text-red-500' : 'text-amber-500'
                  : accessibilitySettings.highContrast ? 'text-gray-400' : 'text-gray-500'
              } transition-colors duration-200`}
              aria-live="polite"
            >
              {charCount > maxChars * 0.8 && `${charCount}/${maxChars}`}
            </div>
          </div>

          {/* Voice recording button - solo cuando el input está vacío */}
          {!newMessage.trim() && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isRecording ? "destructive" : "ghost"}
                  size="sm"
                  onClick={toggleVoiceRecording}
                  disabled={disabled || !isConnected}
                  aria-label={isRecording ? "Detener grabación de voz" : "Iniciar grabación de voz"}
                  className={`flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200 ${
                    accessibilitySettings.highContrast && !isRecording ? 'hover:bg-gray-700 text-white' : ''
                  } ${isRecording ? 'animate-pulse' : ''}`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? "Detener grabación de voz" : "Mantén presionado para grabar audio"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Send button - solo cuando hay texto */}
          {newMessage.trim() && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleSend}
                  disabled={!newMessage.trim() || !isConnected || disabled || charCount >= maxChars}
                  size="sm"
                  aria-label="Enviar mensaje"
                  className={`flex-shrink-0 h-10 w-10 rounded-full transition-all duration-200 shadow-md hover:shadow-lg ${
                    newMessage.trim() && isConnected && !disabled && charCount < maxChars
                      ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' 
                      : 'bg-gray-400'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!isConnected ? "Desconectado" : 
                 !newMessage.trim() ? "Escribe un mensaje" :
                 charCount >= maxChars ? "Mensaje muy largo" :
                 "Enviar mensaje"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Help text para lectores de pantalla */}
        <div id="message-help" className="sr-only">
          Para enviar el mensaje presiona Enter. Para agregar una nueva línea presiona Shift + Enter.
          El mensaje puede tener hasta {maxChars} caracteres.
        </div>

        {/* Voice recording indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-red-600 bg-red-50 rounded-lg py-2 px-4">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Grabando audio... Suelta para enviar</span>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
