import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const id = String(form.get("id") || "");
  const action = String(form.get("action") || "");

  if (!id || (action !== "accept" && action !== "decline")) {
    return NextResponse.redirect(new URL("/social?error=invalid", req.url));
  }

  const { error } = await supabase.rpc("respond_friend_request", { req_id: id, action });
  if (error) {
    return NextResponse.redirect(new URL(`/social?error=${encodeURIComponent(error.message)}`, req.url));
  }

  return NextResponse.redirect(new URL("/social", req.url));
}
