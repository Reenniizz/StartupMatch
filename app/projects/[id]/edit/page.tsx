'use client';

import { use } from 'react';
import EditProjectForm from '@/components/EditProjectForm';
import { useRouter } from 'next/navigation';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const handleSave = () => {
    // Redirect to the project view after successful save
    router.push(`/projects/${resolvedParams.id}`);
  };

  const handleCancel = () => {
    // Go back to project view
    router.push(`/projects/${resolvedParams.id}`);
  };

  return (
    <EditProjectForm
      projectId={resolvedParams.id}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
