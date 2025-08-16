// ==============================================
// API: User Mutual Matches
// GET /api/mutual-matches?userId=xxx
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserMatches } from '@/lib/matching-algorithm';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Obtener matches sin joins complejos - hacer consultas separadas
    const { data: matches, error } = await supabase
      .from('mutual_matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('match_status', status)
      .order('matched_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching mutual matches:', error);
      return NextResponse.json(
        { error: 'Error fetching matches' },
        { status: 500 }
      );
    }

    // Obtener perfiles de usuarios por separado
    const userIds: string[] = [];
    (matches || []).forEach(match => {
      if (match.user1_id !== userId) userIds.push(match.user1_id);
      if (match.user2_id !== userId) userIds.push(match.user2_id);
    });

    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, first_name, last_name, bio, role, company, industry, location')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching user profiles:', profileError);
        profiles = [];
      } else {
        profiles = profilesData || [];
      }
    }

    if (error) {
      console.error('Error fetching mutual matches:', error);
      return NextResponse.json(
        { error: 'Error fetching matches' },
        { status: 500 }
      );
    }

    // Crear mapa de perfiles para búsqueda rápida
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    // Formatear respuesta con el perfil del otro usuario
    const formattedMatches = (matches || []).map(match => {
      const isUser1 = match.user1_id === userId;
      const otherUserId = isUser1 ? match.user2_id : match.user1_id;
      const otherUser = profileMap.get(otherUserId);

      return {
        match_id: match.id,
        matched_at: match.matched_at,
        compatibility_score: match.compatibility_score,
        match_status: match.match_status,
        other_user: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          bio: otherUser.bio,
          role: otherUser.role,
          company: otherUser.company,
          industry: otherUser.industry,
          location: otherUser.location
        } : {
          id: otherUserId,
          username: 'Usuario no encontrado',
          first_name: '',
          last_name: '',
          bio: '',
          role: '',
          company: '',
          industry: '',
          location: ''
        }
      };
    });

    return NextResponse.json({
      matches: formattedMatches,
      total: formattedMatches.length,
      user_id: userId,
      status: status
    });

  } catch (error) {
    console.error('Error in mutual matches API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==============================================
// PUT: Update Match Status
// PUT /api/mutual-matches
// ==============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { match_id, status, user_id } = body;

    if (!match_id || !status || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id, status, user_id' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'blocked', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, blocked, or archived' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es parte del match
    const { data: match, error: matchError } = await supabase
      .from('mutual_matches')
      .select('*')
      .eq('id', match_id)
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found or user not authorized' },
        { status: 404 }
      );
    }

    // Actualizar estado del match
    const { error: updateError } = await supabase
      .from('mutual_matches')
      .update({ match_status: status })
      .eq('id', match_id);

    if (updateError) {
      console.error('Error updating match status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update match status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      match_id,
      new_status: status,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in PUT mutual matches API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
