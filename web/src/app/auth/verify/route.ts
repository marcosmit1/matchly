import { createClient } from '@/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const redirectTo = searchParams.get('redirect_to') || '/';

  if (!token || type !== 'signup') {
    redirect('/login?error=invalid_verification');
  }

  try {
    const supabase = await createClient();
    
    // Exchange the verification token for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(token);
    
    if (error) {
      console.error('Error exchanging verification token:', error);
      redirect('/login?error=verification_failed');
    }

    if (data.session) {
      // Successfully verified and authenticated, redirect to the app
      console.log('User verified and authenticated successfully');
      redirect(redirectTo);
    } else {
      // No session created, redirect to login
      console.log('No session created after verification');
      redirect('/login?error=no_session');
    }
  } catch (error) {
    console.error('Unexpected error in verification:', error);
    redirect('/login?error=unexpected_error');
  }
}
