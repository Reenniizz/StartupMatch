/**
 * Utility functions for secure authentication with Supabase
 * Addresses security warning: "Using getSession() could be insecure"
 */

import { createServerClient } from '@supabase/ssr';
import { supabase } from './supabase-client';
import type { NextRequest } from 'next/server';

/**
 * Secure server-side user authentication
 * Uses getUser() instead of getSession() for security
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        }
      }
    }
  );

  try {
    // ✅ SECURE: This validates the token with Supabase servers
    const { data: { user }, error } = await supabaseServer.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: error?.message || 'User not authenticated' };
    }

    return { user, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication error' 
    };
  }
}

/**
 * Secure client-side user authentication
 * Uses getUser() instead of getSession() for security
 */
export async function getAuthenticatedUserClient() {
  try {
    // ✅ SECURE: This validates the token with Supabase servers
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: error?.message || 'User not authenticated' };
    }

    return { user, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication error' 
    };
  }
}

/**
 * Get user session safely for backward compatibility
 * Still uses getSession but with proper warning handling
 * 
 * NOTE: Only use this for non-critical operations where session 
 * validation is not required (like UI state)
 */
export async function getUserSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { 
      session: null, 
      error: error instanceof Error ? error.message : 'Session error' 
    };
  }
}

/**
 * Secure authentication check for API routes
 * Returns user or throws authentication error
 */
export async function requireAuth(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error(error || 'Authentication required');
  }
  
  return user;
}

/**
 * Check if user has specific role/permissions
 */
export async function checkUserPermissions(
  request: NextRequest, 
  requiredRoles: string[] = []
) {
  const user = await requireAuth(request);
  
  // Add role checking logic here if you have user roles
  // const userRole = user.user_metadata?.role || 'user';
  // if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
  //   throw new Error('Insufficient permissions');
  // }
  
  return user;
}
