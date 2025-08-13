// Archivo temporal para testing
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🧪 TEST ENDPOINT - Funcionando correctamente');
  
  try {
    const body = await request.json();
    console.log('📦 Body recibido:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint funcionando',
      receivedData: body
    });
  } catch (error) {
    console.error('Error en test endpoint:', error);
    return NextResponse.json(
      { error: 'Error en test' },
      { status: 500 }
    );
  }
}
