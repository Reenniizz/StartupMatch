import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface UserProfile {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  experience_years: number;
  avatar_url: string;
  skills: string[];
  interests: string[];
  business_goals: any;
}

interface ProfessionalMatch extends UserProfile {
  compatibility_score: number;
  mutual_connections: number;
  shared_interests: string[];
  complementary_skills: string[];
  business_synergy: number;
  networking_potential: number;
  collaboration_score: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    
    // Por ahora simularemos la autenticación del usuario
    // En producción esto vendría del token JWT
    const userId = 'temp-user-id'; // Esto debe venir de la autenticación real

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseInt(searchParams.get('min_score') || '70');

    // Datos simulados para desarrollo
    const mockMatches: UserProfile[] = [
      {
        user_id: '1',
        username: 'maria_gonzalez',
        first_name: 'María',
        last_name: 'González',
        bio: 'CTO especializada en inteligencia artificial y machine learning. Busco socios para proyectos innovadores en HealthTech.',
        role: 'CTO',
        company: 'AI Solutions',
        industry: 'Tecnología',
        location: 'Madrid',
        experience_years: 8,
        avatar_url: '',
        skills: ['Python', 'Machine Learning', 'Leadership', 'Product Strategy'],
        interests: ['IA', 'Salud Digital', 'Startups'],
        business_goals: { type: 'partnership', funding: 'seeking' }
      },
      {
        user_id: '2',
        username: 'carlos_lopez',
        first_name: 'Carlos',
        last_name: 'López',
        bio: 'Fundador de startup fintech. Experto en productos financieros digitales y blockchain.',
        role: 'Founder & CEO',
        company: 'FinanceNext',
        industry: 'Fintech',
        location: 'Barcelona',
        experience_years: 6,
        avatar_url: '',
        skills: ['Blockchain', 'Product Management', 'Business Development', 'Finance'],
        interests: ['Criptomonedas', 'DeFi', 'Inversión'],
        business_goals: { type: 'scaling', funding: 'funded' }
      },
      {
        user_id: '3',
        username: 'ana_martin',
        first_name: 'Ana',
        last_name: 'Martín',
        bio: 'Directora de Marketing con experiencia en growth hacking y marketing digital para startups.',
        role: 'Head of Marketing',
        company: 'GrowthLab',
        industry: 'Marketing',
        location: 'Valencia',
        experience_years: 5,
        avatar_url: '',
        skills: ['Growth Hacking', 'Digital Marketing', 'Analytics', 'Content Strategy'],
        interests: ['Marketing Digital', 'Startups', 'E-commerce'],
        business_goals: { type: 'consulting', funding: 'none' }
      }
    ];

    // Simular perfil del usuario actual
    const currentUserProfile = {
      industry: 'Tecnología',
      skills: ['JavaScript', 'React', 'Node.js', 'Product Management'],
      interests: ['Startups', 'Tecnología', 'Innovación'],
      business_goals: { type: 'partnership', funding: 'seeking' },
      location: 'Madrid'
    };

    // Calcular scoring profesional para cada match
    const processedMatches: ProfessionalMatch[] = mockMatches.map((match: UserProfile) => {
      const compatibility = calculateProfessionalCompatibility(
        currentUserProfile,
        match
      );

      const mutualConnections = Math.floor(Math.random() * 5);

      return {
        ...match,
        compatibility_score: compatibility.overall,
        mutual_connections: mutualConnections,
        shared_interests: compatibility.sharedInterests,
        complementary_skills: compatibility.complementarySkills,
        business_synergy: compatibility.businessSynergy,
        networking_potential: compatibility.networkingPotential,
        collaboration_score: compatibility.collaborationScore
      };
    });

    // Filtrar por score mínimo y ordenar
    const filteredMatches = processedMatches
      .filter((match: ProfessionalMatch) => match.compatibility_score >= minScore)
      .sort((a: ProfessionalMatch, b: ProfessionalMatch) => b.compatibility_score - a.compatibility_score);

    return NextResponse.json({ 
      matches: filteredMatches,
      total: filteredMatches.length 
    });

  } catch (error) {
    console.error('Error in professional matching:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función para calcular compatibilidad profesional
function calculateProfessionalCompatibility(currentUser: any, targetUser: UserProfile) {
  let score = 50; // Base score
  const sharedInterests: string[] = [];
  const complementarySkills: string[] = [];

  // Compatibilidad de industria (25% del score)
  if (currentUser?.industry && targetUser?.industry) {
    if (currentUser.industry === targetUser.industry) {
      score += 25;
    } else if (areRelatedIndustries(currentUser.industry, targetUser.industry)) {
      score += 15;
    }
  }

  // Intereses compartidos (20% del score)
  if (currentUser?.interests && targetUser?.interests) {
    const currentInterests = Array.isArray(currentUser.interests) ? currentUser.interests : [];
    const targetInterests = Array.isArray(targetUser.interests) ? targetUser.interests : [];
    
    const shared = currentInterests.filter((interest: string) => 
      targetInterests.includes(interest)
    );
    
    sharedInterests.push(...shared);
    score += Math.min(shared.length * 4, 20);
  }

  // Habilidades complementarias (20% del score)
  if (currentUser?.skills && targetUser?.skills) {
    const currentSkills = Array.isArray(currentUser.skills) ? currentUser.skills : [];
    const targetSkills = Array.isArray(targetUser.skills) ? targetUser.skills : [];
    
    const complementary = findComplementarySkills(currentSkills, targetSkills);
    complementarySkills.push(...complementary);
    score += Math.min(complementary.length * 3, 20);
  }

  // Objetivos de negocio compatibles (15% del score)
  if (currentUser?.business_goals && targetUser?.business_goals) {
    const compatibility = calculateBusinessGoalsCompatibility(
      currentUser.business_goals,
      targetUser.business_goals
    );
    score += compatibility * 15;
  }

  // Proximidad geográfica (10% del score)
  if (currentUser?.location && targetUser?.location) {
    if (currentUser.location === targetUser.location) {
      score += 10;
    } else if (areNearbyLocations(currentUser.location, targetUser.location)) {
      score += 5;
    }
  }

  // Asegurar que el score esté entre 0 y 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  const businessSynergy = Math.min(100, score + Math.floor(Math.random() * 10));
  const networkingPotential = Math.min(100, score + Math.floor(Math.random() * 15));
  const collaborationScore = Math.min(100, score + Math.floor(Math.random() * 8));

  return {
    overall: score,
    sharedInterests,
    complementarySkills,
    businessSynergy,
    networkingPotential,
    collaborationScore
  };
}

// Funciones auxiliares
function areRelatedIndustries(industry1: string, industry2: string): boolean {
  const relatedGroups = [
    ['tecnología', 'fintech', 'software'],
    ['salud', 'biotecnología', 'farmacéutica'],
    ['e-commerce', 'retail', 'marketing'],
    ['educación', 'edtech', 'capacitación']
  ];

  return relatedGroups.some(group => 
    group.includes(industry1.toLowerCase()) && group.includes(industry2.toLowerCase())
  );
}

function findComplementarySkills(skills1: string[], skills2: string[]): string[] {
  const complementaryPairs = [
    ['frontend', 'backend'],
    ['marketing', 'ventas'],
    ['diseño', 'desarrollo'],
    ['finanzas', 'contabilidad'],
    ['producto', 'tecnología']
  ];

  const complementary: string[] = [];
  
  skills1.forEach(skill1 => {
    skills2.forEach(skill2 => {
      complementaryPairs.forEach(pair => {
        if ((pair.includes(skill1.toLowerCase()) && pair.includes(skill2.toLowerCase())) &&
            skill1.toLowerCase() !== skill2.toLowerCase()) {
          complementary.push(skill2);
        }
      });
    });
  });

  return Array.from(new Set(complementary));
}

function calculateBusinessGoalsCompatibility(goals1: any, goals2: any): number {
  if (goals1?.type === goals2?.type) return 1;
  if (goals1?.type === 'partnership' && goals2?.type === 'scaling') return 0.8;
  if (goals1?.funding === 'seeking' && goals2?.funding === 'funded') return 0.9;
  return 0.5;
}

function areNearbyLocations(location1: string, location2: string): boolean {
  const nearbyRegions = [
    ['madrid', 'toledo', 'guadalajara'],
    ['barcelona', 'tarragona', 'lleida'],
    ['valencia', 'castellón', 'alicante']
  ];

  return nearbyRegions.some(region => 
    region.includes(location1.toLowerCase()) && region.includes(location2.toLowerCase())
  );
}
