"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createSecureBrowserClient, secureSignOut } from '@/lib/auth-secure';
import { validateAndSanitize, loginSchema, registerSchema } from '@/lib/input-validation';
import { secureLog } from '@/lib/input-validation';

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
    
    // ✅ SECURE: Get initial user with validation
    const initializeAuth = async () => {
      try {
        const supabase = createSecureBrowserClient();
        
        // Use getUser() for secure authentication check
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          secureLog('warn', 'Error validating initial user', { 
            error: error.message 
          });
          setUser(null);
          setSession(null);
        } else {
          setUser(user);
          // If user exists, also get session for UI state
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        secureLog('error', 'Network error validating user', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const supabase = createSecureBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      secureLog('info', 'Auth state change', { 
        event, 
        hasSession: !!session,
        userEmail: session?.user?.email?.replace(/(.{3}).+(@.+)/, '$1***$2')
      });
      
      // ⚠️ WARNING: session from onAuthStateChange may not be secure
      // For critical operations, always use getUser() to validate
      if (session?.user) {
        // Re-validate user for security
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          setUser(user);
          setSession(session); // Use session only for UI state
        } else {
          setUser(null);
          setSession(null);
        }
      } else {
        setUser(null);
        setSession(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Validate input first
      const validation = validateAndSanitize(loginSchema, { email, password });
      
      if (!validation.success) {
        return { 
          error: { 
            message: validation.errors.join(', ') 
          } 
        };
      }

      const supabase = createSecureBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        secureLog('warn', 'Sign in failed', { 
          email: validation.data.email.replace(/(.{3}).+(@.+)/, '$1***$2'),
          error: error.message 
        });
      } else {
        secureLog('info', 'Sign in successful', { 
          email: validation.data.email.replace(/(.{3}).+(@.+)/, '$1***$2')
        });
      }

      return { error };
    } catch (error) {
      secureLog('error', 'Network error during sign in', error);
      return { error: { message: 'Network error during authentication' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Validate input first
      const validation = validateAndSanitize(loginSchema, { email, password });
      
      if (!validation.success) {
        return { 
          error: { 
            message: validation.errors.join(', ') 
          } 
        };
      }

      const supabase = createSecureBrowserClient();
      const { error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        secureLog('warn', 'Sign up failed', { 
          email: validation.data.email.replace(/(.{3}).+(@.+)/, '$1***$2'),
          error: error.message 
        });
      } else {
        secureLog('info', 'Sign up successful', { 
          email: validation.data.email.replace(/(.{3}).+(@.+)/, '$1***$2')
        });
      }

      return { error };
    } catch (error) {
      secureLog('error', 'Network error during sign up', error);
      return { error: { message: 'Network error during registration' } };
    }
  };

  const signUpAndLogin = async (email: string, password: string, metadata?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    [key: string]: any;
  }) => {
    // 🔍 DEBUG: Log signup attempt
    secureLog('info', 'Starting secure signup process', {
      hasEmail: !!email,
      hasPassword: !!password,
      hasMetadata: !!metadata
    });

    try {
      // Validate input with comprehensive schema
      const validation = validateAndSanitize(registerSchema, {
        firstName: metadata?.firstName || '',
        lastName: metadata?.lastName || '',
        username: metadata?.username || '',
        email,
        password,
        confirmPassword: password
      });

      if (!validation.success) {
        secureLog('warn', 'Registration validation failed', { 
          errors: validation.errors 
        });
        return { error: { message: validation.errors.join(', ') } };
      }

      const supabase = createSecureBrowserClient();

      // Try to sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            firstName: validation.data.firstName,
            lastName: validation.data.lastName,
            username: validation.data.username,
            ...metadata
          }
        }
      });
      
      // 🔍 DEBUG: Log Supabase response
      secureLog('info', 'Supabase signup response', {
        hasUser: !!signUpData?.user,
        hasSession: !!signUpData?.session,
        emailConfirmed: !!signUpData?.user?.email_confirmed_at,
        hasError: !!signUpError
      });
      
      if (signUpError) {
        secureLog('error', 'Signup error', { error: signUpError.message });
        return { error: signUpError };
      }

      // If signup successful, check if user was created and session exists
      if (signUpData.session) {
        // User is already logged in (email confirmation disabled)
        secureLog('info', 'Session created - user logged in automatically');
        return { error: null, user: signUpData.user };
      }

      // If no session but user was created, it means email confirmation is required
      // But we still consider this a successful registration
      if (signUpData.user) {
        secureLog('info', 'User created - email confirmation may be required');
        return { 
          error: null, 
          needsConfirmation: !signUpData.user.email_confirmed_at,
          user: signUpData.user
        };
      }

      // Neither session nor user - something went wrong
      secureLog('error', 'No user or session created');
      return { error: { message: "Failed to create user account" } };

    } catch (error) {
      secureLog('error', 'Exception during signup', error);
      return { error: { message: `Registration failed: ${error instanceof Error ? error.message : String(error)}` } };
    }
  };

  const signOut = async () => {
    try {
      secureLog('info', 'Starting secure sign out');
      await secureSignOut();
      
      // SIEMPRE limpiar estado local
      setUser(null);
      setSession(null);
      
      secureLog('info', 'Sign out completed successfully');
    } catch (error) {
      secureLog('error', 'Error during sign out', error);
      
      // Limpiar estado local incluso si hay error
      setUser(null);
      setSession(null);
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
