'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Image,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Edit
} from 'lucide-react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  /**
   * Mode configuration:
   * - 'full': Full-featured editor with all toolbar options and preview
   * - 'simple': Simplified editor with basic toolbar only
   * - 'minimal': Text-only with no toolbar
   */
  mode?: 'full' | 'simple' | 'minimal';
  /**
   * Whether to show the preview tab (only applies in 'full' mode)
   */
  showPreview?: boolean;
  /**
   * Custom toolbar buttons to show (overrides mode defaults)
   */
  toolbarButtons?: ToolbarButtonConfig[];
}

export interface ToolbarButtonConfig {
  type: 'bold' | 'italic' | 'underline' | 'code' | 'h1' | 'h2' | 'h3' | 
        'list' | 'ordered-list' | 'quote' | 'link' | 'image' | 'separator';
  label?: string;
  shortcut?: string;
}

const DEFAULT_TOOLBAR_CONFIGS = {
  full: [
    { type: 'bold' as const },
    { type: 'italic' as const },
    { type: 'underline' as const },
    { type: 'separator' as const },
    { type: 'h1' as const },
    { type: 'h2' as const },
    { type: 'h3' as const },
    { type: 'separator' as const },
    { type: 'list' as const },
    { type: 'ordered-list' as const },
    { type: 'quote' as const },
    { type: 'separator' as const },
    { type: 'link' as const },
    { type: 'image' as const },
    { type: 'code' as const }
  ],
  simple: [
    { type: 'bold' as const },
    { type: 'italic' as const },
    { type: 'separator' as const },
    { type: 'list' as const },
    { type: 'link' as const }
  ],
  minimal: []
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Escribe tu descripción aquí...',
  className = '',
  minHeight = 200,
  mode = 'full',
  showPreview = true,
  toolbarButtons
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use custom toolbar buttons or mode defaults
  const effectiveToolbarButtons = toolbarButtons || DEFAULT_TOOLBAR_CONFIGS[mode];

  // Insert markdown syntax at cursor position
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = `${before}${selectedText}${after}`;
    const newValue = value.substring(0, start) + newText + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = selectedText 
        ? start + before.length + selectedText.length + after.length
        : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Markdown to HTML converter for preview
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.+$)/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+$)/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.+$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      // Bold, Italic, Code
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm my-2" />')
      // Lists
      .replace(/^- (.+$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^(\d+)\. (.+$)/gm, '<li class="ml-4">$1. $2</li>')
      // Blockquotes
      .replace(/^> (.+$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  // Toolbar button component
  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title,
    shortcut 
  }: { 
    onClick: () => void;
    icon: React.ComponentType<any>; 
    title: string;
    shortcut?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 hover:bg-gray-100"
      title={shortcut ? `${title} (${shortcut})` : title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  // Render toolbar buttons based on configuration
  const renderToolbarButtons = () => {
    return effectiveToolbarButtons.map((config, index) => {
      if (config.type === 'separator') {
        return <Separator key={index} orientation="vertical" className="h-6" />;
      }

      const buttonProps = {
        key: index,
        ...getButtonConfig(config.type)
      };

      return <ToolbarButton {...buttonProps} />;
    });
  };

  // Get button configuration for each type
  const getButtonConfig = (type: string) => {
    switch (type) {
      case 'bold':
        return {
          onClick: () => insertMarkdown('**', '**'),
          icon: Bold,
          title: 'Negrita',
          shortcut: 'Ctrl+B'
        };
      case 'italic':
        return {
          onClick: () => insertMarkdown('*', '*'),
          icon: Italic,
          title: 'Cursiva',
          shortcut: 'Ctrl+I'
        };
      case 'underline':
        return {
          onClick: () => insertMarkdown('_', '_'),
          icon: Underline,
          title: 'Subrayado'
        };
      case 'code':
        return {
          onClick: () => insertMarkdown('`', '`'),
          icon: Code,
          title: 'Código'
        };
      case 'h1':
        return {
          onClick: () => insertMarkdown('# ', ''),
          icon: Heading1,
          title: 'Título 1'
        };
      case 'h2':
        return {
          onClick: () => insertMarkdown('## ', ''),
          icon: Heading2,
          title: 'Título 2'
        };
      case 'h3':
        return {
          onClick: () => insertMarkdown('### ', ''),
          icon: Heading3,
          title: 'Título 3'
        };
      case 'list':
        return {
          onClick: () => insertMarkdown('- ', ''),
          icon: List,
          title: 'Lista'
        };
      case 'ordered-list':
        return {
          onClick: () => insertMarkdown('1. ', ''),
          icon: ListOrdered,
          title: 'Lista numerada'
        };
      case 'quote':
        return {
          onClick: () => insertMarkdown('> ', ''),
          icon: Quote,
          title: 'Cita'
        };
      case 'link':
        return {
          onClick: () => insertMarkdown('[texto del enlace](', ')'),
          icon: Link,
          title: 'Enlace'
        };
      case 'image':
        return {
          onClick: () => insertMarkdown('![descripción](', ')'),
          icon: Image,
          title: 'Imagen'
        };
      default:
        return {
          onClick: () => {},
          icon: Edit,
          title: 'Desconocido'
        };
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
      }
    }
  };

  // Render editor content based on mode
  if (mode === 'minimal') {
    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-h-[${minHeight}px] resize-none ${className}`}
        onKeyDown={handleKeyDown}
      />
    );
  }

  const showTabs = mode === 'full' && showPreview;

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      {effectiveToolbarButtons.length > 0 && (
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg flex-wrap">
          {renderToolbarButtons()}
        </div>
      )}

      {showTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 m-0 rounded-none border-b">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista previa
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="m-0">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`min-h-[${minHeight}px] border-0 resize-none rounded-none rounded-b-lg focus:ring-0`}
              onKeyDown={handleKeyDown}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="m-0">
            <div 
              className={`min-h-[${minHeight}px] p-3 prose prose-sm max-w-none rounded-b-lg`}
              dangerouslySetInnerHTML={{ 
                __html: value ? markdownToHtml(value) : '<p class="text-gray-400 italic">Nada que mostrar...</p>' 
              }}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`min-h-[${minHeight}px] border-0 resize-none rounded-none rounded-b-lg focus:ring-0`}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  );
};

export default RichTextEditor;

// Convenience exports for backward compatibility
export const RichTextEditorFull = (props: Omit<RichTextEditorProps, 'mode'>) => 
  <RichTextEditor {...props} mode="full" />;

export const RichTextEditorSimple = (props: Omit<RichTextEditorProps, 'mode'>) => 
  <RichTextEditor {...props} mode="simple" showPreview={false} />;

export const RichTextEditorMinimal = (props: Omit<RichTextEditorProps, 'mode'>) => 
  <RichTextEditor {...props} mode="minimal" />;
