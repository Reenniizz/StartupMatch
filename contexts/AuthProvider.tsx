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
    
    // 🚨 SAFETY TIMEOUT: Force loading to false after 10 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('⏰ AUTH TIMEOUT: Forzando fin de loading después de 10 segundos');
      setLoading(false);
    }, 10000);
    
    // ✅ SECURE: Get initial user with validation
    const initializeAuth = async () => {
      console.log('🔍 AUTH PROVIDER: Iniciando validación de usuario...');
      
      try {
        // Use getUser() for secure authentication check
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.warn('⚠️ Error al validar usuario inicial:', error);
          setUser(null);
          setSession(null);
        } else {
          console.log('✅ Usuario validado:', user?.email || 'Usuario anónimo');
          setUser(user);
          // If user exists, also get session for UI state
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        console.error('💥 Error de red al validar usuario:', error);
        setUser(null);
        setSession(null);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
        console.log('🏁 AUTH PROVIDER: Inicialización completada');
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'Sin usuario');
      
      try {
        // ⚠️ WARNING: session from onAuthStateChange may not be secure
        // For critical operations, always use getUser() to validate
        if (session?.user) {
          console.log('👤 Validando usuario desde state change...');
          // Re-validate user for security
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!error && user) {
            console.log('✅ Usuario re-validado exitosamente');
            setUser(user);
            setSession(session); // Use session only for UI state
          } else {
            console.warn('❌ Fallo en re-validación de usuario');
            setUser(null);
            setSession(null);
          }
        } else {
          console.log('🚪 Usuario desconectado');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('💥 Error en auth state change:', error);
        setUser(null);
        setSession(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
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
    // 🔍 DEBUG: Log signup attempt
    console.log("🔍 AUTH PROVIDER - INICIANDO SIGNUP");
    console.log("📧 Email:", email);
    console.log("🔑 Password provided:", !!password);
    console.log("📋 Metadata:", metadata);

    try {
      // Try to sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });
      
      // 🔍 DEBUG: Log Supabase response
      console.log("🔍 SUPABASE SIGNUP RESPONSE:");
      console.log("✅ Data:", signUpData);
      console.log("❌ Error:", signUpError);
      console.log("👤 User created:", !!signUpData?.user);
      console.log("🔐 Session created:", !!signUpData?.session);
      console.log("📧 Email confirmed:", signUpData?.user?.email_confirmed_at);
      
      if (signUpError) {
        console.error("❌ SIGNUP ERROR:", signUpError);
        return { error: signUpError };
      }

      // If signup successful, check if user was created and session exists
      if (signUpData.session) {
        // User is already logged in (email confirmation disabled)
        console.log("✅ SESIÓN CREADA - Usuario logueado automáticamente");
        return { error: null, user: signUpData.user };
      }

      // If no session but user was created, it means email confirmation is required
      // But we still consider this a successful registration
      if (signUpData.user) {
        console.log("📧 USUARIO CREADO - Confirmación de email requerida");
        return { 
          error: null, 
          needsConfirmation: !signUpData.user.email_confirmed_at,
          user: signUpData.user
        };
      }

      // Neither session nor user - something went wrong
      console.error("❌ NO SE CREÓ USUARIO NI SESIÓN");
      return { error: { message: "No se pudo crear el usuario" } };

    } catch (error) {
      console.error("💥 EXCEPCIÓN EN SIGNUP:", error);
      return { error: { message: `Error inesperado: ${error instanceof Error ? error.message : String(error)}` } };
    }
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
