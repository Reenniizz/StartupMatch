import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Datos simulados de propuestas del usuario
    const mockProposals = [
      {
        id: '1',
        opportunity_id: '1',
        title: 'Propuesta Desarrollo App Salud',
        description: 'Propuesta completa para desarrollo de aplicación móvil de salud digital con integración IoT y cumplimiento HIPAA.',
        budget: '€35,000',
        timeline: '5 meses',
        deliverables: [
          'Aplicación móvil iOS/Android',
          'Backend con APIs seguras',
          'Integración con dispositivos IoT',
          'Dashboard web para médicos',
          'Documentación y testing'
        ],
        status: 'under_review',
        submitted_at: '2025-08-15T10:30:00Z'
      },
      {
        id: '2',
        opportunity_id: '3',
        title: 'Mentoría Growth Marketing',
        description: 'Programa de mentoría estructurado de 3 meses enfocado en growth hacking y adquisición de usuarios para startups.',
        budget: '€8,000',
        timeline: '3 meses',
        deliverables: [
          'Auditoría inicial de marketing',
          '12 sesiones de mentoría 1:1',
          'Estrategia de growth hacking',
          'Implementación de métricas',
          'Plan de escalamiento'
        ],
        status: 'submitted',
        submitted_at: '2025-08-16T14:15:00Z'
      },
      {
        id: '3',
        opportunity_id: '4',
        title: 'MVP E-commerce B2B',
        description: 'Desarrollo completo de MVP para plataforma e-commerce B2B con funcionalidades avanzadas de gestión de inventario.',
        budget: '€22,000',
        timeline: '4 meses',
        deliverables: [
          'Plataforma web responsive',
          'Panel de administración',
          'Sistema de pagos integrado',
          'Gestión de inventario',
          'Reporting y analytics'
        ],
        status: 'draft',
        submitted_at: ''
      }
    ];

    return NextResponse.json({
      proposals: mockProposals,
      total: mockProposals.length,
      by_status: {
        draft: mockProposals.filter(p => p.status === 'draft').length,
        submitted: mockProposals.filter(p => p.status === 'submitted').length,
        under_review: mockProposals.filter(p => p.status === 'under_review').length,
        accepted: mockProposals.filter(p => p.status === 'accepted').length,
        rejected: mockProposals.filter(p => p.status === 'rejected').length
      }
    });

  } catch (error) {
    console.error('Error fetching user proposals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      opportunity_id, 
      title, 
      description, 
      budget, 
      timeline, 
      deliverables 
    } = body;

    // Validar campos requeridos
    if (!opportunity_id || !title || !description || !budget || !timeline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simular creación de propuesta
    const newProposal = {
      id: Date.now().toString(),
      opportunity_id,
      title,
      description,
      budget,
      timeline,
      deliverables: deliverables || [],
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    // Simular demora de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      proposal: newProposal,
      message: 'Propuesta enviada correctamente'
    });

  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
