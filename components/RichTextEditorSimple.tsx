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

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Escribe tu descripción aquí...',
  className = '',
  minHeight = 200
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert markdown syntax at cursor position
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + text + value.substring(end);
    onChange(newText);
    
    // Place cursor after inserted text
    setTimeout(() => {
      textarea.setSelectionRange(start + text.length, start + text.length);
      textarea.focus();
    }, 0);
  };

  const insertLink = () => {
    const url = window.prompt('Ingresa la URL:');
    if (!url) return;
    
    const linkText = window.prompt('Texto del enlace:', url);
    if (linkText) {
      insertMarkdown(`[${linkText}](`, `${url})`);
    }
  };

  const insertImage = () => {
    const url = window.prompt('Ingresa la URL de la imagen:');
    if (!url) return;
    
    const altText = window.prompt('Texto alternativo:', 'Imagen');
    if (altText !== null) {
      insertMarkdown(`![${altText}](`, `${url})`);
    }
  };

  // Convert markdown to HTML for preview
  const markdownToHtml = (markdown: string) => {
    return markdown
      // Headers
      .replace(/^### (.+$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^## (.+$)/gm, '<h2 class="text-xl font-semibold mb-2">$1</h2>')
      .replace(/^# (.+$)/gm, '<h1 class="text-2xl font-bold mb-3">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Underline (custom syntax)
      .replace(/_u_(.+?)_u_/g, '<u>$1</u>')
      // Code
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
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
      variant="outline"
      size="sm"
      onClick={onClick}
      title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={`border rounded-lg ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b bg-gray-50">
          <div className="p-2 flex items-center justify-between">
            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {/* Text formatting */}
              <ToolbarButton 
                onClick={() => insertMarkdown('**', '**')} 
                icon={Bold} 
                title="Negrita"
                shortcut="Ctrl+B"
              />
              <ToolbarButton 
                onClick={() => insertMarkdown('*', '*')} 
                icon={Italic} 
                title="Cursiva"
                shortcut="Ctrl+I"
              />
              <ToolbarButton 
                onClick={() => insertMarkdown('_u_', '_u_')} 
                icon={Underline} 
                title="Subrayado"
              />
              <ToolbarButton 
                onClick={() => insertMarkdown('`', '`')} 
                icon={Code} 
                title="Código"
              />
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Headings */}
              <ToolbarButton 
                onClick={() => insertAtCursor('# ')} 
                icon={Heading1} 
                title="Título 1"
              />
              <ToolbarButton 
                onClick={() => insertAtCursor('## ')} 
                icon={Heading2} 
                title="Título 2"
              />
              <ToolbarButton 
                onClick={() => insertAtCursor('### ')} 
                icon={Heading3} 
                title="Título 3"
              />
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Lists and quotes */}
              <ToolbarButton 
                onClick={() => insertAtCursor('- ')} 
                icon={List} 
                title="Lista con viñetas"
              />
              <ToolbarButton 
                onClick={() => insertAtCursor('1. ')} 
                icon={ListOrdered} 
                title="Lista numerada"
              />
              <ToolbarButton 
                onClick={() => insertAtCursor('> ')} 
                icon={Quote} 
                title="Cita"
              />
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Media */}
              <ToolbarButton 
                onClick={insertLink} 
                icon={Link} 
                title="Insertar enlace"
              />
              <ToolbarButton 
                onClick={insertImage} 
                icon={Image} 
                title="Insertar imagen"
              />
            </div>

            {/* Tab switcher */}
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-1">
                <Edit className="h-3 w-3" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Vista previa
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* Editor content */}
        <TabsContent value="edit" className="m-0">
          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 resize-none focus-visible:ring-0 min-h-[200px]"
              style={{ minHeight }}
              onKeyDown={(e) => {
                // Keyboard shortcuts
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
                    case 'k':
                      e.preventDefault();
                      insertLink();
                      break;
                  }
                }
                
                // Handle tab for indentation
                if (e.key === 'Tab') {
                  e.preventDefault();
                  insertAtCursor('  ');
                }
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="m-0">
          <div 
            className="p-4 prose prose-sm max-w-none"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ 
              __html: value.trim() === '' 
                ? `<p class="text-gray-400">${placeholder}</p>` 
                : markdownToHtml(value) 
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Utility function to convert markdown to plain text
export const markdownToPlainText = (markdown: string): string => {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic  
    .replace(/_u_(.+?)_u_/g, '$1') // Remove underline
    .replace(/`(.+?)`/g, '$1') // Remove code
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1') // Convert links to text
    .replace(/!\[(.+?)\]\((.+?)\)/g, '$1') // Convert images to alt text
    .replace(/^- /gm, '') // Remove list bullets
    .replace(/^\d+\. /gm, '') // Remove numbered list
    .replace(/^> /gm, '') // Remove blockquotes
    .replace(/\n/g, ' ') // Convert newlines to spaces
    .trim();
};

export default RichTextEditor;
