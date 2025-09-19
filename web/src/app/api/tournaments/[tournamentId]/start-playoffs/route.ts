import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

    // Verify the user has permission to start playoffs
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("created_by, status")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to start playoffs" }, { status: 403 });
    }

    if (tournament.status !== 'started') {
      return NextResponse.json({ error: "Tournament must be started to begin playoffs" }, { status: 400 });
    }

    // Call the start_playoffs function
    const { data, error } = await supabase.rpc('start_playoffs', {
      p_tournament_id: tournamentId
    });

    if (error) {
      console.error("Error starting playoffs:", error);
      return NextResponse.json(
        { error: error.message || "Failed to start playoffs" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: data.message || "Playoffs started successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/start-playoffs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
