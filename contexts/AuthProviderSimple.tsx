"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signUpAndLogin: (
    email: string, 
    password: string, 
    metadata?: { firstName?: string; lastName?: string; username?: string; [key: string]: any }
  ) => Promise<{ error: any; needsConfirmation?: boolean; user?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    console.log('🚀 AuthProvider: Iniciando con timeout de seguridad...');
    
    // TIMEOUT DE SEGURIDAD: Si no se resuelve en 10 segundos, continuar sin autenticación
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de seguridad: Continuando sin autenticación');
      setLoading(false);
      setUser(null);
      setSession(null);
    }, 10000);

    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sesión inicial...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Error al obtener sesión inicial:', error);
        } else {
          console.log('✅ Sesión obtenida:', !!session);
        }
        
        clearTimeout(safetyTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error de red al obtener sesión:', error);
        clearTimeout(safetyTimeout);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Network error during sign in:', error);
      const processedError = handleSupabaseError(error);
      return { error: { message: processedError.message } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Network error during sign up:', error);
      const processedError = handleSupabaseError(error);
      return { error: { message: processedError.message } };
    }
  };

  const signUpAndLogin = async (email: string, password: string, metadata?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    [key: string]: any;
  }) => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });
      
      if (signUpError) {
        return { error: signUpError };
      }

      if (signUpData.session) {
        return { error: null, user: signUpData.user };
      }

      if (signUpData.user) {
        return { 
          error: null, 
          needsConfirmation: !signUpData.user.email_confirmed_at,
          user: signUpData.user
        };
      }

      return { error: { message: "No se pudo crear el usuario" } };

    } catch (error) {
      return { error: { message: `Error inesperado: ${error instanceof Error ? error.message : String(error)}` } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('⚠️ Error al cerrar sesión:', error);
    }
    
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signUpAndLogin,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {isClient ? children : <div className="min-h-screen bg-white" />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
