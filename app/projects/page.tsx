/**
 * Refactored Projects Page - Clean Architecture
 * Solves: Componentes gigantes, Estados locales excesivos, Loading states inconsistentes
 */

'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectsHeader } from '@/components/projects/ProjectsHeader';
import { MyProjectsTab, DiscoverProjectsTab, ApplicationsTab } from '@/components/projects/ProjectTabs';
import { Rocket, Users, BookOpen } from 'lucide-react';
import { useProjectsTabs } from '@/hooks/useProjectsNew';
import { useProjectsUI, useProjectsLoading } from '@/store/projects';
import { useMyProjects } from '@/hooks/useProjectsNew';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Main Projects Page Component - Now Clean and Focused
export default function ProjectsPage() {
  const { activeTab, setActiveTab } = useProjectsTabs();
  const { selectedProject, isModalOpen, closeProjectModal } = useProjectsUI();
  const { handleLike } = useMyProjects();

  // Handle tab change with type safety
  const handleTabChange = (value: string) => {
    if (value === "discover" || value === "my-projects" || value === "applications") {
      setActiveTab(value);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-8">
        <ProjectsHeader />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Descubrir
            </TabsTrigger>
            <TabsTrigger value="my-projects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mis Proyectos
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aplicaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            <DiscoverProjectsTab />
          </TabsContent>

          <TabsContent value="my-projects">
            <MyProjectsTab />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>
        </Tabs>

        {/* Project Modal */}
        <ProjectModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={closeProjectModal}
          onLike={handleLike}
          onBookmark={(id) => console.log('Bookmark:', id)}
          onApply={(projectId) => console.log('Apply:', projectId)}
        />
      </div>
    </ErrorBoundary>
  );
}
