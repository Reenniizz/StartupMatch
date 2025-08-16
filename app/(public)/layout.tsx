import { Inter } from 'next/font/google';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ServiceWorkerProvider } from '@/components/shared/ServiceWorkerProvider';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Public pages don't need heavy providers */}
      <ErrorBoundary>
        <ServiceWorkerProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ServiceWorkerProvider>
      </ErrorBoundary>
    </>
  );
}
