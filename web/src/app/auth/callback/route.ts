import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth callback received:', { 
    hasCode: !!code, 
    hasToken: !!token, 
    type, 
    next,
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Handle OTP codes (existing flow)
  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to login with error
        redirect('/login?error=verification_failed');
      }

      if (data.session) {
        // Successfully authenticated, redirect to the app
        console.log('User verified and authenticated successfully');
        redirect(next);
      } else {
        // No session created, redirect to login
        console.log('No session created after verification');
        redirect('/login?error=no_session');
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      redirect('/login?error=unexpected_error');
    }
  }

  // Handle email confirmation - Supabase sends different parameters
  // Check for email confirmation parameters
  const emailToken = searchParams.get('token') || searchParams.get('access_token');
  const emailType = searchParams.get('type') || searchParams.get('token_type');
  
  if (emailToken && (emailType === 'signup' || emailType === 'email')) {
    console.log('Processing email confirmation:', { 
      token: emailToken.substring(0, 10) + '...', 
      type: emailType, 
      redirectTo: next 
    });
    
    try {
      const supabase = await createClient();
      console.log('Supabase client created successfully');
      
      // For email confirmations, Supabase doesn't automatically create a session
      // The email confirmation just verifies the user's email
      // We need to check if the user is now confirmed and redirect appropriately
      
      try {
        // Check if user has a session (might be authenticated)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session) {
          console.log('User already has session, redirecting');
          redirect(next);
        }
        
        // No session found, which is normal for email confirmations
        // The user's email is now confirmed, but they need to sign in
        console.log('Email confirmed but no session, redirecting to login with success message');
        redirect('/login?message=email_confirmed');
      } catch (error) {
        console.error('Error checking session after email confirmation:', error);
        redirect('/login?error=verification_failed');
      }
    } catch (error) {
      console.error('Unexpected error in email confirmation:', error);
      redirect('/login?error=unexpected_error');
    }
  }

  // If there's no code or token, redirect to login
  redirect('/login?error=no_code');
}
