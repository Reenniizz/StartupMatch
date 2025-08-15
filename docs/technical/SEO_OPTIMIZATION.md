# 📊 SEO & WEB PERFORMANCE OPTIMIZATION
*Estrategia Completa para Posicionamiento y Performance Web*

## 📋 **ANÁLISIS ACTUAL**

### 🚨 **PROBLEMAS IDENTIFICADOS**
- **SEO Score**: ~30/100 (CRÍTICO)
- **Meta tags**: Básicos/incompletos
- **Schema.org**: No implementado
- **sitemap.xml**: No existe
- **robots.txt**: No configurado
- **Core Web Vitals**: No optimizados
- **Analytics**: No implementado

### 🎯 **OBJETIVOS**
- **SEO Score**: 30/100 → **95/100**
- **Performance**: Optimizar Core Web Vitals
- **Visibility**: Posicionamiento en Google
- **Analytics**: Tracking completo

---

## 🔍 **SEO TÉCNICO**

### **1. Meta Tags Optimization**
```typescript
// app/layout.tsx - SEO optimizado
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://startupmatch.app'),
  title: {
    default: 'StartupMatch - Encuentra tu cofundador perfecto',
    template: '%s | StartupMatch'
  },
  description: 'La plataforma líder para conectar emprendedores y formar equipos de startup exitosos. Encuentra tu cofundador ideal con IA.',
  keywords: [
    'startup',
    'cofundador',
    'emprendedores',
    'networking',
    'matchmaking',
    'inteligencia artificial',
    'equipo startup',
    'business partner',
    'venture capital'
  ],
  authors: [{ name: 'StartupMatch Team', url: 'https://startupmatch.app' }],
  creator: 'StartupMatch',
  publisher: 'StartupMatch',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://startupmatch.app',
    siteName: 'StartupMatch',
    title: 'StartupMatch - Encuentra tu cofundador perfecto',
    description: 'Conecta con emprendedores complementarios y forma el equipo ideal para tu startup',
    images: [
      {
        url: '/og/og-image-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'StartupMatch - Plataforma de Matching para Emprendedores',
      },
      {
        url: '/og/og-image-square.png',
        width: 1080,
        height: 1080,
        alt: 'StartupMatch Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StartupMatchApp',
    creator: '@StartupMatchApp',
    title: 'StartupMatch - Encuentra tu cofundador perfecto',
    description: 'La plataforma líder para conectar emprendedores y formar equipos exitosos',
    images: ['/og/twitter-card-1200x600.png'],
  },
  verification: {
    google: 'tu-codigo-de-verificacion-google',
    yandex: 'tu-codigo-de-verificacion-yandex',
    yahoo: 'tu-codigo-de-verificacion-yahoo',
  },
  alternates: {
    canonical: 'https://startupmatch.app',
    languages: {
      'es-ES': 'https://startupmatch.app/es',
      'en-US': 'https://startupmatch.app/en',
    },
  },
  category: 'Business & Networking',
}
```

### **2. Structured Data (Schema.org)**
```typescript
// components/StructuredData.tsx
import Script from 'next/script'

export const OrganizationSchema = () => (
  <Script
    id="organization-schema"
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'StartupMatch',
        url: 'https://startupmatch.app',
        logo: 'https://startupmatch.app/logo.png',
        description: 'Plataforma de matching para emprendedores y cofundadores de startups',
        sameAs: [
          'https://twitter.com/StartupMatchApp',
          'https://linkedin.com/company/startupmatch',
          'https://facebook.com/StartupMatchApp'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+34-123-456-789',
          contactType: 'customer service',
          availableLanguage: ['Spanish', 'English']
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Madrid',
          addressCountry: 'ES'
        }
      })
    }}
  />
)

export const WebsiteSchema = () => (
  <Script
    id="website-schema"
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'StartupMatch',
        url: 'https://startupmatch.app',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://startupmatch.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      })
    }}
  />
)

export const BreadcrumbSchema = ({ items }: { items: Array<{name: string, url: string}> }) => (
  <Script
    id="breadcrumb-schema"
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      })
    }}
  />
)
```

### **3. Sitemap Generation**
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://startupmatch.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]

  // Dynamic pages - Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  const projectPages = projects?.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(project.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  })) || []

  // Dynamic pages - Profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('public', true)
    .order('updated_at', { ascending: false })

  const profilePages = profiles?.map((profile) => ({
    url: `${baseUrl}/profiles/${profile.id}`,
    lastModified: new Date(profile.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  })) || []

  return [...staticPages, ...projectPages, ...profilePages]
}
```

### **4. Robots.txt Configuration**
```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/profile/edit',
          '/messages/',
          '/settings/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/messages/',
          '/settings/',
        ],
      },
    ],
    sitemap: 'https://startupmatch.app/sitemap.xml',
    host: 'https://startupmatch.app',
  }
}
```

---

## ⚡ **CORE WEB VITALS OPTIMIZATION**

### **1. Image Optimization**
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className = ''
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### **2. Font Optimization**
```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false, // Solo cargar cuando se necesite
})

// CSS Variables para fonts
const fontVariables = `${inter.variable} ${playfair.variable}`
```

### **3. Bundle Size Optimization**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Bundle analyzer
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'commons',
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      }
    }
    
    return config
  },
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Headers for performance
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
      ],
    },
  ],
}
```

---

## 📈 **ANALYTICS & TRACKING**

### **1. Google Analytics 4 Setup**
```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url: string) => {
  if (typeof window !== 'undefined') {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    })
  }
}

export const event = (action: string, {
  event_category,
  event_label,
  value,
}: {
  event_category: string
  event_label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined') {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
    })
  }
}

// Custom events for StartupMatch
export const trackUserAction = (action: string, details?: any) => {
  event(action, {
    event_category: 'User Interaction',
    event_label: JSON.stringify(details),
  })
}

export const trackProjectView = (projectId: string) => {
  event('project_view', {
    event_category: 'Project',
    event_label: projectId,
  })
}

export const trackMatchSuccess = (userId: string, matchedUserId: string) => {
  event('match_success', {
    event_category: 'Matching',
    event_label: `${userId}-${matchedUserId}`,
  })
}
```

### **2. Analytics Component**
```typescript
// components/Analytics.tsx
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { pageview } from '@/lib/analytics'

export const GoogleAnalytics = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + searchParams.toString()
    pageview(url)
  }, [pathname, searchParams])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
```

### **3. Performance Monitoring**
```typescript
// lib/performance.ts
export const measurePerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metricName = entry.name
        const metricValue = Math.round(entry.value)
        
        // Send to analytics
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'web_vital', {
            event_category: 'Web Vitals',
            event_label: metricName,
            value: metricValue,
            non_interaction: true,
          })
        }
        
        console.log(`${metricName}: ${metricValue}ms`)
      }
    })
    
    // Observe Core Web Vitals
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
    
    // Custom performance tracking
    const measurePageLoad = () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        connection: perfData.connectEnd - perfData.connectStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        load: perfData.loadEventEnd - perfData.navigationStart,
      }
      
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'timing_complete', {
            name: key,
            value: Math.round(value),
          })
        }
      })
    }
    
    window.addEventListener('load', measurePageLoad)
  }
}
```

---

## 🎯 **LOCAL SEO & CONTENT STRATEGY**

### **1. Content Optimization**
```typescript
// lib/seo-helpers.ts
export const generateMetaDescription = (content: string, maxLength = 160) => {
  const cleaned = content.replace(/<[^>]*>/g, '').trim()
  if (cleaned.length <= maxLength) return cleaned
  
  const truncated = cleaned.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return truncated.substring(0, lastSpace) + '...'
}

export const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

export const extractKeywords = (text: string, maxKeywords = 10) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const frequency: { [key: string]: number } = {}
  
  words.forEach(word => {
    if (word.length > 3) {
      frequency[word] = (frequency[word] || 0) + 1
    }
  })
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
```

### **2. Dynamic Meta Tags**
```typescript
// app/projects/[id]/page.tsx
import { Metadata } from 'next'
import { generateMetaDescription, extractKeywords } from '@/lib/seo-helpers'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject(params.id)
  
  if (!project) {
    return {
      title: 'Proyecto no encontrado',
      description: 'El proyecto que buscas no existe o ha sido eliminado.',
    }
  }
  
  const description = generateMetaDescription(project.description)
  const keywords = extractKeywords(project.description + ' ' + project.title)
  
  return {
    title: `${project.title} - Proyecto en StartupMatch`,
    description,
    keywords: [...keywords, 'startup', 'proyecto', 'emprendedor'],
    openGraph: {
      title: project.title,
      description,
      images: project.image ? [project.image] : undefined,
      type: 'article',
      publishedTime: project.created_at,
      modifiedTime: project.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: project.image ? [project.image] : undefined,
    },
    alternates: {
      canonical: `https://startupmatch.app/projects/${project.id}`,
    },
  }
}
```

---

## 📊 **MONITORING & METRICS**

### **1. Performance Dashboard Setup**
```typescript
// lib/monitoring.ts
interface PerformanceMetrics {
  page: string
  loadTime: number
  timeToFirstByte: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  timestamp: Date
}

export const logPerformanceMetrics = async (metrics: PerformanceMetrics) => {
  try {
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    })
  } catch (error) {
    console.error('Failed to log performance metrics:', error)
  }
}

export const setupPerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    // Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logPerformanceMetrics({
          page: window.location.pathname,
          loadTime: entry.loadEventEnd - entry.navigationStart,
          timeToFirstByte: entry.responseStart - entry.requestStart,
          firstContentfulPaint: entry.firstContentfulPaint,
          largestContentfulPaint: entry.largestContentfulPaint,
          cumulativeLayoutShift: entry.cumulativeLayoutShift,
          timestamp: new Date(),
        })
      }
    })
    
    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
  }
}
```

---

## 🎯 **IMPLEMENTACIÓN & ROADMAP**

### **Fase 1: SEO Técnico (Semana 1-2)**
- ✅ Implementar meta tags optimizados
- ✅ Configurar structured data
- ✅ Crear sitemap dinámico
- ✅ Configurar robots.txt

### **Fase 2: Performance (Semana 2-3)**
- ✅ Optimizar Core Web Vitals
- ✅ Implementar lazy loading
- ✅ Optimizar bundle size
- ✅ Configurar CDN

### **Fase 3: Analytics (Semana 3-4)**
- ✅ Implementar Google Analytics 4
- ✅ Configurar eventos personalizados
- ✅ Setup de performance monitoring
- ✅ Dashboard de métricas

### **Fase 4: Content & Local SEO (Semana 4-5)**
- ✅ Optimización de contenido
- ✅ Meta tags dinámicos
- ✅ Schema markup avanzado
- ✅ A/B testing de títulos

---

## 📈 **RESULTADOS ESPERADOS**

### **Métricas Objetivo**
- **SEO Score**: 30/100 → **95/100** (+65 puntos)
- **PageSpeed Insights**: 60/100 → **90/100** (+30 puntos)
- **Core Web Vitals**: Todas en verde
- **Search Visibility**: +300% en 6 meses
- **Organic Traffic**: +500% en 6 meses

### **KPIs de Negocio**
- **Conversión SEO**: +200% leads orgánicos
- **Cost per Acquisition**: -40% reducción
- **Brand Awareness**: +150% búsquedas de marca
- **User Engagement**: +80% tiempo en sitio

**Esta implementación posicionará StartupMatch como líder en visibilidad online para matchmaking de emprendedores.**
