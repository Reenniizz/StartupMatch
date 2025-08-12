// ==============================================
// API: User Interactions (Like/Pass)
// POST /api/interactions
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { saveUserInteraction } from '@/lib/matching-algorithm';
import { supabase } from '@/lib/supabase-client';

interface InteractionRequest {
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'pass' | 'super_like';
}

export async function POST(request: NextRequest) {
  try {
    const body: InteractionRequest = await request.json();
    
    const { user_id, target_user_id, interaction_type } = body;

    // Validación de campos requeridos
    if (!user_id || !target_user_id || !interaction_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, target_user_id, interaction_type' },
        { status: 400 }
      );
    }

    // Validación de tipo de interacción
    const validTypes = ['like', 'pass', 'super_like'];
    if (!validTypes.includes(interaction_type)) {
      return NextResponse.json(
        { error: 'Invalid interaction_type. Must be: like, pass, or super_like' },
        { status: 400 }
      );
    }

    // Evitar auto-interacciones
    if (user_id === target_user_id) {
      return NextResponse.json(
        { error: 'Cannot interact with yourself' },
        { status: 400 }
      );
    }

    // Verificar que ambos usuarios existen
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .in('id', [user_id, target_user_id]);

    if (usersError || !users || users.length !== 2) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    // Guardar la interacción
    const success = await saveUserInteraction({
      user_id,
      target_user_id,
      interaction_type
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save interaction' },
        { status: 500 }
      );
    }

    // Verificar si se creó un match mutuo (solo para likes)
    let mutualMatch = null;
    if (interaction_type === 'like') {
      const { data: matchData, error: matchError } = await supabase
        .from('mutual_matches')
        .select('*')
        .eq('user1_id', user_id < target_user_id ? user_id : target_user_id)
        .eq('user2_id', user_id < target_user_id ? target_user_id : user_id)
        .single();

      if (!matchError && matchData) {
        mutualMatch = {
          id: matchData.id,
          matched_at: matchData.matched_at,
          compatibility_score: matchData.compatibility_score
        };
      }
    }

    const response: any = {
      success: true,
      interaction: {
        user_id,
        target_user_id,
        interaction_type,
        created_at: new Date().toISOString()
      }
    };

    if (mutualMatch) {
      response.mutual_match = mutualMatch;
      response.message = "¡Es un match! 🎉";
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in interactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==============================================
// GET: User Interactions History
// GET /api/interactions?userId=xxx&type=like
// ==============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const interactionType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('user_interactions')
      .select(`
        *,
        target_user:user_profiles!user_interactions_target_user_id_fkey(
          id,
          username,
          first_name,
          last_name,
          role,
          company
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (interactionType) {
      query = query.eq('interaction_type', interactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
      return NextResponse.json(
        { error: 'Error fetching interactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      interactions: data || [],
      total: data?.length || 0,
      user_id: userId
    });

  } catch (error) {
    console.error('Error in GET interactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
