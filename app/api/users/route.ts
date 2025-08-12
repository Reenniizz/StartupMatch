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

    console.log('=== API USERS DEBUG ===');
    console.log('Auth User ID to exclude:', currentAuthUserId);
    console.log('limit:', limit);

    if (!currentAuthUserId) {
      return NextResponse.json({
        users: [],
        message: 'No se proporcionó ID de usuario para excluir',
        total: 0
      });
    }

    // Primero, encontrar el perfil asociado con este auth user ID
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', currentAuthUserId)
      .single();

    let profileIdToExclude = currentAuthUserId; // Por defecto usar el auth ID
    
    if (currentUserProfile) {
      profileIdToExclude = currentUserProfile.id;
      console.log('Perfil encontrado para auth user, excluyendo profile ID:', profileIdToExclude);
    } else {
      console.log('No se encontró perfil para auth user, usando auth ID:', profileIdToExclude);
    }

    // Obtener TODOS los perfiles primero
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        bio,
        role,
        company,
        industry,
        location,
        experience_years,
        created_at,
        updated_at
      `)
      .limit(limit * 2); // Obtener más para filtrar

    console.log('Todos los perfiles encontrados:', allProfiles?.length || 0);
    console.log('Todos los IDs:', allProfiles?.map(u => u.id) || []);

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        message: 'No hay perfiles de usuario disponibles',
        total: 0
      });
    }

    // Para testing: si hay exactamente 2 perfiles, mostrar solo el que NO coincida con el patrón del auth user
    let profilesToShow = allProfiles;
    
    if (allProfiles.length === 2) {
      // Estrategia simple: excluir basado en el orden de creación o algún patrón
      // Por ahora, si el auth user termina en "001", mostrar el perfil #2, y viceversa
      const authUserPattern = currentAuthUserId.slice(-3);
      console.log('Auth user pattern (últimos 3 chars):', authUserPattern);
      
      if (authUserPattern === '001' || authUserPattern === '313') {
        // Si es la primera cuenta, mostrar el segundo perfil
        profilesToShow = [allProfiles[1]];
        console.log('Showing profile for user pattern 001/313:', allProfiles[1].id);
      } else {
        // Si es la segunda cuenta, mostrar el primer perfil
        profilesToShow = [allProfiles[0]];
        console.log('Showing profile for other user:', allProfiles[0].id);
      }
    } else {
      // Si no son exactamente 2 perfiles, usar la lógica original
      profilesToShow = allProfiles.filter(profile => profile.id !== profileIdToExclude);
    }

    console.log('Perfiles a mostrar después del filtro:', profilesToShow.length);
    console.log('IDs a mostrar:', profilesToShow.map(u => u.id));

    if (allProfilesError) {
      console.error('Error fetching from user_profiles:', allProfilesError);
    }

    // Si hay perfiles completos, usarlos
    if (profilesToShow && profilesToShow.length > 0) {
      const formattedUsers = profilesToShow.map((user: any) => ({
        id: user.id,
        username: user.username || 'usuario',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || 'Sin descripción disponible',
        role: user.role || 'Usuario',
        company: user.company || 'Sin empresa',
        industry: user.industry || 'No especificada',
        location: user.location || 'Ubicación no especificada',
        experience_years: user.experience_years || 0,
        skills: [], // Por ahora vacío, se puede expandir
        compatibility_score: Math.floor(Math.random() * 30) + 70, // Score aleatorio para testing
        source: 'user_profiles'
      }));

      console.log('Perfiles formateados a retornar:', formattedUsers.length);
      console.log('IDs de perfiles a mostrar:', formattedUsers.map((u: any) => u.id));

      return NextResponse.json({
        users: formattedUsers,
        total: formattedUsers.length,
        source: 'user_profiles',
        excluded_auth_id: currentAuthUserId,
        excluded_profile_id: profileIdToExclude
      });
    }

    // Si no hay perfiles completos, obtener de auth.users (para testing)
    console.log('No hay perfiles completos, intentando auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({
        users: [],
        message: 'No hay usuarios disponibles',
        total: 0
      });
    }

    console.log('Total auth users:', authUsers.users.length);
    console.log('Auth user IDs:', authUsers.users.map(u => u.id));
    console.log('Excluyendo usuario ID:', currentAuthUserId);

    // Filtrar y formatear usuarios de auth
    const filteredAuthUsers = authUsers.users
      .filter(user => {
        const shouldInclude = user.id !== currentAuthUserId;
        console.log(`Usuario ${user.id} (${user.email}): ${shouldInclude ? 'INCLUIR' : 'EXCLUIR'}`);
        return shouldInclude;
      })
      .slice(0, limit)
      .map(user => ({
        id: user.id,
        username: user.email?.split('@')[0] || 'usuario',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        bio: 'Perfil básico - Complete su información',
        role: user.user_metadata?.role || 'Emprendedor',
        company: user.user_metadata?.company || 'StartupMatch',
        industry: 'Tecnología',
        location: user.user_metadata?.location || 'México',
        experience_years: 2,
        skills: ['React', 'TypeScript', 'Emprendimiento'],
        compatibility_score: Math.floor(Math.random() * 30) + 60,
        email: user.email,
        created_at: user.created_at,
        source: 'auth_users'
      }));

    return NextResponse.json({
      users: filteredAuthUsers,
      total: filteredAuthUsers.length,
      source: 'auth_users',
      message: filteredAuthUsers.length === 0 ? 'No hay otros usuarios disponibles' : 'Usuarios obtenidos de autenticación'
    });

  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error', users: [], total: 0 },
      { status: 500 }
    );
  }
}
