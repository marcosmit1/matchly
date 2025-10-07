import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode || inviteCode.length !== 5) {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid invite code format" 
      });
    }

    const supabase = await createClient();

    // Check if invite code exists in tournaments
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, name, status, max_players, current_players")
      .eq("invite_code", inviteCode)
      .single();

    if (tournament && !tournamentError) {
      return NextResponse.json({
        valid: true,
        type: "tournament",
        data: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status,
          max_players: tournament.max_players,
          current_players: tournament.current_players,
          is_full: tournament.current_players >= tournament.max_players
        }
      });
    }

    // Check if invite code exists in golf tournaments
    const { data: golfTournament, error: golfTournamentError } = await supabase
      .from("golf_tournaments")
      .select("id, name, status, max_players, current_players")
      .eq("invite_code", inviteCode)
      .single();

    if (golfTournament && !golfTournamentError) {
      return NextResponse.json({
        valid: true,
        type: "golf_tournament",
        data: {
          id: golfTournament.id,
          name: golfTournament.name,
          status: golfTournament.status,
          max_players: golfTournament.max_players,
          current_players: golfTournament.current_players,
          is_full: golfTournament.current_players >= golfTournament.max_players
        }
      });
    }

    // Check if invite code exists in leagues
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("id, name, status, max_players, current_players")
      .eq("invite_code", inviteCode)
      .single();

    if (league && !leagueError) {
      return NextResponse.json({
        valid: true,
        type: "league",
        data: {
          id: league.id,
          name: league.name,
          status: league.status,
          max_players: league.max_players,
          current_players: league.current_players,
          is_full: league.current_players >= league.max_players
        }
      });
    }

    // Invite code not found
    return NextResponse.json({ 
      valid: false, 
      error: "Invalid invite code" 
    });

  } catch (error) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}
