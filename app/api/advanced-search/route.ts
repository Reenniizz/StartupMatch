import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters } = body;

    // Simular búsqueda con filtros avanzados
    let count = 50; // Base count

    // Ajustar count basado en filtros
    if (filters.location?.length > 0) count -= filters.location.length * 5;
    if (filters.industry?.length > 0) count -= filters.industry.length * 3;
    if (filters.role_level?.length > 0) count -= filters.role_level.length * 4;
    if (filters.company_size?.length > 0) count -= filters.company_size.length * 2;
    if (filters.compatibility_min > 80) count -= 20;
    if (filters.business_synergy_min > 70) count -= 15;
    if (filters.mutual_connections_min > 5) count -= 10;
    if (filters.languages?.length > 1) count -= 8;
    if (filters.investment_interest) count -= 25;
    if (filters.seeking_partnership) count -= 20;
    if (filters.has_funding) count -= 30;
    if (filters.remote_work) count += 10;

    // Asegurar que el count sea positivo
    count = Math.max(1, count);

    const result = {
      count,
      message: `Se encontraron ${count} profesionales que coinciden con tus criterios`,
      estimated_response_time: '2-3 días hábiles',
      top_matches_preview: [
        {
          name: 'Elena Rodriguez',
          role: 'Head of Product',
          company: 'TechVentures',
          compatibility: 94
        },
        {
          name: 'Miguel Santos',
          role: 'CTO',
          company: 'DataFlow',
          compatibility: 91
        },
        {
          name: 'Laura Chen',
          role: 'Founder',
          company: 'GreenTech Solutions',
          compatibility: 89
        }
      ]
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in advanced search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
