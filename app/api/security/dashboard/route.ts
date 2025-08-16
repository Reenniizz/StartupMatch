import { NextRequest, NextResponse } from 'next/server';
import { SecurityMetrics } from '@/lib/security-logger';
import { getAuthenticatedUser } from '@/lib/auth-secure';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const authResult = await getAuthenticatedUser(request, new NextResponse());
    const user = authResult.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verificar rol de admin (esto debería venir del JWT o base de datos)
    // Por ahora, simplificamos la verificación
    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.app_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') as '1h' | '24h' | '7d' || '24h';

    // Obtener métricas de seguridad
    const metrics = await SecurityMetrics.getDashboardMetrics(timeframe);

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Security dashboard error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch security metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
