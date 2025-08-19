// ==============================================
// API: Get All Users (Para testing y explorar)
// GET /api/users - Obtener todos los usuarios disponibles
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { secureAuthService } from '@/lib/auth-security';
import { inputValidationService } from '@/lib/input-validation';
import { rateLimit } from '@/lib/rate-limiting';
import { sanitizeInput } from '@/lib/xss-protection';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { z } from 'zod';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

// Schema de validación para los parámetros de query
const QuerySchema = z.object({
  excludeUserId: z.string().min(1, 'ID de usuario requerido'),
  limit: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkLimit(clientIP, 'api_users', 100, 60000);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded for users API', {
        source: 'users_api',
        ip: clientIP,
        endpoint: '/api/users'
      });
      
      return NextResponse.json({
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter || 60
      }, { 
        status: 429,
        headers: {
          ...getAPISecurityHeaders(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      });
    }

    // 2. Validación de entrada
    const { searchParams } = new URL(request.url);
    const queryData = {
      excludeUserId: searchParams.get('excludeUserId'),
      limit: searchParams.get('limit')
    };

    const validation = inputValidationService.validate(queryData, QuerySchema);
    if (!validation.success) {
      logSecurityEvent('threat', 'medium', 'Invalid input in users API', {
        source: 'users_api',
        errors: validation.errors,
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Parámetros de entrada inválidos',
        code: 'INVALID_INPUT',
        details: validation.errors
      }, { 
        status: 400,
        headers: getAPISecurityHeaders()
      });
    }

    // Validar y procesar el limit manualmente
    const excludeUserId = validation.sanitizedData.excludeUserId;
    const limitParam = validation.sanitizedData.limit;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam) || 20, 1), 100) : 20;

    // 3. Autenticación
    try {
      const authContext = await secureAuthService.verifyAuth(request);
      
      // Verificar que el usuario autenticado coincide con el solicitante
      if (authContext.user && authContext.user.id !== excludeUserId) {
        logSecurityEvent('auth', 'medium', 'User ID mismatch in users API', {
          source: 'users_api',
          requestedId: excludeUserId,
          authenticatedId: authContext.user.id,
          ip: clientIP
        });
        
        return NextResponse.json({
          error: 'Acceso denegado: ID de usuario no coincide',
          code: 'FORBIDDEN'
        }, { 
          status: 403,
          headers: getAPISecurityHeaders()
        });
      }
    } catch (authError) {
      logSecurityEvent('auth', 'medium', 'Authentication failed in users API', {
        source: 'users_api',
        error: authError instanceof Error ? authError.message : 'Unknown auth error',
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Autenticación requerida',
        code: 'UNAUTHORIZED'
      }, { 
        status: 401,
        headers: getAPISecurityHeaders()
      });
    }

    // 4. Obtener perfiles de usuario
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        username,
        first_name,
        last_name,
        bio,
        role,
        company,
        industry,
        location,
        experience_years,
        email,
        created_at
      `)
      .neq('user_id', excludeUserId)
      .limit(limit);

    if (allProfilesError) {
      logSecurityEvent('system', 'medium', 'Database error in users API', {
        source: 'users_api',
        error: allProfilesError.message,
        ip: clientIP
      });
      
      return NextResponse.json({
        error: 'Error interno del servidor',
        code: 'DATABASE_ERROR'
      }, { 
        status: 500,
        headers: getAPISecurityHeaders()
      });
    }

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        message: 'No hay otros usuarios disponibles',
        total: 0
      }, { 
        headers: getAPISecurityHeaders()
      });
    }

    // 5. Formatear y sanitizar datos de respuesta
    const formattedUsers = allProfiles.map((user: any) => ({
      id: user.user_id,
      username: sanitizeInput(user.username || 'usuario', 'html'),
      first_name: sanitizeInput(user.first_name || '', 'html'),
      last_name: sanitizeInput(user.last_name || '', 'html'),
      bio: sanitizeInput(user.bio || 'Sin descripción disponible', 'html'),
      role: sanitizeInput(user.role || 'Usuario', 'html'),
      company: sanitizeInput(user.company || 'Sin empresa', 'html'),
      industry: sanitizeInput(user.industry || 'No especificada', 'html'),
      location: sanitizeInput(user.location || 'Ubicación no especificada', 'html'),
      experience_years: user.experience_years || 0,
      email: user.email,
      skills: [],
      compatibility_score: Math.floor(Math.random() * 30) + 70,
      created_at: user.created_at,
      source: 'user_profiles'
    }));

    // 6. Log de acceso exitoso
    logSecurityEvent('system', 'low', 'Users API accessed successfully', {
      source: 'users_api',
      userId: excludeUserId,
      resultsCount: formattedUsers.length,
      ip: clientIP
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      source: 'user_profiles',
      excluded_user_id: excludeUserId
    }, { 
      headers: getAPISecurityHeaders()
    });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error in users API', {
      source: 'users_api',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: getAPISecurityHeaders()
    });
  }
}
