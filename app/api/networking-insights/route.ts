import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mockInsights = {
      insights: {
        top_industries: [
          { name: 'Tecnología', connections: 18, growth_rate: 15 },
          { name: 'Fintech', connections: 12, growth_rate: 22 },
          { name: 'E-commerce', connections: 8, growth_rate: 8 },
          { name: 'Salud Digital', connections: 6, growth_rate: 35 },
          { name: 'Marketing', connections: 3, growth_rate: 5 }
        ],
        top_roles: [
          { name: 'Founder/CEO', connections: 15, avg_compatibility: 87 },
          { name: 'CTO', connections: 12, avg_compatibility: 92 },
          { name: 'Head of Marketing', connections: 8, avg_compatibility: 78 },
          { name: 'Product Manager', connections: 7, avg_compatibility: 83 },
          { name: 'Business Developer', connections: 5, avg_compatibility: 75 }
        ],
        geographic_distribution: [
          { location: 'Madrid', connections: 20, percentage: 43 },
          { location: 'Barcelona', connections: 15, percentage: 32 },
          { location: 'Valencia', connections: 6, percentage: 13 },
          { location: 'Sevilla', connections: 4, percentage: 8 },
          { location: 'Otros', connections: 2, percentage: 4 }
        ]
      }
    };

    return NextResponse.json(mockInsights);

  } catch (error) {
    console.error('Error fetching networking insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
