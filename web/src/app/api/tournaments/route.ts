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
    const {
      name,
      description,
      sport = "padel",
      maxPlayers = 8,
      startDate,
      location,
      numberOfCourts = 2,
      tournamentType = "mexicano",
      pointsToWin = 21,
      players = [],
    } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tournament name is required" },
        { status: 400 }
      );
    }

    // Allow creating tournaments with just the creator initially
    // Minimum players will be enforced when starting the tournament

    if (players.length > maxPlayers) {
      return NextResponse.json(
        { error: `Too many players. Maximum is ${maxPlayers}` },
        { status: 400 }
      );
    }

    // Create tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        sport,
        max_players: maxPlayers,
        current_players: players.length,
        start_date: startDate,
        location: location?.trim() || null,
        number_of_courts: numberOfCourts,
        tournament_type: tournamentType,
        points_to_win: pointsToWin,
        status: "open",
        created_by: user.id,
      })
      .select()
      .single();

    if (tournamentError) {
      console.error("Error creating tournament:", tournamentError);
      return NextResponse.json(
        { error: "Failed to create tournament" },
        { status: 500 }
      );
    }

    // Add players to tournament
    const playerInserts = players.map((player: any) => ({
      tournament_id: tournament.id,
      name: player.name,
      email: player.email || null,
      phone: player.phone || null,
      created_by: user.id,
    }));

    const { error: playersError } = await supabase
      .from("tournament_players")
      .insert(playerInserts);

    if (playersError) {
      console.error("Error adding players:", playersError);
      // Rollback tournament creation
      await supabase.from("tournaments").delete().eq("id", tournament.id);
      return NextResponse.json(
        { error: "Failed to add players to tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament,
      message: "Tournament created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    let query = supabase
      .from("tournaments")
      .select("*");

    if (isPublic) {
      // Get all public tournaments (open status)
      query = query.eq("status", "open");
    } else {
      // Get tournaments created by user or where user is a participant
      query = query.or(`created_by.eq.${user.id},id.in.(
        SELECT tournament_id FROM tournament_players WHERE created_by = '${user.id}'
      )`);
    }

    const { data: tournaments, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error);
      return NextResponse.json(
        { error: "Failed to fetch tournaments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tournaments,
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
