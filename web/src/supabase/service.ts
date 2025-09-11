import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createClient() {
  // Create a service role client that bypasses RLS completely
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
