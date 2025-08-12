// app/api/test-login/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Try to sign in a test user - let's create one first if it doesn't exist
    const testEmail = 'test@startupmatch.com';
    const testPassword = 'password123';
    
    // First, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (!signInError && signInData.user) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test user signed in successfully',
        user: signInData.user 
      });
    }
    
    // If sign in failed, try to create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (signUpError) {
      console.error('Error creating test user:', signUpError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test user',
        details: signUpError 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test user created and signed in',
      user: signUpData.user,
      needsEmailConfirmation: !signUpData.session
    });
    
  } catch (error) {
    console.error('Error in test-login:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: error 
    });
  }
}
