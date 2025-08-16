"use client";

import { useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";

// Lazy load componentes pesados
const HowItWorksNew = lazy(() => import("@/components/landing/HowItWorksNew"));
const Differentiators = lazy(() => import("@/components/landing/Differentiators"));
const Testimonials = lazy(() => import("@/components/landing/Testimonials"));
const GetStarted = lazy(() => import("@/components/landing/GetStarted"));
const Footer = lazy(() => import("@/components/landing/Footer"));

export default function Home() {
  // Force scroll to top on page load and smooth scrolling for anchor links
  useEffect(() => {
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    
    // Smooth scrolling for anchor links
    const smoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href')?.substring(1);
        if (id) {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    };

    // Add event listeners to all anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', smoothScroll);
    });

    // Cleanup event listeners
    return () => {
      links.forEach(link => {
        link.removeEventListener('click', smoothScroll);
      });
    };
  }, []);

  return (
    <motion.main
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Header />
      <Hero />
      <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse" />}>
        <HowItWorksNew />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-white animate-pulse" />}>
        <Differentiators />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse" />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-white animate-pulse" />}>
        <GetStarted />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-gray-900 animate-pulse" />}>
        <Footer />
      </Suspense>
    </motion.main>
  );
}
