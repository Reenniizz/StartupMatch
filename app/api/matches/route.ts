// ==============================================
// API: Get Potential Matches
// GET /api/matches?userId=xxx&limit=10
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserProfileWithSkills, 
  calculateUserCompatibility,
  saveCompatibilityCache 
} from '@/lib/matching-algorithm';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Obtener perfil del usuario actual
    const currentUser = await getUserProfileWithSkills(userId);
    if (!currentUser) {
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      });
    }

    // Obtener usuarios potenciales usando la función de BD
    const { data: potentialUsers, error } = await supabase
      .rpc('get_potential_matches', {
        target_user_id: userId,
        limit_count: limit * 2, // Obtener más para calcular y filtrar
        min_compatibility: 50
      });

    if (error) {
      console.error('Error getting potential matches:', error);
      // No es un error crítico si no hay usuarios, devolvemos lista vacía
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      });
    }

    if (!potentialUsers || potentialUsers.length === 0) {
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      });
    }

    // Calcular compatibilidad para cada usuario potencial
    const matchPromises = potentialUsers.map(async (user: any) => {
      try {
        // Obtener perfil completo con skills
        const targetUser = await getUserProfileWithSkills(user.user_id);
        if (!targetUser) return null;

        // Calcular compatibilidad
        const compatibility = await calculateUserCompatibility(currentUser, targetUser);

        // Guardar en cache para optimizar futuras consultas
        await saveCompatibilityCache(userId, user.user_id, compatibility);

        return {
          id: targetUser.id,
          username: targetUser.username,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          bio: targetUser.bio,
          role: targetUser.role,
          company: targetUser.company,
          industry: targetUser.industry,
          location: targetUser.location,
          experience_years: targetUser.experience_years,
          skills: targetUser.skills.slice(0, 5), // Solo top 5 skills para UI
          compatibility_score: compatibility.compatibility_score,
          match_reasons: compatibility.match_reasons,
          calculation_details: compatibility.calculation_details
        };
      } catch (error) {
        console.error(`Error calculating compatibility for user ${user.user_id}:`, error);
        return null;
      }
    });

    const matches = await Promise.all(matchPromises);
    
    // Filtrar matches nulos y ordenar por score
    const validMatches = matches
      .filter(match => match !== null)
      .sort((a, b) => b!.compatibility_score - a!.compatibility_score)
      .slice(0, limit);

    return NextResponse.json({
      matches: validMatches,
      total: validMatches.length,
      user_id: userId
    });

  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
