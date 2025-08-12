import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const minCompatibility = parseInt(url.searchParams.get('min_compatibility') || '40');
    const industry = url.searchParams.get('industry');
    const location = url.searchParams.get('location');
    const connectionType = url.searchParams.get('connection_type');

    // Usar función de base de datos para obtener matches potenciales
    let query = supabase
      .rpc('get_potential_matches', {
        p_target_user_id: user.id,
        p_limit_count: limit,
        p_min_compatibility: minCompatibility
      });

    const { data: matches, error } = await query;

    if (error) {
      console.error('Error fetching matches:', error);
      return NextResponse.json({ error: 'Error al obtener matches' }, { status: 500 });
    }

    // Filtrar por parámetros adicionales si se proporcionan
    let filteredMatches = matches || [];

    if (industry) {
      filteredMatches = filteredMatches.filter((match: any) => 
        match.industry?.toLowerCase().includes(industry.toLowerCase())
      );
    }

    if (location) {
      filteredMatches = filteredMatches.filter((match: any) => 
        match.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Obtener skills comunes para cada match
    const matchesWithSkills = await Promise.all(
      filteredMatches.map(async (match: any) => {
        const { data: commonSkills } = await supabase
          .from('user_skills')
          .select(`
            skill_name,
            skill_level,
            skill_category
          `)
          .eq('user_id', match.matched_user_id)
          .in('skill_name', 
            // Subquery para obtener skills del usuario actual
            await supabase
              .from('user_skills')
              .select('skill_name')
              .eq('user_id', user.id)
              .then(({ data }) => data?.map(s => s.skill_name) || [])
          )
          .limit(5);

        return {
          ...match,
          common_skills_details: commonSkills || [],
          match_reasons: generateMatchReasons(match, commonSkills || [])
        };
      })
    );

    // Obtener estadísticas de matching
    const { count: totalPotentialCount, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .neq('user_id', user.id)
      .in('profile_visibility', ['public', 'connections']);

    return NextResponse.json({
      success: true,
      matches: matchesWithSkills,
      total_found: matchesWithSkills.length,
      total_potential: totalPotentialCount || 0,
      filters_applied: {
        min_compatibility: minCompatibility,
        industry,
        location,
        connection_type: connectionType
      }
    });

  } catch (error) {
    console.error('Error in matches discovery:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Actualizar scores de compatibilidad
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, forceRecalculate = false } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ID del usuario objetivo requerido' }, { status: 400 });
    }

    // Verificar si ya existe un score calculado recientemente
    const { data: existingScore } = await supabase
      .from('match_scores')
      .select('id, compatibility_score, calculated_at')
      .eq('user_id', user.id)
      .eq('matched_user_id', targetUserId)
      .single();

    // Si existe y es reciente (menos de 1 día), no recalcular a menos que se fuerce
    if (existingScore && !forceRecalculate) {
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      
      if (new Date(existingScore.calculated_at) > dayAgo) {
        return NextResponse.json({
          success: true,
          compatibility_score: existingScore.compatibility_score,
          cached: true,
          calculated_at: existingScore.calculated_at
        });
      }
    }

    // Calcular nuevo score usando función de base de datos
    const { data: compatibilityScore, error: calcError } = await supabase
      .rpc('calculate_compatibility', {
        p_user1_id: user.id,
        p_user2_id: targetUserId
      });

    if (calcError) {
      console.error('Error calculating compatibility:', calcError);
      return NextResponse.json({ error: 'Error al calcular compatibilidad' }, { status: 500 });
    }

    // Guardar o actualizar el score
    const { error: upsertError } = await supabase
      .from('match_scores')
      .upsert({
        user_id: user.id,
        matched_user_id: targetUserId,
        compatibility_score: compatibilityScore,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,matched_user_id'
      });

    if (upsertError) {
      console.error('Error saving compatibility score:', upsertError);
      return NextResponse.json({ error: 'Error al guardar score' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      compatibility_score: compatibilityScore,
      cached: false,
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in compatibility calculation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función helper para generar razones de match
function generateMatchReasons(match: any, commonSkills: any[]): string[] {
  const reasons: string[] = [];

  if (match.compatibility_score >= 80) {
    reasons.push('Compatibilidad muy alta');
  } else if (match.compatibility_score >= 60) {
    reasons.push('Buena compatibilidad general');
  }

  if (commonSkills.length >= 3) {
    reasons.push(`${commonSkills.length} habilidades en común`);
  } else if (commonSkills.length > 0) {
    reasons.push(`Comparten habilidades: ${commonSkills.slice(0, 2).map(s => s.skill_name).join(', ')}`);
  }

  if (match.industry) {
    reasons.push(`Misma industria: ${match.industry}`);
  }

  if (match.location) {
    reasons.push(`Ubicación: ${match.location}`);
  }

  if (match.is_online) {
    reasons.push('En línea ahora');
  }

  return reasons.slice(0, 4); // Limitar a 4 razones máximo
}
