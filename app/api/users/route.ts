// ==============================================
// API: Get All Users (Para testing y explorar)
// GET /api/users - Obtener todos los usuarios disponibles
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentAuthUserId = searchParams.get('excludeUserId');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('=== API USERS DEBUG (CORREGIDA) ===');
    console.log('Auth User ID to exclude:', currentAuthUserId);
    console.log('limit:', limit);

    if (!currentAuthUserId) {
      return NextResponse.json({
        users: [],
        message: 'No se proporcionó ID de usuario para excluir',
        total: 0
      });
    }

    // Obtener todos los perfiles que NO sean del usuario actual
    // IMPORTANTE: Usar user_id para la comparación, no id
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
      .neq('user_id', currentAuthUserId) // Excluir por user_id, no por id
      .limit(limit);

    console.log('Perfiles encontrados (excluyendo current user):', allProfiles?.length || 0);
    console.log('User IDs encontrados:', allProfiles?.map(u => u.user_id) || []);

    if (allProfilesError) {
      console.error('Error fetching user_profiles:', allProfilesError);
      return NextResponse.json({
        users: [],
        message: 'Error al obtener perfiles de usuario',
        total: 0
      });
    }

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        message: 'No hay otros usuarios disponibles',
        total: 0
      });
    }

    // Formatear usuarios usando user_id como identificador principal
    const formattedUsers = allProfiles.map((user: any) => ({
      id: user.user_id, // USAR user_id como ID principal
      username: user.username || 'usuario',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || 'Sin descripción disponible',
      role: user.role || 'Usuario',
      company: user.company || 'Sin empresa',
      industry: user.industry || 'No especificada',
      location: user.location || 'Ubicación no especificada',
      experience_years: user.experience_years || 0,
      email: user.email,
      skills: [], // Por ahora vacío
      compatibility_score: Math.floor(Math.random() * 30) + 70, // Score aleatorio para testing
      created_at: user.created_at,
      source: 'user_profiles'
    }));

    console.log('Usuarios formateados a retornar:', formattedUsers.length);
    console.log('IDs de usuarios a mostrar:', formattedUsers.map((u: any) => u.id));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      source: 'user_profiles',
      excluded_user_id: currentAuthUserId
    });

  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error', users: [], total: 0 },
      { status: 500 }
    );
  }
}
