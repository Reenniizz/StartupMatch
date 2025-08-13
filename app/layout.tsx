import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthProvider';
import { SocketProvider } from '@/contexts/SocketProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'StartupMatch - Construye el equipo perfecto para tu startup',
  description: 'Matchmaking inteligente con IA que conecta emprendedores complementarios para crear startups exitosas. Únete a la comunidad de emprendedores más innovadora.',
  keywords: ['startup', 'emprendedores', 'matchmaking', 'IA', 'cofundadores', 'networking'],
  authors: [{ name: 'StartupMatch Team' }],
  openGraph: {
    title: 'StartupMatch - Matchmaking para Emprendedores',
    description: 'Encuentra cofundadores perfectos para tu startup con IA',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StartupMatch - Construye el equipo perfecto',
    description: 'Matchmaking inteligente para emprendedores',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}