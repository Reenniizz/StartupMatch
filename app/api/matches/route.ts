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
import { secureAuthService } from '@/lib/auth-security';
import { rateLimit } from '@/lib/rate-limiting';
import { inputValidationService } from '@/lib/input-validation';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { z } from 'zod';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

const GetQuerySchema = z.object({
  userId: z.string().min(1, 'userId parameter is required'),
  limit: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_matches_get', 100, 60000);
    if (!rl.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on matches GET', { source: 'matches', ip: clientIP });
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      userId: searchParams.get('userId'),
      limit: searchParams.get('limit')
    };

    // Validar query params
    const validation = inputValidationService.validate(queryData, GetQuerySchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input for matches GET', { source: 'matches', errors: validation.errors, ip: clientIP });
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    const userId = validation.sanitizedData.userId;
    const limit = Math.min(Math.max(parseInt(validation.sanitizedData.limit || '10') || 10, 1), 50);

    // Obtener perfil del usuario actual
    const currentUser = await getUserProfileWithSkills(userId);
    if (!currentUser) {
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      }, { headers: getAPISecurityHeaders() });
    }

    // Obtener usuarios potenciales usando la función de BD
    const { data: potentialUsers, error } = await supabase
      .rpc('get_potential_matches', {
        p_target_user_id: userId,
        p_limit_count: limit * 2, // Obtener más para calcular y filtrar
        p_min_compatibility: 50
      });

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error getting potential matches', { source: 'matches', error: error.message, ip: clientIP, userId });
      // No es un error crítico si no hay usuarios, devolvemos lista vacía
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      }, { headers: getAPISecurityHeaders() });
    }

    if (!potentialUsers || potentialUsers.length === 0) {
      return NextResponse.json({
        matches: [],
        message: 'No hay usuarios disponibles todavía',
        total: 0,
        user_id: userId
      }, { headers: getAPISecurityHeaders() });
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
        logSecurityEvent('system', 'low', 'Error calculating compatibility', { source: 'matches', error: error instanceof Error ? error.message : 'unknown', targetUserId: user.user_id, ip: clientIP });
        return null;
      }
    });

    const matches = await Promise.all(matchPromises);
    
    // Filtrar matches nulos y ordenar por score
    const validMatches = matches
      .filter(match => match !== null)
      .sort((a, b) => b!.compatibility_score - a!.compatibility_score)
      .slice(0, limit);

    logSecurityEvent('system', 'low', 'Matches GET success', { source: 'matches', userId, count: validMatches.length, ip: clientIP });

    return NextResponse.json({
      matches: validMatches,
      total: validMatches.length,
      user_id: userId
    }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error matches GET', { source: 'matches', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getAPISecurityHeaders() }
    );
  }
}
