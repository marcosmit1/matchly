import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, team_name, players } = body || {};
    if (!token || !team_name) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const { data, error } = await supabase.rpc("join_tournament", {
      p_token: token,
      p_team_name: team_name,
      p_players: Array.isArray(players) ? players : [],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ team_id: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


