import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@/supabase/service";
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

    // Get all participants first
    const { data: participants, error } = await supabase
      .from("league_participants")
      .select("id, user_id, guest_player_id, status, joined_at")
      .eq("league_id", leagueId);

    if (error) {
      console.error("Error fetching participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    // Get user and guest player details separately
    const userIds = participants?.filter(p => p.user_id).map(p => p.user_id) || [];
    const guestPlayerIds = participants?.filter(p => p.guest_player_id).map(p => p.guest_player_id) || [];

    // Fetch user details using service client to bypass RLS
    const serviceSupabase = await createServiceClient();
    const { data: users } = userIds.length > 0
      ? await serviceSupabase.from("users").select("id, username, email").in("id", userIds)
      : { data: [] };

    // Fetch guest player details
    const { data: guestPlayers } = guestPlayerIds.length > 0
      ? await supabase.from("guest_players").select("id, name, email, phone").in("id", guestPlayerIds)
      : { data: [] };

    // Create lookup maps
    const userMap = new Map(users?.map(u => [u.id, u]) || []);
    const guestMap = new Map(guestPlayers?.map(g => [g.id, g]) || []);

    // Format participants data
    const formattedParticipants = participants?.map(participant => {
      const user = participant.user_id ? userMap.get(participant.user_id) : null;
      const guest = participant.guest_player_id ? guestMap.get(participant.guest_player_id) : null;

      return {
        participant_id: participant.id,
        user_id: participant.user_id,
        guest_player_id: participant.guest_player_id,
        name: user
          ? ((user.username || user.email)?.charAt(0).toUpperCase() + (user.username || user.email)?.slice(1))
          : (guest?.name?.charAt(0).toUpperCase() + guest?.name?.slice(1)) || "Unknown",
        email: user?.email || guest?.email || null,
        phone: guest?.phone || null,
        status: participant.status,
        is_guest: !!participant.guest_player_id,
        joined_at: participant.joined_at
      };
    }) || [];

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
    const { name } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Add guest player using database function (name only, like tournaments)
    const { data, error } = await supabase.rpc("add_guest_player_to_league", {
      p_league_id: leagueId,
      p_name: name.trim(),
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
