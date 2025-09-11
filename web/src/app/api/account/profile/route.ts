import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = (body.username ?? "").trim() || null;



  // Validate username format if provided
  if (username && !/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return NextResponse.json({ 
      error: "Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens" 
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ username })
    .eq("id", user.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
