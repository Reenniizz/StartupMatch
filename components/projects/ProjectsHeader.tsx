/**
 * Projects Page Header Component
 * Separates header logic and UI
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthProvider';
import { useProjectsUI } from '@/store/projects';

export const ProjectsHeader = () => {
  const { session } = useAuth();
  const { activeTab } = useProjectsUI();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <p className="text-muted-foreground mt-2">
          Descubre proyectos increíbles o comparte el tuyo con la comunidad
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
        
        {/* Show create button only for my-projects tab and when authenticated */}
        {activeTab === 'my-projects' && session && (
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              Crear Proyecto
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
