import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, action } = body || {};
  if (!id || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const status = action === "accept" ? "accepted" : "declined";
  const { error } = await supabase.from("invitations").update({ status }).eq("id", id).eq("recipient_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 200 });
}


