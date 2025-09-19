import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch all guest players for a league
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

    // Get all participants including guests
    const { data: participants, error } = await supabase
      .from("league_participants")
      .select(`
        id,
        user_id,
        guest_player_id,
        status,
        joined_at,
        users!league_participants_user_id_fkey(
          id,
          email,
          raw_user_meta_data
        ),
        guest_players!league_participants_guest_player_id_fkey(
          id,
          name,
          email,
          phone
        )
      `)
      .eq("league_id", leagueId)
      .eq("status", "confirmed");

    if (error) {
      console.error("Error fetching participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    // Format participants data
    const formattedParticipants = participants?.map(participant => ({
      participant_id: participant.id,
      user_id: participant.user_id,
      guest_player_id: participant.guest_player_id,
      name: participant.user_id 
        ? ((participant.users as any)?.raw_user_meta_data?.username || (participant.users as any)?.email)
        : participant.guest_players?.name,
      email: participant.user_id 
        ? (participant.users as any)?.email
        : participant.guest_players?.email,
      phone: participant.guest_players?.phone,
      status: participant.status,
      is_guest: !!participant.guest_player_id,
      joined_at: participant.joined_at
    })) || [];

    return NextResponse.json({
      success: true,
      participants: formattedParticipants,
    });
  } catch (error) {
    console.error("Error in GET /api/leagues/[leagueId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a guest player to a league
export async function POST(
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
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Add guest player using database function
    const { data, error } = await supabase.rpc("add_guest_player_to_league", {
      p_league_id: leagueId,
      p_name: name.trim(),
      p_email: email?.trim() || null,
      p_phone: phone?.trim() || null,
    });

    if (error) {
      console.error("Error adding guest player:", error);
      return NextResponse.json(
        { error: error.message || "Failed to add guest player" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Guest player added successfully",
      guest_player_id: data.guest_player_id,
    });
  } catch (error) {
    console.error("Error in POST /api/leagues/[leagueId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a guest player from a league
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const guestPlayerId = searchParams.get("guestPlayerId");

    if (!guestPlayerId) {
      return NextResponse.json(
        { error: "Guest player ID is required" },
        { status: 400 }
      );
    }

    // Remove guest player using database function
    const { data, error } = await supabase.rpc("remove_guest_player_from_league", {
      p_guest_player_id: guestPlayerId,
    });

    if (error) {
      console.error("Error removing guest player:", error);
      return NextResponse.json(
        { error: error.message || "Failed to remove guest player" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Guest player removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/leagues/[leagueId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
