// Verificación simple de conexión a Supabase
console.log('🔍 Verificando conexión a Supabase...');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbaxjoozbnffrryuywno.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXhqb296Ym5mZnJyeXV5d25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTkzMDcsImV4cCI6MjA3MDQ5NTMwN30.JlVJJDA1xUJ8qYUmOaEUeGaBED7auYCggX2Bx5z1ji0';

async function checkSecurityTable() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📊 Verificando tabla security_events...');
    
    // Intentar hacer un simple SELECT
    const { data, error } = await supabase
      .from('security_events')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('🚨 La tabla security_events NO existe. La migración falló.');
      }
    } else {
      console.log('✅ ¡Tabla security_events existe y es accesible!');
      console.log('📈 Datos:', data);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

checkSecurityTable();
