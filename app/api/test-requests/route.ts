// TEST API para verificar connection requests
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST: Verificando connection requests en la base de datos');

    // Usar cliente de servicio para evitar problemas de RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Obtener todas las solicitudes sin filtrar
    const { data: allRequests, error: allError } = await supabaseService
      .from('connection_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error obteniendo todas las solicitudes:', allError);
      return NextResponse.json({ error: 'Error en consulta', details: allError }, { status: 500 });
    }

    console.log('📊 Raw requests from DB:', allRequests?.length || 0);

    // Obtener perfiles de usuarios para identificar mejor
    const { data: profiles, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('user_id, username, first_name, last_name')
      .limit(50);

    if (profileError) {
      console.error('❌ Error obteniendo perfiles:', profileError);
    }

    const result = {
      total_requests: allRequests?.length || 0,
      requests: allRequests?.map((req: any) => ({
        id: req.id,
        requester_id: req.requester_id,
        addressee_id: req.addressee_id,
        status: req.status,
        message: req.message,
        created_at: req.created_at,
        requester_info: profiles?.find((p: any) => p.user_id === req.requester_id),
        addressee_info: profiles?.find((p: any) => p.user_id === req.addressee_id)
      })) || []
    };

    console.log('📊 Solicitudes encontradas:', result.total_requests);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    return NextResponse.json({ error: 'Error interno', details: error }, { status: 500 });
  }
}
