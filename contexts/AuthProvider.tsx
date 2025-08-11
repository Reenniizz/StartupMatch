"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
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
    await supabase.auth.signOut();
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
