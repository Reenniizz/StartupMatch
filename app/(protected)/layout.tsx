"use client";

import { useEffect } from 'react';
import { useAuth, AuthProvider } from '@/contexts/AuthProvider';
import { SocketProvider } from '@/contexts/SocketProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useRouter } from 'next/navigation';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Protected pages layout - can add sidebar, dashboard header, etc. */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </SocketProvider>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedLayoutContent>
          {children}
        </ProtectedLayoutContent>
      </AuthProvider>
    </ErrorBoundary>
  );
}
