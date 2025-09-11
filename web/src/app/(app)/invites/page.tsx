import { createClient } from "@/supabase/server";
import InvitesClient from "./invites-client";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("invitations")
    .select("id, type, entity_id, sender_id, recipient_id, status, message, created_at, updated_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  return <InvitesClient initialInvites={data || []} />;
}


