// Edge runtime optimization para API routes más eficientes
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Optimización de caché para datos estáticos
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
    };

    // Datos mínimos para reducir payload
    const minimalData = {
      timestamp: Date.now(),
      status: 'ok'
    };

    return NextResponse.json(minimalData, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
