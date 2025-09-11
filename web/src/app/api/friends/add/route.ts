import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const identifier = String(formData.get("identifier") || "").trim();
    if (!identifier) return NextResponse.json({ error: "Username or email is required" }, { status: 400 });

    // Create a pending friend request via SECURITY DEFINER RPC (supports both username and email)
    const { error: rpcErr } = await supabase.rpc("create_friend_request_by_username_or_email", { target_identifier: identifier });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
