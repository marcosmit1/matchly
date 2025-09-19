import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string; matchId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId, matchId } = params;
    const body = await request.json();
    const { player1_score, player2_score, player3_score, player4_score } = body;

    console.log('Score update request:', {
      tournamentId,
      matchId,
      scores: { player1_score, player2_score, player3_score, player4_score },
      userId: user.id
    });

    // Verify the user has permission to update this match
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("created_by")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to update this match" }, { status: 403 });
    }

    // Update the match scores
    const { data, error } = await supabase
      .from("tournament_matches")
      .update({
        player1_score,
        player2_score,
        player3_score,
        player4_score,
        status: 'completed'
      })
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating match scores:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: "Failed to update match scores", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      match: data,
      message: "Scores updated successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/matches/[matchId]/scores:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
