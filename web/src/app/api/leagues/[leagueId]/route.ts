import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = await params;
    
    
    // Validate leagueId
    if (!leagueId || typeof leagueId !== 'string') {
      console.error("Invalid leagueId:", leagueId);
      return NextResponse.json(
        { error: "Invalid league ID" },
        { status: 400 }
      );
    }

    // Get league details with participant info
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select(`
        *,
        league_participants!left (
          user_id,
          status
        )
      `)
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      console.error("Error fetching league:", leagueError);
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Check user permissions
    const isCreator = league.created_by === user.id;
    const isParticipant = league.league_participants?.some(
      (participant: any) => participant.user_id === user.id && participant.status === 'confirmed'
    ) || false;

    // Return league with permission info
    const leagueWithPermissions = {
      ...league,
      is_creator: isCreator,
      is_participant: isParticipant,
      league_participants: undefined // Remove raw data
    };

    return NextResponse.json({
      league: leagueWithPermissions,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
