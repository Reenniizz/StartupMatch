import { NextRequest, NextResponse } from 'next/server';
import { csrfProtectionService } from '@/lib/csrf-protection';
import { getAPISecurityHeaders } from '@/lib/security-headers';

// Forzar renderizado dinámico para evitar problemas de static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Obtener sessionId del request
    const sessionId = request.cookies.get('session-id')?.value || 
                     request.headers.get('x-session-id') ||
                     request.headers.get('authorization')?.split(' ')[1]?.split('.')[2]; // JTI del JWT
    
    if (!sessionId) {
      return new NextResponse(
        JSON.stringify({
          error: 'Sesión no válida',
          message: 'Se requiere una sesión válida para generar token CSRF',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...getAPISecurityHeaders()
          }
        }
      );
    }
    
    // Generar token CSRF
    const csrfToken = csrfProtectionService.generateToken(sessionId);
    
    // Crear respuesta con token
    const response = NextResponse.json({
      token: csrfToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      message: 'Token CSRF generado exitosamente'
    });
    
    // Aplicar headers de seguridad
    Object.entries(getAPISecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Agregar headers específicos de CSRF
    response.headers.set('X-CSRF-Token-Generated', 'true');
    response.headers.set('X-CSRF-Token-Expires', new Date(Date.now() + 30 * 60 * 1000).toISOString());
    
    return response;
    
  } catch (error) {
    console.error('Error generando token CSRF:', error);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el token CSRF',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getAPISecurityHeaders()
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return new NextResponse(
        JSON.stringify({
          error: 'Session ID requerido',
          message: 'Se debe proporcionar un sessionId válido',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getAPISecurityHeaders()
          }
        }
      );
    }
    
    // Generar token CSRF
    const csrfToken = csrfProtectionService.generateToken(sessionId);
    
    // Crear respuesta con token
    const response = NextResponse.json({
      token: csrfToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      message: 'Token CSRF generado exitosamente'
    });
    
    // Aplicar headers de seguridad
    Object.entries(getAPISecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Error generando token CSRF:', error);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: 'No se pudo generar el token CSRF',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getAPISecurityHeaders()
        }
      }
    );
  }
}
