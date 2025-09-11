import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = (body.username ?? "").trim();

  // Validate username format
  if (!username || !/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return NextResponse.json({ 
      available: false, 
      error: "Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens" 
    }, { status: 400 });
  }

  // Check if username is already taken by another user
  const { data: existingUser, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .neq("id", user.id) // Exclude current user
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const available = !existingUser;
  
  return NextResponse.json({ available });
}
