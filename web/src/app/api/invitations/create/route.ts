import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { sendMagicBellNotifications } from "@/lib/magicbell";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, entity_id, recipients, message } = body || {};
  if (!type || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rows = recipients.map((rid: string) => ({
    type,
    entity_id: entity_id || null,
    sender_id: user.id,
    recipient_id: rid,
    message: message || null,
  }));

  const { data, error } = await supabase.from("invitations").insert(rows).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Fetch recipient emails for MagicBell
  const { data: users } = await supabase.from("users").select("id, email").in("id", recipients);
  const to = (users || []).map((u: any) => ({ email: u.email }));
  try {
    await sendMagicBellNotifications(to, type === "game" ? "Game Invite" : "Tournament Invite", message || "You have a new invitation", type);
  } catch (e) {
    console.error("MagicBell send failed", e);
  }
  return NextResponse.json({ data }, { status: 200 });
}


