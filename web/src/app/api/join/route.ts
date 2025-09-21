import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // Try to join tournament first
    try {
      const { data: tournamentResult, error: tournamentError } = await supabase
        .rpc('join_tournament_with_code', { 
          p_invite_code: inviteCode.trim(),
          p_user_id: user.id 
        });

      if (!tournamentError && tournamentResult) {
        return NextResponse.json({
          success: true,
          type: 'tournament',
          data: tournamentResult,
          message: `Successfully joined tournament: ${tournamentResult.tournament_name}`
        });
      }
    } catch (tournamentError) {
      // Tournament join failed, try league
      console.log("Tournament join failed, trying league:", tournamentError);
    }

    // Try to join league
    try {
      const { data: leagueResult, error: leagueError } = await supabase
        .rpc('join_league_with_code', { 
          p_invite_code: inviteCode.trim(),
          p_user_id: user.id 
        });

      if (!leagueError && leagueResult) {
        return NextResponse.json({
          success: true,
          type: 'league',
          data: leagueResult,
          message: `Successfully joined league: ${leagueResult.league_name}`
        });
      }

      // If league join also failed, return the error
      if (leagueError) {
        return NextResponse.json(
          { error: leagueError.message || "Invalid invite code" },
          { status: 400 }
        );
      }
    } catch (leagueError) {
      console.error("League join error:", leagueError);
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in POST /api/join:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
