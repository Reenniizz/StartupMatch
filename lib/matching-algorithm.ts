// ==============================================
// StartupMatch - Sistema de Matching Algorithm
// ==============================================

import { supabase } from '@/lib/supabase-client';

export interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  experience_years: number;
  skills: UserSkill[];
}

export interface UserSkill {
  id: string;
  skill_name: string;
  skill_level: number; // 1-10
  skill_category: string;
}

export interface CompatibilityResult {
  user_id: string;
  compatibility_score: number;
  match_reasons: string[];
  calculation_details: CompatibilityBreakdown;
}

export interface CompatibilityBreakdown {
  skills_score: number;
  industry_score: number;
  location_score: number;
  experience_score: number;
  objectives_score: number;
  total_score: number;
}

export interface MatchInteraction {
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'pass' | 'super_like';
}

// ==============================================
// CONFIGURACIÓN DEL ALGORITMO
// ==============================================

const ALGORITHM_WEIGHTS = {
  skills: 0.40,      // 40% - Skills en común
  industry: 0.25,    // 25% - Industria compatible
  location: 0.15,    // 15% - Proximidad geográfica
  experience: 0.10,  // 10% - Nivel de experiencia
  objectives: 0.10   // 10% - Objetivos compatibles
};

const INDUSTRY_COMPATIBILITY: { [key: string]: string[] } = {
  'Tecnología': ['Fintech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'Gaming'],
  'Finanzas': ['Tecnología', 'Fintech', 'Real Estate', 'Consulting', 'Insurance'],
  'Salud': ['Tecnología', 'HealthTech', 'Biotecnología', 'Farmacéutica', 'Wellness'],
  'Educación': ['Tecnología', 'EdTech', 'Medios', 'Consulting', 'Training'],
  'E-commerce': ['Tecnología', 'Retail', 'Logística', 'Marketing', 'Fashion'],
  'Consultoría': ['Tecnología', 'Finanzas', 'Salud', 'Educación', 'Management'],
  'Media': ['Tecnología', 'Marketing', 'Entertainment', 'Gaming', 'Social Media'],
  'Real Estate': ['Tecnología', 'Finanzas', 'Construction', 'PropTech', 'Investment']
};

// ==============================================
// FUNCIONES DE CÁLCULO DE COMPATIBILIDAD
// ==============================================

/**
 * Calcula la compatibilidad entre skills de dos usuarios
 */
export function calculateSkillsCompatibility(skills1: UserSkill[], skills2: UserSkill[]): number {
  if (skills1.length === 0 || skills2.length === 0) return 30;

  const skillsMap1 = new Map(skills1.map(s => [s.skill_name.toLowerCase(), s.skill_level]));
  const skillsMap2 = new Map(skills2.map(s => [s.skill_name.toLowerCase(), s.skill_level]));

  let commonSkills = 0;
  let totalLevelDiff = 0;
  let commonSkillsCount = 0;

  // Calcular skills en común
  const skillNames1 = Array.from(skillsMap1.keys());
  for (const skillName of skillNames1) {
    const level1 = skillsMap1.get(skillName)!;
    if (skillsMap2.has(skillName)) {
      commonSkillsCount++;
      const level2 = skillsMap2.get(skillName)!;
      const levelDiff = Math.abs(level1 - level2);
      totalLevelDiff += levelDiff;
    }
  }

  if (commonSkillsCount === 0) return 20;

  // Score basado en:
  // 1. Porcentaje de skills en común
  // 2. Similitud en los niveles de skill
  const commonSkillsRatio = commonSkillsCount / Math.max(skills1.length, skills2.length);
  const avgLevelDiff = totalLevelDiff / commonSkillsCount;
  const levelSimilarity = Math.max(0, 1 - (avgLevelDiff / 10)); // Normalizar a 0-1

  const score = (commonSkillsRatio * 0.7 + levelSimilarity * 0.3) * 100;
  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula la compatibilidad entre industrias
 */
export function calculateIndustryCompatibility(industry1: string, industry2: string): number {
  if (!industry1 || !industry2) return 50;

  const normalizedIndustry1 = industry1.trim();
  const normalizedIndustry2 = industry2.trim();

  // Misma industria = 100%
  if (normalizedIndustry1.toLowerCase() === normalizedIndustry2.toLowerCase()) {
    return 100;
  }

  // Verificar compatibilidad en matriz
  const compatible1 = INDUSTRY_COMPATIBILITY[normalizedIndustry1] || [];
  const compatible2 = INDUSTRY_COMPATIBILITY[normalizedIndustry2] || [];

  if (compatible1.includes(normalizedIndustry2)) return 75;
  if (compatible2.includes(normalizedIndustry1)) return 75;

  // Verificar compatibilidad cruzada
  const hasCommonCompatible = compatible1.some(ind => compatible2.includes(ind));
  if (hasCommonCompatible) return 60;

  return 30; // Industrias no relacionadas
}

/**
 * Calcula la compatibilidad por ubicación
 */
export function calculateLocationCompatibility(location1: string, location2: string): number {
  if (!location1 || !location2) return 50;

  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();

  // Misma ubicación exacta
  if (loc1 === loc2) return 100;

  // Verificar si comparten ciudad/estado/país
  const words1 = loc1.split(/[\s,]+/);
  const words2 = loc2.split(/[\s,]+/);

  const commonWords = words1.filter(word => 
    word.length > 2 && words2.includes(word)
  );

  if (commonWords.length >= 2) return 90; // Probablemente misma ciudad
  if (commonWords.length === 1) return 70; // Probablemente mismo estado/país
  
  // Verificar ubicaciones remotas
  const remoteKeywords = ['remoto', 'remote', 'virtual', 'online', 'global'];
  const isRemote1 = remoteKeywords.some(keyword => loc1.includes(keyword));
  const isRemote2 = remoteKeywords.some(keyword => loc2.includes(keyword));
  
  if (isRemote1 || isRemote2) return 85; // Compatible para trabajo remoto

  return 40; // Ubicaciones diferentes
}

/**
 * Calcula la compatibilidad por experiencia
 */
export function calculateExperienceCompatibility(exp1: number, exp2: number): number {
  if (exp1 < 0 || exp2 < 0) return 50;

  const expDiff = Math.abs(exp1 - exp2);

  // Experiencia muy similar (0-2 años de diferencia)
  if (expDiff <= 2) return 100;
  
  // Experiencia complementaria (3-5 años de diferencia)
  if (expDiff <= 5) return 85;
  
  // Relación mentor/mentee (6-10 años de diferencia)
  if (expDiff <= 10) return 70;
  
  // Gran diferencia de experiencia
  if (expDiff <= 15) return 50;
  
  return 30; // Muy diferente nivel de experiencia
}

/**
 * Calcula compatibilidad por objetivos (simulado por ahora)
 * En el futuro se puede expandir con datos reales de objetivos del usuario
 */
export function calculateObjectivesCompatibility(user1: UserProfile, user2: UserProfile): number {
  // Por ahora, basamos los objetivos en el rol y experiencia
  const role1 = user1.role?.toLowerCase() || '';
  const role2 = user2.role?.toLowerCase() || '';

  // Roles complementarios
  const complementaryRoles = {
    'ceo': ['cto', 'coo', 'developer', 'designer'],
    'cto': ['ceo', 'developer', 'product manager'],
    'developer': ['designer', 'product manager', 'cto'],
    'designer': ['developer', 'product manager', 'marketer'],
    'marketer': ['designer', 'sales', 'growth'],
    'sales': ['marketer', 'business development']
  };

  for (const [role, compatible] of Object.entries(complementaryRoles)) {
    if (role1.includes(role) && compatible.some(compRole => role2.includes(compRole))) {
      return 90;
    }
    if (role2.includes(role) && compatible.some(compRole => role1.includes(compRole))) {
      return 90;
    }
  }

  // Mismos roles pero diferente experiencia (posible mentor/mentee)
  if (role1 === role2) {
    const expDiff = Math.abs(user1.experience_years - user2.experience_years);
    if (expDiff >= 5) return 75; // Mentor/mentee potential
    return 85; // Peers
  }

  return 60; // Compatibilidad neutral
}

/**
 * Función principal para calcular compatibilidad total
 */
export async function calculateUserCompatibility(
  user1: UserProfile, 
  user2: UserProfile
): Promise<CompatibilityResult> {
  // Calcular scores individuales
  const skillsScore = calculateSkillsCompatibility(user1.skills, user2.skills);
  const industryScore = calculateIndustryCompatibility(user1.industry, user2.industry);
  const locationScore = calculateLocationCompatibility(user1.location, user2.location);
  const experienceScore = calculateExperienceCompatibility(user1.experience_years, user2.experience_years);
  const objectivesScore = calculateObjectivesCompatibility(user1, user2);

  // Calcular score total ponderado
  const totalScore = Math.round(
    skillsScore * ALGORITHM_WEIGHTS.skills +
    industryScore * ALGORITHM_WEIGHTS.industry +
    locationScore * ALGORITHM_WEIGHTS.location +
    experienceScore * ALGORITHM_WEIGHTS.experience +
    objectivesScore * ALGORITHM_WEIGHTS.objectives
  );

  // Generar razones del match
  const matchReasons = generateMatchReasons({
    skills_score: skillsScore,
    industry_score: industryScore,
    location_score: locationScore,
    experience_score: experienceScore,
    objectives_score: objectivesScore,
    total_score: totalScore
  }, user1, user2);

  return {
    user_id: user2.id,
    compatibility_score: totalScore,
    match_reasons: matchReasons,
    calculation_details: {
      skills_score: skillsScore,
      industry_score: industryScore,
      location_score: locationScore,
      experience_score: experienceScore,
      objectives_score: objectivesScore,
      total_score: totalScore
    }
  };
}

/**
 * Genera razones explicativas del match
 */
function generateMatchReasons(
  scores: CompatibilityBreakdown,
  user1: UserProfile,
  user2: UserProfile
): string[] {
  const reasons: string[] = [];

  if (scores.skills_score >= 70) {
    const commonSkills = user1.skills.filter(s1 => 
      user2.skills.some(s2 => s1.skill_name.toLowerCase() === s2.skill_name.toLowerCase())
    );
    if (commonSkills.length > 0) {
      reasons.push(`Comparten ${commonSkills.length} habilidades: ${commonSkills.slice(0, 3).map(s => s.skill_name).join(', ')}`);
    }
  }

  if (scores.industry_score >= 80) {
    if (user1.industry === user2.industry) {
      reasons.push(`Ambos trabajan en ${user1.industry}`);
    } else {
      reasons.push(`Industrias complementarias: ${user1.industry} y ${user2.industry}`);
    }
  }

  if (scores.location_score >= 80) {
    reasons.push('Ubicación compatible para colaborar');
  }

  if (scores.experience_score >= 80) {
    const expDiff = Math.abs(user1.experience_years - user2.experience_years);
    if (expDiff <= 2) {
      reasons.push('Nivel de experiencia similar');
    } else {
      reasons.push('Experiencia complementaria');
    }
  }

  if (scores.objectives_score >= 80) {
    reasons.push('Roles complementarios para colaboración');
  }

  // Si no hay razones específicas, agregar una genérica
  if (reasons.length === 0) {
    reasons.push('Perfil interesante para networking');
  }

  return reasons.slice(0, 3); // Máximo 3 razones
}

// ==============================================
// FUNCIONES DE INTERACCIÓN CON BASE DE DATOS
// ==============================================

/**
 * Obtiene el perfil completo de un usuario con sus skills
 */
export async function getUserProfileWithSkills(userId: string): Promise<UserProfile | null> {
  try {
    // Obtener perfil básico
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Obtener skills del usuario
    const { data: skills, error: skillsError } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      return { ...profile, skills: [] };
    }

    return {
      ...profile,
      skills: skills || []
    };
  } catch (error) {
    console.error('Error in getUserProfileWithSkills:', error);
    return null;
  }
}

/**
 * Guarda una interacción de usuario (like/pass)
 */
export async function saveUserInteraction(interaction: MatchInteraction): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: interaction.user_id,
        target_user_id: interaction.target_user_id,
        interaction_type: interaction.interaction_type
      });

    if (error) {
      console.error('Error saving user interaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserInteraction:', error);
    return false;
  }
}

/**
 * Guarda el resultado de compatibilidad en cache
 */
export async function saveCompatibilityCache(
  user1Id: string,
  user2Id: string,
  result: CompatibilityResult
): Promise<boolean> {
  try {
    const sortedIds = [user1Id, user2Id].sort();
    
    const { error } = await supabase
      .from('compatibility_cache')
      .upsert({
        user1_id: sortedIds[0],
        user2_id: sortedIds[1],
        compatibility_score: result.compatibility_score,
        calculation_details: result.calculation_details,
        calculated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      });

    if (error) {
      console.error('Error saving compatibility cache:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveCompatibilityCache:', error);
    return false;
  }
}

/**
 * Obtiene matches mutuos de un usuario
 */
export async function getUserMatches(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('user_matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('match_status', 'active')
      .order('matched_at', { ascending: false });

    if (error) {
      console.error('Error fetching user matches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return [];
  }
}
