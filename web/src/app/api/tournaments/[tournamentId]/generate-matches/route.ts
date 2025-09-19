import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = await params;

    // Verify the user has permission to generate matches
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("created_by, status")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to generate matches" }, { status: 403 });
    }

    if (tournament.status !== 'started') {
      return NextResponse.json({ error: "Tournament must be started to generate matches" }, { status: 400 });
    }

    // Get the current round number
    const { data: rounds, error: roundsError } = await supabase
      .from("tournament_rounds")
      .select("round_number")
      .eq("tournament_id", tournamentId)
      .order("round_number", { ascending: false })
      .limit(1);

    if (roundsError) {
      return NextResponse.json({ error: "Failed to get tournament rounds" }, { status: 500 });
    }

    const currentRound = rounds && rounds.length > 0 ? rounds[0].round_number : 1;

    // Check if matches already exist for this round
    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from("tournament_matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round_id", rounds && rounds.length > 0 ? rounds[0].id : null);

    if (existingMatchesError) {
      return NextResponse.json({ error: "Failed to check existing matches" }, { status: 500 });
    }

    if (existingMatches && existingMatches.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Matches already exist for round ${currentRound}. ${existingMatches.length} matches found.`,
        existingMatches: existingMatches.length
      }, { status: 400 });
    }

    // Call the generate_round_matches function
    const { data, error } = await supabase.rpc('generate_round_matches', {
      p_tournament_id: tournamentId,
      p_round_number: currentRound
    });

    if (error) {
      console.error("Error generating matches:", error);
      return NextResponse.json(
        { error: error.message || "Failed to generate matches" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Matches generated successfully for round ${currentRound}`
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/generate-matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
