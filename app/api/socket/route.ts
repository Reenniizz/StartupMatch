// app/api/socket/route.ts - Migrado desde Pages Router
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO is handled by custom server.js',
    endpoint: '/socket.io'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Use WebSocket connection via /socket.io',
    instructions: 'Connect to ws://localhost:3000/socket.io'
  }, { status: 405 });
}
