import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Datos simulados de métricas de networking
    const mockMetrics = {
      metrics: {
        total_connections: 47,
        active_conversations: 12,
        matches_this_month: 23,
        profile_views: 156,
        connection_acceptance_rate: 78,
        response_rate: 85,
        networking_score: 92,
        industry_ranking: 15,
        weekly_growth: 8.5,
        monthly_growth: 12.3
      }
    };

    return NextResponse.json(mockMetrics);

  } catch (error) {
    console.error('Error fetching networking metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
