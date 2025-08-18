import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const filter = searchParams.get('filter') || 'all'

    // Mock data simplificado para la nueva UI
    const mockItems = [
      {
        id: '1',
        type: 'project',
        title: 'FinTech Revolution',
        description: 'Plataforma de pagos digitales para PYMES con integración blockchain. Buscamos CTO y especialista en UX para completar el equipo.',
        score: 94,
        location: 'Madrid, España',
        tags: ['FinTech', 'Blockchain', 'SaaS', 'B2B'],
        author: {
          name: 'Carlos Mendoza',
          role: 'CEO & Founder'
        }
      },
      {
        id: '2',
        type: 'founder',
        title: 'Elena Rodríguez',
        description: 'Ex-Product Manager de Google con 8 años de experiencia en IA. Busco co-founder técnico para startup de HealthTech.',
        score: 89,
        location: 'Barcelona, España',
        tags: ['AI/ML', 'Product Management', 'HealthTech', 'Google'],
        author: {
          name: 'Elena Rodríguez',
          role: 'Product Manager'
        }
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Programa TechStars Madrid',
        description: 'Convocatoria abierta para startups en etapa temprana. 3 meses de aceleración con inversión semilla y mentoría.',
        score: 85,
        location: 'Madrid, España',
        tags: ['Aceleración', 'Inversión', 'Mentoría', 'Early Stage']
      },
      {
        id: '4',
        type: 'project',
        title: 'EcoSmart Supply Chain',
        description: 'Plataforma blockchain para transparencia en cadenas de suministro sostenibles. Necesitamos desarrollador Solidity.',
        score: 82,
        location: 'Valencia, España',
        tags: ['Blockchain', 'Sostenibilidad', 'Supply Chain'],
        author: {
          name: 'Ana García',
          role: 'Founder'
        }
      },
      {
        id: '5',
        type: 'founder',
        title: 'Miguel Santos',
        description: 'CTO con 12 años en desarrollo blockchain. Busco oportunidades como co-founder o advisor técnico.',
        score: 78,
        location: 'Sevilla, España',
        tags: ['Blockchain', 'DeFi', 'Technical Leadership'],
        author: {
          name: 'Miguel Santos',
          role: 'CTO'
        }
      },
      {
        id: '6',
        type: 'opportunity',
        title: 'Kibo Ventures - Serie A',
        description: 'Fondo de inversión busca startups B2B SaaS para ronda Serie A. ARR mínimo de €1M.',
        score: 91,
        location: 'Madrid, España',
        tags: ['Serie A', 'B2B SaaS', 'Venture Capital']
      }
    ]

    // Filtrar por tipo si no es 'all'
    let filteredItems = mockItems
    if (filter !== 'all') {
      filteredItems = mockItems.filter(item => item.type === filter)
    }

    // Filtrar por query si existe
    if (query) {
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    }

    const response = {
      items: filteredItems,
      total: filteredItems.length,
      query,
      filter
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in explore-simple API:', error)
    return NextResponse.json({ 
      items: [], 
      total: 0, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
