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
  ) => Promise<{ error: any; needsConfirmation?: boolean }>;
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
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Error al obtener sesión inicial:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error de red al obtener sesión:', error);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    // Try to sign up first
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

    // If signup successful, check if user was created and session exists
    if (signUpData.session) {
      // User is already logged in (email confirmation disabled)
      return { error: null };
    }

    // If no session but user was created, it means email confirmation is required
    // But we still consider this a successful registration
    if (signUpData.user) {
      return { 
        error: null, 
        needsConfirmation: !signUpData.user.email_confirmed_at 
      };
    }

    return { error: new Error('Unknown error during registration') };
  };

  const signOut = async () => {
    try {
      // Intentar cerrar sesión en Supabase con timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const signOutPromise = supabase.auth.signOut();
      
      await Promise.race([signOutPromise, timeoutPromise]);
      
      console.log('✅ Logout exitoso en Supabase');
    } catch (error) {
      console.warn('⚠️ Error al cerrar sesión en Supabase (procediendo con limpieza local):', error);
    }
    
    // SIEMPRE limpiar estado local, independientemente del resultado
    setUser(null);
    setSession(null);
    
    // Limpiar todas las posibles ubicaciones de tokens
    if (typeof window !== 'undefined') {
      try {
        // Limpiar localStorage de Supabase
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Limpiar sessionStorage también
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
        
        console.log('🧹 Cache local limpiado');
      } catch (storageError) {
        console.warn('Error limpiando storage:', storageError);
      }
    }
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
