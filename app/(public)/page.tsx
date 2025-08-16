// ✅ SERVER COMPONENT - Optimized landing page
import { Suspense } from "react";
import { Metadata } from 'next';
import HeroServer from "@/components/landing/HeroServer";
import HowItWorksNew from "@/components/landing/HowItWorksNew";
import Differentiators from "@/components/landing/Differentiators";
import Testimonials from "@/components/landing/Testimonials";
import GetStarted from "@/components/landing/GetStarted";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata: Metadata = {
  title: 'StartupMatch - Construye el equipo perfecto para tu startup',
  description: 'Matchmaking inteligente con IA que conecta emprendedores complementarios para crear startups exitosas. Únete a la comunidad de emprendedores más innovadora.',
  keywords: ['startup', 'emprendedores', 'matchmaking', 'IA', 'cofundadores', 'networking'],
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
};

export default async function HomePage() {
  return (
    <>
      {/* Hero section - can be server rendered */}
      <HeroServer />
      
      {/* Lazy load heavy components with suspense boundaries */}
      <Suspense fallback={<LoadingSkeleton type="page-layout" />}>
        <HowItWorksNew />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton type="page-layout" />}>
        <Differentiators />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton type="page-layout" />}>
        <Testimonials />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton type="page-layout" />}>
        <GetStarted />
      </Suspense>
    </>
  );
}
