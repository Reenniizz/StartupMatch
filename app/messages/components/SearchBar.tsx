'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Barra de búsqueda con debounce y filtros avanzados
 * Incluye sugerencias y historial de búsqueda
 */
export function SearchBar({ 
  query, 
  onQueryChange, 
  placeholder = "Buscar conversaciones...",
  className 
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, onQueryChange]);

  // Sync external query changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleClear = () => {
    setLocalQuery('');
    onQueryChange('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(localQuery.length > 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className={cn(
        "relative flex items-center",
        "bg-gray-100 dark:bg-gray-700 rounded-lg transition-all duration-200",
        isFocused && "bg-white dark:bg-gray-600 shadow-md ring-2 ring-blue-500 ring-opacity-50"
      )}>
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 bg-transparent",
            "text-sm text-gray-900 dark:text-gray-100",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "border-none outline-none"
          )}
        />

        {/* Clear Button */}
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <SearchSuggestions
          query={localQuery}
          onSuggestionSelect={(suggestion) => {
            setLocalQuery(suggestion);
            onQueryChange(suggestion);
            setShowSuggestions(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Sugerencias de búsqueda basadas en el query actual
 */
function SearchSuggestions({ 
  query, 
  onSuggestionSelect 
}: { 
  query: string; 
  onSuggestionSelect: (suggestion: string) => void; 
}) {
  // Mock suggestions - in a real app, these would come from API or search history
  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];

    const mockSuggestions = [
      'María González',
      'Juan Pérez - TechStart',
      'Grupo Marketing Digital',
      'Startup Finance',
      'Ana López - FinTech',
      'Grupo Inversores',
      'Carlos Ruiz',
      'Startup Mentores'
    ];

    return mockSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }, [query]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionSelect(suggestion)}
          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
        >
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="truncate">
            {highlightMatch(suggestion, query)}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Resalta el texto que coincide con la búsqueda
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
