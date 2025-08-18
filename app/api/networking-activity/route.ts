import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Generar datos simulados de actividad basados en el rango
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const activity = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      activity.push({
        date: date.toISOString().split('T')[0],
        new_connections: Math.floor(Math.random() * 3) + 1,
        messages_sent: Math.floor(Math.random() * 10) + 2,
        meetings_scheduled: Math.floor(Math.random() * 2),
        profile_views: Math.floor(Math.random() * 15) + 5
      });
    }

    return NextResponse.json({
      activity,
      summary: {
        total_new_connections: activity.reduce((sum, day) => sum + day.new_connections, 0),
        total_messages: activity.reduce((sum, day) => sum + day.messages_sent, 0),
        total_meetings: activity.reduce((sum, day) => sum + day.meetings_scheduled, 0),
        total_views: activity.reduce((sum, day) => sum + day.profile_views, 0),
        range
      }
    });

  } catch (error) {
    console.error('Error fetching networking activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
