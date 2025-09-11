import { createClient } from "@/supabase/server";
import { Client } from "./client";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { username: string | null } | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("username").eq("id", user.id).maybeSingle();
    profile = data ?? null;
  }
  return <Client initialUsername={profile?.username ?? ""} />;
}
