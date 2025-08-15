// ==============================================
// API: Get Connection Requests (Solicitudes de conexión recibidas)
// GET /api/connections/requests - Obtener solicitudes pendientes
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { withSecureAPI } from '@/lib/api-security';
import { sanitizeInput } from '@/lib/security';

export const GET = withSecureAPI(
  async (request: NextRequest, { user, supabase }) => {
    try {
      console.log('🚀 GET /api/connections/requests - Obteniendo solicitudes recibidas para usuario:', user.id);

      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
      const status = sanitizeInput(searchParams.get('status') || 'pending');
      
      // Validar status permitidos
      const allowedStatuses = ['pending', 'accepted', 'rejected', 'cancelled'];
      const statusFilter = allowedStatuses.includes(status) ? status : 'pending';

      // Obtener solicitudes recibidas con seguridad RLS habilitada
      const { data: requests, error: requestsError } = await supabase
        .from('connection_requests')
        .select(`
          id,
          requester_id,
          message,
          status,
          created_at
        `)
        .eq('addressee_id', user.id)
        .eq('status', statusFilter)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (requestsError) {
        console.error('❌ Error obteniendo solicitudes:', requestsError);
        return NextResponse.json({ 
          error: 'Error al obtener solicitudes',
          requests: [],
          total: 0
        }, { status: 500 });
      }

      if (!requests || requests.length === 0) {
        console.log('✅ No hay solicitudes pendientes');
        return NextResponse.json({
          requests: [],
          total: 0,
          status: statusFilter
        });
      }

      // Obtener información de los perfiles de los remitentes de forma segura
      const requesterIds = requests.map((r: any) => r.requester_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          username,
          first_name,
          last_name,
          email,
          role,
          company,
          industry,
          location,
          bio
        `)
        .in('user_id', requesterIds);

      if (profilesError) {
        console.error('❌ Error obteniendo perfiles:', profilesError);
        // Continuar sin perfiles detallados
      }

      // Combinar solicitudes con información de perfiles de forma segura
      const formattedRequests = requests.map((request: any) => {
        const profile = profiles?.find((p: any) => p.user_id === request.requester_id);
        
        return {
          id: request.id,
          message: sanitizeInput(request.message || ''),
          status: request.status,
          created_at: request.created_at,
          requester: {
            user_id: request.requester_id,
            username: sanitizeInput(profile?.username || 'usuario'),
            first_name: sanitizeInput(profile?.first_name || 'Usuario'),
            last_name: sanitizeInput(profile?.last_name || ''),
            // No incluir email por privacidad a menos que sea necesario
            role: sanitizeInput(profile?.role || 'Usuario'),
            company: sanitizeInput(profile?.company || 'Sin empresa'),
            industry: sanitizeInput(profile?.industry || 'No especificada'),
            location: sanitizeInput(profile?.location || 'Ubicación no especificada'),
            bio: sanitizeInput(profile?.bio || 'Sin descripción').substring(0, 200) // Limitar bio
          }
        };
      });

      console.log(`✅ ${formattedRequests.length} solicitudes encontradas para usuario ${user.id}`);

      return NextResponse.json({
        requests: formattedRequests,
        total: formattedRequests.length,
        status: statusFilter
      });

    } catch (error) {
      console.error('❌ Error inesperado en /api/connections/requests:', error);
      return NextResponse.json({ 
        error: 'Error interno del servidor',
        requests: [],
        total: 0
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'api',
    logAccess: true,
  }
);
