import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET: Fetch guest players for a tournament
export async function GET(
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

    // Fetch tournament participants including guest players
    const { data: participants, error } = await supabase
      .from("tournament_players")
      .select(`
        *,
        users:user_id (
          id,
          email,
          user_metadata
        ),
        guest_players:guest_player_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("tournament_id", tournamentId);

    if (error) {
      console.error("Error fetching tournament participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    // Transform the data to include guest player info
    const transformedParticipants = participants.map((participant) => ({
      id: participant.id,
      tournament_id: participant.tournament_id,
      user_id: participant.user_id,
      guest_player_id: participant.guest_player_id,
      status: participant.status,
      created_at: participant.created_at,
      is_guest: !!participant.guest_player_id,
      name: participant.guest_player_id 
        ? (participant.guest_players as any)?.name 
        : (participant.users as any)?.user_metadata?.username || (participant.users as any)?.email,
      email: participant.guest_player_id 
        ? (participant.guest_players as any)?.email 
        : (participant.users as any)?.email,
      phone: participant.guest_player_id 
        ? (participant.guest_players as any)?.phone 
        : null,
    }));

    return NextResponse.json({
      success: true,
      participants: transformedParticipants,
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add a guest player to a tournament
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
    const { data, error } = await supabase.rpc("add_guest_player_to_tournament", {
      p_tournament_id: tournamentId,
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
    console.error("Error in POST /api/tournaments/[tournamentId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a guest player from a tournament
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const guestPlayerId = searchParams.get("guestPlayerId");

    if (!guestPlayerId) {
      return NextResponse.json(
        { error: "Guest player ID is required" },
        { status: 400 }
      );
    }

    // Remove guest player using database function
    const { data, error } = await supabase.rpc("remove_guest_player_from_tournament", {
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
    console.error("Error in DELETE /api/tournaments/[tournamentId]/guest-players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
