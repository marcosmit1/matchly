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

    // Try to join golf tournament first
    try {
      // Check if it's a golf tournament
      const { data: golfTournament, error: golfError } = await supabase
        .from('golf_tournaments')
        .select('id, name, max_players, current_players')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (!golfError && golfTournament) {
        // Check if tournament is full
        if (golfTournament.current_players >= golfTournament.max_players) {
          return NextResponse.json(
            { error: "Tournament is full" },
            { status: 400 }
          );
        }

        // Add participant
        const { data: participant, error: participantError } = await supabase
          .from('golf_tournament_participants')
          .insert({
            tournament_id: golfTournament.id,
            user_id: user.id,
            player_name: user.email?.split('@')[0] || 'Player',
            is_guest: false,
          })
          .select()
          .single();

        if (!participantError) {
          // Update current_players count
          await supabase
            .from('golf_tournaments')
            .update({ current_players: golfTournament.current_players + 1 })
            .eq('id', golfTournament.id);

          return NextResponse.json({
            success: true,
            type: 'golf_tournament',
            data: {
              tournament_id: golfTournament.id,
              tournament_name: golfTournament.name
            },
            message: `Successfully joined golf tournament: ${golfTournament.name}`
          });
        }
      }
    } catch (golfError) {
      console.log("Golf tournament join failed, trying regular tournament:", golfError);
    }

    // Try to join regular tournament
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
