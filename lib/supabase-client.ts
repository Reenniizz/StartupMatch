import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
})

// Función helper para manejar errores de red
export const handleSupabaseError = (error: any) => {
  if (error?.message?.includes('Failed to fetch')) {
    return {
      message: 'Error de conexión. Verifica tu conexión a internet.',
      isNetworkError: true
    }
  }
  
  if (error?.message?.includes('Invalid API key')) {
    return {
      message: 'Error de configuración. Contacta al administrador.',
      isConfigError: true
    }
  }
  
  return {
    message: error?.message || 'Error desconocido',
    isNetworkError: false,
    isConfigError: false
  }
}
