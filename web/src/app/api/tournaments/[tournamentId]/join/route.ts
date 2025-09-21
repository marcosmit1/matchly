import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if tournament exists and is open
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (tournament.status !== "open") {
      return NextResponse.json(
        { error: "Tournament is not accepting new players" },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("created_by", user.id)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: "You are already a participant in this tournament" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament.current_players >= tournament.max_players) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Get user profile for display name
    const { data: userProfile } = await supabase
      .from("users")
      .select("username, first_name, last_name, email")
      .eq("id", user.id)
      .single();

    const displayName = userProfile?.username || 
                       (userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : null) ||
                       userProfile?.email?.split('@')[0] || 
                       "Player";

    // Add user as tournament participant
    const { error: joinError } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: tournamentId,
        name: displayName,
        email: user.email,
        created_by: user.id,
      });

    if (joinError) {
      console.error("Error joining tournament:", joinError);
      return NextResponse.json(
        { error: "Failed to join tournament" },
        { status: 500 }
      );
    }

    // Update tournament current_players count
    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ current_players: tournament.current_players + 1 })
      .eq("id", tournamentId);

    if (updateError) {
      console.error("Error updating tournament player count:", updateError);
      // Don't fail the join operation if count update fails
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined tournament",
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/join:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
