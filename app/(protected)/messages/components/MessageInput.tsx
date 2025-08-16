'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Input de mensajes con funcionalidades avanzadas
 * Incluye emojis, archivos, grabación de voz y auto-resize
 */
export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Escribe un mensaje...",
  className 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      adjustTextareaHeight();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File selected:', file.name);
      // Handle file upload here
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      console.log('Recording stopped');
    } else {
      // Start recording
      setIsRecording(true);
      console.log('Recording started');
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 p-3",
      className
    )}>
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Adjuntar archivo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Message input container */}
        <div className="flex-1 relative">
          {/* Input field */}
          <div className={cn(
            "relative border border-gray-300 dark:border-gray-600 rounded-2xl",
            "bg-gray-50 dark:bg-gray-700 transition-all duration-200",
            "focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-600"
          )}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full px-4 py-3 pr-12 bg-transparent text-gray-900 dark:text-gray-100",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "border-none outline-none resize-none",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              )}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            {/* Emoji button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="absolute right-3 bottom-3 p-1 text-gray-500 hover:text-yellow-500 transition-colors disabled:opacity-50"
              title="Emojis"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Send/Record button */}
        {canSend ? (
          <button
            type="submit"
            disabled={isSending}
            className={cn(
              "flex-shrink-0 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSending && "animate-pulse"
            )}
            title="Enviar mensaje"
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleRecording}
            disabled={disabled}
            className={cn(
              "flex-shrink-0 p-3 rounded-full transition-all duration-200",
              isRecording 
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400",
              "disabled:opacity-50"
            )}
            title={isRecording ? "Detener grabación" : "Grabar mensaje de voz"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </form>

      {/* Recording indicator */}
      {isRecording && (
        <RecordingIndicator onCancel={() => setIsRecording(false)} />
      )}
    </div>
  );
}

/**
 * Selector de emojis simplificado
 */
function EmojiPicker({ 
  onEmojiSelect, 
  onClose 
}: { 
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳']
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-emoji-picker]')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      data-emoji-picker
      className="absolute bottom-full left-0 mb-2 w-80 max-h-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 overflow-x-auto">
          {Object.keys(emojiCategories).map(category => (
            <button
              key={category}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-3 overflow-y-auto max-h-40">
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <div key={category} className="mb-3 last:mb-0">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{category}</h4>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onEmojiSelect(emoji)}
                  className="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Indicador de grabación activa
 */
function RecordingIndicator({ onCancel }: { onCancel: () => void }) {
  const [duration, setDuration] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-red-700 dark:text-red-300">
          Grabando... {formatDuration(duration)}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
