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

  // Handle verification tokens (new flow)
  if (token && type === 'signup') {
    console.log('Processing verification token:', { token: token.substring(0, 10) + '...', type, redirectTo: next });
    
    try {
      const supabase = await createClient();
      console.log('Supabase client created successfully');
      
      // For verification tokens from email confirmation, we need to use a different approach
      // Let's try to get the user session directly since the token should have verified the user
      console.log('Attempting to get user session after verification...');
      
      // First, let's check if we can get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session after verification:', sessionError);
        redirect('/login?error=verification_failed');
      }
      
      if (session) {
        // User is already authenticated, redirect to the app
        console.log('User verified and authenticated successfully');
        redirect(next);
      } else {
        // No session found immediately, let's wait a bit and try again
        // Supabase might need a moment to process the verification
        console.log('No session found immediately, waiting and retrying...');
        
        // Wait 1 second for Supabase to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try again
        const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
        
        if (retryError) {
          console.error('Error getting session on retry:', retryError);
          redirect('/login?error=verification_failed');
        }
        
        if (retrySession) {
          console.log('User verified and authenticated successfully on retry');
          redirect(next);
        } else {
          // Still no session, the verification might not have completed properly
          console.log('No session found after retry, redirecting to login');
          redirect('/login?error=verification_incomplete');
        }
      }
    } catch (error) {
      console.error('Unexpected error in verification:', error);
      console.error('Error type:', typeof error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      redirect('/login?error=unexpected_error');
    }
  }

  // If there's no code or token, redirect to login
  redirect('/login?error=no_code');
}
