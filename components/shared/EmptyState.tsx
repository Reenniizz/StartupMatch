'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Rocket, 
  Users, 
  BookOpen,
  MessageSquare,
  Star,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'no-projects' | 'no-results' | 'no-applications' | 'no-my-projects' | 'no-connections' | 'network-error';
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export function EmptyState({ type, onRetry, onClearFilters }: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-my-projects':
        return {
          icon: <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: '¡Es hora de crear tu primer proyecto!',
          description: 'Comparte tus ideas, encuentra colaboradores y construye algo increíble juntos.',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/projects/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Proyecto
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/projects?tab=discover">
                  <Search className="h-4 w-4 mr-2" />
                  Explorar Proyectos
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '💡 Comparte tu idea y encuentra el equipo perfecto',
            '🤝 Conecta con co-fundadores y colaboradores',
            '📈 Recibe feedback y mejora tu proyecto'
          ]
        };

      case 'no-results':
        return {
          icon: <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: 'No encontramos proyectos que coincidan',
          description: 'Prueba ajustando tus filtros o realizando una búsqueda más amplia.',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onClearFilters && (
                <Button onClick={onClearFilters} size="lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/projects/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Proyecto
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '🔍 Intenta con palabras clave diferentes',
            '📂 Explora otras categorías',
            '🌟 Crea el proyecto que estás buscando'
          ]
        };

      case 'no-applications':
        return {
          icon: <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: '¡Comienza a explorar proyectos!',
          description: 'Encuentra proyectos interesantes y aplica como colaborador o co-fundador.',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/projects?tab=discover">
                  <Search className="h-4 w-4 mr-2" />
                  Descubrir Proyectos
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/profile/edit">
                  <Star className="h-4 w-4 mr-2" />
                  Completar Perfil
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '🎯 Completa tu perfil para destacar',
            '💼 Muestra tus habilidades y experiencia',
            '🤝 Conecta con proyectos afines a tus intereses'
          ]
        };

      case 'no-connections':
        return {
          icon: <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: 'Sin conexiones aún',
          description: 'Cuando tengas conexiones aceptadas, aparecerán aquí para que puedas colaborar.',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/matches">
                  <Users className="h-4 w-4 mr-2" />
                  Buscar Matches
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/explore">
                  <Search className="h-4 w-4 mr-2" />
                  Explorar Perfiles
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '🤝 Conecta con emprendedores afines',
            '💼 Encuentra tu próximo co-fundador',
            '🌟 Construye tu red profesional'
          ]
        };

      case 'no-projects':
        return {
          icon: <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: 'Aún no hay proyectos disponibles',
          description: '¡Sé el primero en compartir una idea increíble y construir la comunidad!',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/projects/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear el Primer Proyecto
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/community">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Unirse a la Comunidad
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '🚀 Sé pionero en la plataforma',
            '💡 Comparte tu visión emprendedora',
            '👥 Ayuda a construir la comunidad'
          ]
        };

      case 'network-error':
        return {
          icon: <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: 'Oops, algo salió mal',
          description: 'No pudimos cargar los proyectos. Verifica tu conexión e inténtalo nuevamente.',
          actions: (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onRetry && (
                <Button onClick={onRetry} size="lg">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar Nuevamente
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ir al Inicio
                </Link>
              </Button>
            </div>
          ),
          tips: [
            '🔌 Verifica tu conexión a internet',
            '⏱️ Espera unos momentos e inténtalo de nuevo',
            '💬 Contacta soporte si el problema persiste'
          ]
        };

      default:
        return {
          icon: <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
          title: 'No hay contenido disponible',
          description: 'No encontramos lo que estás buscando.',
          actions: null,
          tips: []
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        {content.icon}
        
        <h3 className="text-2xl font-semibold mb-2">
          {content.title}
        </h3>
        
        <p className="text-muted-foreground mb-8 max-w-md">
          {content.description}
        </p>

        {content.actions}

        {content.tips && content.tips.length > 0 && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md">
            <h4 className="font-medium mb-3 text-sm">💡 Consejos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {content.tips.map((tip, index) => (
                <li key={index} className="text-left">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
