import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

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

  // Handle verification tokens (email confirmation flow)
  if (token && type === 'signup') {
    console.log('Processing email confirmation:', { token: token.substring(0, 10) + '...', type, redirectTo: next });
    
    try {
      const supabase = await createClient();
      console.log('Supabase client created successfully');
      
      // Use the proper Supabase method to verify the email confirmation
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });
      
      if (error) {
        console.error('Error verifying email confirmation:', error);
        redirect('/login?error=verification_failed');
      }
      
      if (data.session) {
        // User is now authenticated, redirect to the app
        console.log('Email confirmed and user authenticated successfully');
        redirect(next);
      } else {
        // No session created, redirect to login
        console.log('No session created after email confirmation');
        redirect('/login?error=no_session');
      }
    } catch (error) {
      console.error('Unexpected error in email confirmation:', error);
      redirect('/login?error=unexpected_error');
    }
  }

  // If there's no code or token, redirect to login
  redirect('/login?error=no_code');
}
