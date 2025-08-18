import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // Simulamos el análisis detallado del match
    const mockAnalysis = {
      analysis: {
        strength_areas: [
          'Experiencia complementaria en tecnología',
          'Objetivos de negocio alineados',
          'Ubicación geográfica favorable',
          'Red de contactos potencialmente sinérgica'
        ],
        collaboration_opportunities: [
          'Desarrollo conjunto de productos digitales',
          'Intercambio de expertise técnico y comercial',
          'Participación en eventos y conferencias',
          'Posibles sinergias de marketing y ventas',
          'Oportunidades de inversión cruzada'
        ],
        business_potential: 'Alto potencial de colaboración a largo plazo. Las habilidades complementarias y objetivos alineados sugieren oportunidades de crecimiento mutuo.',
        recommended_action: 'Iniciar con una reunión informal para explorar sinergias específicas. Proponer un proyecto piloto de colaboración limitada para evaluar compatibilidad operacional.'
      }
    };

    return NextResponse.json(mockAnalysis);

  } catch (error) {
    console.error('Error in match analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
