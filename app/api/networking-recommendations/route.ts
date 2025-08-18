import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockRecommendations = {
      recommendations: [
        {
          id: '1',
          type: 'profile_optimization',
          title: 'Completa tu sección de habilidades',
          description: 'Agregar más habilidades técnicas aumentará tu visibilidad en un 35%. Te faltan especificar frameworks y herramientas específicas.',
          priority: 'high',
          potential_impact: 'Incremento del 35% en visualizaciones de perfil'
        },
        {
          id: '2',
          type: 'networking_opportunity',
          title: 'Conecta con founders de FinTech',
          description: 'Hay 5 founders de startups fintech con alta compatibilidad en tu área. El momento es ideal para networking en esta industria.',
          priority: 'high',
          potential_impact: '5 nuevas conexiones estratégicas'
        },
        {
          id: '3',
          type: 'follow_up',
          title: 'Sigue contactos pendientes',
          description: 'Tienes 3 conversaciones sin respuesta desde hace más de una semana. Un seguimiento puede reactivar estas oportunidades.',
          priority: 'medium',
          potential_impact: 'Recuperación del 60% de conversaciones'
        },
        {
          id: '4',
          type: 'industry_trend',
          title: 'Participa en eventos de IA',
          description: 'Se detectó un aumento del 45% en conexiones relacionadas con IA en tu red. Considera asistir a eventos especializados.',
          priority: 'medium',
          potential_impact: '10-15 nuevas conexiones relevantes'
        },
        {
          id: '5',
          type: 'profile_optimization',
          title: 'Actualiza tu bio profesional',
          description: 'Tu descripción actual es muy técnica. Una bio más orientada a resultados de negocio podría atraer más socios estratégicos.',
          priority: 'low',
          potential_impact: 'Mejora del 20% en calidad de conexiones'
        }
      ]
    };

    return NextResponse.json(mockRecommendations);

  } catch (error) {
    console.error('Error fetching networking recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
