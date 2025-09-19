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

    // Verify the user has permission to advance rounds
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("created_by, status")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to advance rounds" }, { status: 403 });
    }

    if (tournament.status !== 'started') {
      return NextResponse.json({ error: "Tournament must be started to advance rounds" }, { status: 400 });
    }

    // Call the advance_tournament_round function
    const { data, error } = await supabase.rpc('advance_tournament_round', {
      p_tournament_id: tournamentId
    });

    if (error) {
      console.error("Error advancing tournament round:", error);
      return NextResponse.json(
        { error: error.message || "Failed to advance round" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: data.message || "Round advanced successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/advance-round:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { searchParams } = new URL(request.url);
    const roundNumber = parseInt(searchParams.get("round") || "1");

    // Call the check_round_completion function
    const { data, error } = await supabase.rpc('check_round_completion', {
      p_tournament_id: tournamentId,
      p_round_number: roundNumber
    });

    if (error) {
      console.error("Error checking round completion:", error);
      return NextResponse.json(
        { error: error.message || "Failed to check round completion" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/advance-round:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
