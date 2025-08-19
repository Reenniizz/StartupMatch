import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const industry = searchParams.get('industry') || '';
    const status = searchParams.get('status') || 'open';

    // Datos simulados de oportunidades de colaboración
    const mockOpportunities = [
      {
        id: '1',
        title: 'Desarrollo de App de Salud Digital',
        description: 'Buscamos socio tecnológico para desarrollar una aplicación móvil innovadora en el sector de la salud digital. El proyecto incluye integración con dispositivos IoT y análisis de datos médicos.',
        type: 'partnership',
        industry: 'Salud Digital',
        budget_range: '€25,000 - €50,000',
        duration: '6 meses',
        status: 'open',
        required_skills: ['React Native', 'Node.js', 'Healthcare APIs', 'HIPAA Compliance'],
        creator: {
          id: 'creator1',
          name: 'Dr. Patricia López',
          company: 'MedInnovate',
          role: 'Founder & CEO',
          avatar_url: ''
        },
        applicants_count: 12,
        deadline: '2025-09-15',
        created_at: '2025-08-01',
        priority: 'high',
        compatibility_score: 92
      },
      {
        id: '2',
        title: 'Expansión Internacional - FinTech',
        description: 'Startup fintech consolidada busca socios estratégicos para expansión en mercados latinoamericanos. Ofrecemos participación accionaria y revenue sharing.',
        type: 'investment',
        industry: 'Fintech',
        budget_range: '€100,000+',
        duration: '12 meses',
        status: 'open',
        required_skills: ['Business Development', 'International Markets', 'Regulatory Knowledge', 'Spanish/Portuguese'],
        creator: {
          id: 'creator2',
          name: 'Carlos Mendoza',
          company: 'PayTech Solutions',
          role: 'Co-founder',
          avatar_url: ''
        },
        applicants_count: 8,
        deadline: '2025-09-30',
        created_at: '2025-07-20',
        priority: 'high',
        compatibility_score: 88
      },
      {
        id: '3',
        title: 'Mentoría en Growth Marketing',
        description: 'Startup en fase temprana busca mentor experimentado en growth marketing y adquisición de usuarios. Ofrecemos equity y participación en decisiones estratégicas.',
        type: 'mentorship',
        industry: 'Marketing',
        budget_range: '€5,000 - €15,000',
        duration: '3 meses',
        status: 'open',
        required_skills: ['Growth Hacking', 'Digital Marketing', 'Analytics', 'Mentoring'],
        creator: {
          id: 'creator3',
          name: 'Ana Ruiz',
          company: 'GrowthLab',
          role: 'Head of Marketing',
          avatar_url: ''
        },
        applicants_count: 15,
        deadline: '2025-08-25',
        created_at: '2025-08-10',
        priority: 'medium',
        compatibility_score: 85
      },
      {
        id: '4',
        title: 'Desarrollo de MVP E-commerce',
        description: 'Proyecto de e-commerce B2B innovador necesita equipo técnico para desarrollar MVP. Concepto validado con primeros clientes interesados.',
        type: 'project',
        industry: 'E-commerce',
        budget_range: '€15,000 - €30,000',
        duration: '4 meses',
        status: 'open',
        required_skills: ['React', 'E-commerce Platforms', 'Payment Integration', 'AWS'],
        creator: {
          id: 'creator4',
          name: 'Roberto Kim',
          company: 'B2B Commerce',
          role: 'Product Manager',
          avatar_url: ''
        },
        applicants_count: 6,
        deadline: '2025-09-10',
        created_at: '2025-08-05',
        priority: 'medium',
        compatibility_score: 82
      },
      {
        id: '5',
        title: 'Asesoría Legal para Startup Tech',
        description: 'Startup tecnológica en ronda de inversión Serie A busca asesor legal especializado en venture capital y propiedad intelectual.',
        type: 'advisory',
        industry: 'Legal Tech',
        budget_range: '€8,000 - €20,000',
        duration: '6 meses',
        status: 'open',
        required_skills: ['Venture Capital Law', 'IP Law', 'Corporate Law', 'Tech Industry'],
        creator: {
          id: 'creator5',
          name: 'Sofia Valencia',
          company: 'TechFlow',
          role: 'Legal Affairs',
          avatar_url: ''
        },
        applicants_count: 4,
        deadline: '2025-08-30',
        created_at: '2025-08-12',
        priority: 'low',
        compatibility_score: 78
      }
    ];

    // Filtrar oportunidades basado en parámetros
    let filteredOpportunities = mockOpportunities;

    if (type) {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.type === type);
    }

    if (industry) {
      filteredOpportunities = filteredOpportunities.filter(opp => 
        opp.industry.toLowerCase().includes(industry.toLowerCase())
      );
    }

    if (status) {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.status === status);
    }

    // Ordenar por compatibilidad y prioridad
    filteredOpportunities.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.compatibility_score - a.compatibility_score;
    });

    return NextResponse.json({
      opportunities: filteredOpportunities,
      total: filteredOpportunities.length,
      filters_applied: { type, industry, status }
    });

  } catch (error) {
    console.error('Error fetching collaboration opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
