import { NextRequest, NextResponse } from 'next/server'

// Forzar runtime de Node.js para evitar problemas de static generation
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Mock data para tendencias y análisis del mercado
    const mockTrends = [
      {
        id: '1',
        name: 'IA Generativa en Startups',
        category: 'ai',
        growth: 156,
        volume: 89,
        prediction: 'rising',
        timeframe: '6 meses',
        description: 'El uso de IA generativa en startups está experimentando un crecimiento exponencial, especialmente en automatización de procesos y desarrollo de productos.',
        relatedOpportunities: 247
      },
      {
        id: '2',
        name: 'FinTech Sostenible',
        category: 'fintech',
        growth: 89,
        volume: 76,
        prediction: 'rising',
        timeframe: '12 meses',
        description: 'Creciente demanda por soluciones financieras que integren criterios ESG y sostenibilidad ambiental.',
        relatedOpportunities: 156
      },
      {
        id: '3',
        name: 'HealthTech Preventiva',
        category: 'health',
        growth: 134,
        volume: 82,
        prediction: 'rising',
        timeframe: '9 meses',
        description: 'Tecnologías enfocadas en prevención y diagnóstico temprano están ganando tracción significativa.',
        relatedOpportunities: 198
      },
      {
        id: '4',
        name: 'Blockchain en Supply Chain',
        category: 'technology',
        growth: 67,
        volume: 65,
        prediction: 'stable',
        timeframe: '18 meses',
        description: 'Adopción estable de blockchain para transparencia y trazabilidad en cadenas de suministro.',
        relatedOpportunities: 89
      },
      {
        id: '5',
        name: 'Marketplace B2B Tradicionales',
        category: 'technology',
        growth: -23,
        volume: 34,
        prediction: 'declining',
        timeframe: '24 meses',
        description: 'Los marketplaces B2B tradicionales están perdiendo terreno frente a plataformas especializadas.',
        relatedOpportunities: 45
      },
      {
        id: '6',
        name: 'Carbon Credit Platforms',
        category: 'sustainability',
        growth: 201,
        volume: 71,
        prediction: 'rising',
        timeframe: '6 meses',
        description: 'Plataformas de comercio de créditos de carbono experimentan crecimiento explosivo.',
        relatedOpportunities: 123
      }
    ]

    const mockInsights = [
      {
        id: '1',
        title: 'Oportunidad en IA para PYMES',
        type: 'opportunity',
        impact: 'high',
        description: 'Existe una brecha significativa en soluciones de IA accesibles para pequeñas y medianas empresas. El 78% de las PYMES expresan interés pero solo el 23% han implementado alguna solución.',
        actionItems: [
          'Desarrollar soluciones de IA no-code/low-code',
          'Crear modelos de pricing accesibles para PYMES',
          'Enfocar en ROI medible y casos de uso específicos',
          'Establecer partnerships con consultorías PYME'
        ],
        timeline: 'Próximos 12 meses'
      },
      {
        id: '2',
        title: 'Saturación en Delivery Apps',
        type: 'threat',
        impact: 'medium',
        description: 'El mercado de aplicaciones de delivery está alcanzando saturación en mercados desarrollados. La competencia por cuota de mercado está incrementando costos de adquisición.',
        actionItems: [
          'Explorar nichos especializados (B2B, productos específicos)',
          'Diferenciación a través de sostenibilidad',
          'Expansión a mercados emergentes',
          'Pivotear hacia logística última milla B2B'
        ],
        timeline: 'Próximos 6 meses'
      },
      {
        id: '3',
        title: 'Crecimiento en RegTech',
        type: 'trend',
        impact: 'high',
        description: 'Las nuevas regulaciones europeas están creando demanda masiva por soluciones RegTech. Estimamos crecimiento del 145% en los próximos 18 meses.',
        actionItems: [
          'Especializarse en regulaciones específicas (GDPR, AI Act)',
          'Desarrollar APIs de compliance automatizado',
          'Crear herramientas de reporting automatizado',
          'Establecer partnerships con despachos legales'
        ],
        timeline: 'Próximos 18 meses'
      },
      {
        id: '4',
        title: 'Escasez de Talento en Cybersecurity',
        type: 'opportunity',
        impact: 'high',
        description: 'La brecha de talento en ciberseguridad alcanza 3.5 millones de posiciones globalmente. Oportunidad para plataformas de educación y reclutamiento especializado.',
        actionItems: [
          'Crear bootcamps especializados en cybersecurity',
          'Desarrollar plataformas de matching técnico especializado',
          'Ofrecer certificaciones reconocidas por la industria',
          'Crear herramientas de assessment técnico automatizado'
        ],
        timeline: 'Próximos 24 meses'
      }
    ]

    const response = {
      trends: mockTrends,
      insights: mockInsights,
      summary: {
        totalTrends: mockTrends.length,
        risingTrends: mockTrends.filter(t => t.prediction === 'rising').length,
        decliningTrends: mockTrends.filter(t => t.prediction === 'declining').length,
        avgGrowth: mockTrends.reduce((acc, t) => acc + t.growth, 0) / mockTrends.length,
        topCategory: 'ai'
      },
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in exploration-trends API:', error)
    return NextResponse.json({ 
      trends: [], 
      insights: [],
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
