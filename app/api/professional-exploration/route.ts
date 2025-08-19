import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const type = searchParams.get('type') || 'all'
    const industry = searchParams.get('industry') || 'all'
    const stage = searchParams.get('stage') || 'all'
    const location = searchParams.get('location') || 'all'
    const matchScore = parseInt(searchParams.get('matchScore') || '0')
    const sortBy = searchParams.get('sortBy') || 'relevance'

    // Mock data para exploración profesional
    const mockMatches = [
      {
        id: '1',
        type: 'project',
        title: 'FinTech Revolution Platform',
        subtitle: 'Plataforma de pagos digitales para PYMES',
        description: 'Desarrollamos una solución integral de pagos digitales específicamente diseñada para pequeñas y medianas empresas, con integración blockchain y análisis predictivo.',
        matchScore: 94,
        compatibility: {
          skills: 88,
          industry: 95,
          stage: 92,
          location: 78
        },
        metrics: {
          views: 2847,
          interests: 156,
          connections: 42
        },
        tags: ['FinTech', 'Blockchain', 'SaaS', 'B2B', 'MVP Ready'],
        location: 'Madrid, España',
        verified: true,
        premium: true,
        lastActive: 'hace 2 horas'
      },
      {
        id: '2',
        type: 'founder',
        title: 'Elena Rodríguez',
        subtitle: 'Senior Product Manager ex-Google, especialista en AI',
        description: 'Ex-Product Manager de Google con 8 años de experiencia en productos de IA. Buscando co-founder técnico para startup de HealthTech enfocada en diagnóstico temprano mediante machine learning.',
        matchScore: 89,
        compatibility: {
          skills: 92,
          industry: 85,
          stage: 88,
          location: 90
        },
        metrics: {
          views: 1924,
          interests: 203,
          connections: 89
        },
        tags: ['AI/ML', 'Product Management', 'HealthTech', 'Google', 'Leadership'],
        location: 'Barcelona, España',
        verified: true,
        premium: false,
        lastActive: 'hace 1 día'
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Programa de Aceleración TechStars',
        subtitle: 'Convocatoria abierta para startups en etapa temprana',
        description: 'TechStars Madrid busca startups innovadoras en sectores tech para su programa de aceleración de 3 meses. Incluye inversión semilla, mentoría y acceso a red global.',
        matchScore: 85,
        compatibility: {
          skills: 80,
          industry: 88,
          stage: 95,
          location: 82
        },
        metrics: {
          views: 5621,
          interests: 892,
          connections: 234
        },
        tags: ['Aceleración', 'Inversión', 'Mentoría', 'TechStars', 'Early Stage'],
        location: 'Madrid, España',
        verified: true,
        premium: true,
        lastActive: 'hace 3 horas'
      },
      {
        id: '4',
        type: 'project',
        title: 'EcoSmart Supply Chain',
        subtitle: 'Blockchain para transparencia en cadena de suministro sostenible',
        description: 'Plataforma que utiliza blockchain e IoT para proporcionar transparencia completa en cadenas de suministro sostenibles, permitiendo a consumidores verificar el origen ético de productos.',
        matchScore: 82,
        compatibility: {
          skills: 85,
          industry: 78,
          stage: 80,
          location: 85
        },
        metrics: {
          views: 1456,
          interests: 67,
          connections: 23
        },
        tags: ['Blockchain', 'IoT', 'Sostenibilidad', 'Supply Chain', 'B2B'],
        location: 'Valencia, España',
        verified: false,
        premium: false,
        lastActive: 'hace 1 semana'
      },
      {
        id: '5',
        type: 'founder',
        title: 'Carlos Mendoza',
        subtitle: 'CTO con 12 años en desarrollo blockchain y DeFi',
        description: 'Ex-CTO de tres startups exitosas en el espacio blockchain. Experto en DeFi, smart contracts y arquitecturas escalables. Busco oportunidades como co-founder o advisor técnico.',
        matchScore: 78,
        compatibility: {
          skills: 95,
          industry: 70,
          stage: 75,
          location: 72
        },
        metrics: {
          views: 3241,
          interests: 187,
          connections: 156
        },
        tags: ['Blockchain', 'DeFi', 'Smart Contracts', 'Solidity', 'Technical Leadership'],
        location: 'Sevilla, España',
        verified: true,
        premium: true,
        lastActive: 'hace 5 horas'
      },
      {
        id: '6',
        type: 'opportunity',
        title: 'Fondo de Inversión Series A',
        subtitle: 'Kibo Ventures busca startups B2B SaaS para ronda Serie A',
        description: 'Kibo Ventures está invirtiendo activamente en startups B2B SaaS en etapa de crecimiento. Buscamos empresas con ARR de €1M+ y métricas sólidas de retención.',
        matchScore: 91,
        compatibility: {
          skills: 87,
          industry: 93,
          stage: 96,
          location: 88
        },
        metrics: {
          views: 4892,
          interests: 567,
          connections: 89
        },
        tags: ['Serie A', 'B2B SaaS', 'Venture Capital', 'Growth Stage', 'ARR'],
        location: 'Madrid, España',
        verified: true,
        premium: true,
        lastActive: 'hace 1 día'
      }
    ]

    // Filtrar resultados
    let filteredMatches = mockMatches.filter(match => {
      if (type !== 'all' && match.type !== type) return false
      if (matchScore > 0 && match.matchScore < matchScore) return false
      if (query && !match.title.toLowerCase().includes(query.toLowerCase()) && 
          !match.description.toLowerCase().includes(query.toLowerCase()) &&
          !match.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
        return false
      }
      return true
    })

    // Ordenar resultados
    switch (sortBy) {
      case 'match_score':
        filteredMatches.sort((a, b) => b.matchScore - a.matchScore)
        break
      case 'activity':
        // Simular ordenación por actividad reciente
        filteredMatches.sort((a, b) => a.lastActive.localeCompare(b.lastActive))
        break
      case 'trending':
        filteredMatches.sort((a, b) => b.metrics.views - a.metrics.views)
        break
      default: // relevance
        filteredMatches.sort((a, b) => b.matchScore - a.matchScore)
    }

    const response = {
      matches: filteredMatches,
      total: filteredMatches.length,
      filters: {
        query,
        type,
        industry,
        stage,
        location,
        matchScore,
        sortBy
      },
      suggestions: [
        'FinTech',
        'HealthTech',
        'AI/ML',
        'Blockchain',
        'B2B SaaS',
        'Sostenibilidad'
      ]
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in professional-exploration API:', error)
    return NextResponse.json({ 
      matches: [], 
      total: 0, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
