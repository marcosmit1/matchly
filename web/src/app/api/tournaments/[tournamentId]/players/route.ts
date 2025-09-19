import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = params;

    // Get tournament players
    const { data: players, error } = await supabase
      .from("tournament_players")
      .select(`
        id,
        name,
        email,
        phone,
        created_at
      `)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching tournament players:", error);
      return NextResponse.json(
        { error: "Failed to fetch players" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      players: players || [],
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
