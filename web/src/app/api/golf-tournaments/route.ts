import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🏌️ Starting GET /api/golf-tournaments");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("👤 User:", user?.id);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";
    console.log("🌍 Is Public Request:", isPublic);

    console.log("🔍 Building query...");
    
    let query = supabase
      .from("golf_tournaments")
      .select(`
        *,
        golf_tournament_participants (*)
      `);

    // Log the base query
    console.log("📝 Base query built");

    if (isPublic) {
      // Get all public tournaments (setup or active status)
      query = query.in("status", ["setup", "active"]);
      console.log("🎯 Added public filter: showing setup and active tournaments");
    } else {
      // Get tournaments created by user or where user is a participant
      query = query.or(`created_by.eq.${user.id},id.in.(select tournament_id from golf_tournament_participants where user_id = '${user.id}')`);
      console.log("🎯 Added user filter for:", user.id);
    }

    console.log("⏳ Executing query...");
    const { data: tournaments, error } = await query.order("created_at", { ascending: false });
    
    // Log raw response
    console.log("📦 Raw tournaments data:", tournaments);
    console.log("❌ Query error (if any):", error);

    if (error) {
      console.error("Error fetching golf tournaments:", error);
      return NextResponse.json(
        { error: "Failed to fetch golf tournaments" },
        { status: 500 }
      );
    }

    console.log("🔄 Starting data transformation...");
    
    // Transform the data to match the expected format
    const transformedTournaments = tournaments?.map(tournament => {
      console.log("🎯 Transforming tournament:", tournament.id, tournament.name);
      
      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        sport: "golf",
        max_players: tournament.max_players,
        current_players: tournament.current_players,
        start_date: tournament.start_date,
        location: tournament.location || tournament.course_name,
        status: tournament.status,
        created_by: tournament.created_by,
        created_at: tournament.created_at,
        tournament_type: tournament.format || "stroke play",
        number_of_courts: tournament.holes_count,
        points_to_win: tournament.course_par,
        users: {
          username: "Golf Tournament" // We'll need to fetch this separately if needed
        }
      };
    }) || [];

    console.log("✅ Transformation complete. Tournament count:", transformedTournaments.length);
    console.log("📦 First transformed tournament (if any):", 
      transformedTournaments[0] ? {
        id: transformedTournaments[0].id,
        name: transformedTournaments[0].name,
        status: transformedTournaments[0].status
      } : "No tournaments found"
    );

    return NextResponse.json({
      success: true,
      tournaments: transformedTournaments,
    });
  } catch (error) {
    console.error("Error in GET /api/golf-tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏌️ Starting POST /api/golf-tournaments");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("👤 User:", user?.id);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📦 Request body:", body);

    // Validate required fields
    if (!body.name || !body.course_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique 5-digit invite code
    const { data: inviteCodeData, error: inviteCodeError } = await supabase
      .rpc('generate_unique_invite_code');
    
    if (inviteCodeError) {
      console.error("Error generating invite code:", inviteCodeError);
      return NextResponse.json(
        { error: "Failed to generate invite code" },
        { status: 500 }
      );
    }

    const inviteCode = inviteCodeData;

    // Create the golf tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("golf_tournaments")
      .insert({
        name: body.name,
        description: body.description,
        course_name: body.course_name,
        location: body.location,
        max_players: body.max_players || 8,
        current_players: 1, // Creator is first player
        start_date: body.start_date,
        holes_count: 18,
        course_par: 72,
        format: "stroke_play",
        status: "setup",
        created_by: user.id,
        handicap_enabled: false,
        side_bets_enabled: true,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (tournamentError) {
      console.error("Error creating golf tournament:", tournamentError);
      return NextResponse.json(
        { error: "Failed to create golf tournament" },
        { status: 500 }
      );
    }

    console.log("✅ Tournament created:", tournament.id);

    interface HoleData {
      hole_number: number;
      par: number;
      handicap: number;
    }

    // Create holes
    const holes = body.holes || Array(18).fill(null).map((_, i) => ({
      hole_number: i + 1,
      par: 4,
      handicap: i + 1
    }));

    const { error: holesError } = await supabase
      .from("golf_holes")
      .insert(
        holes.map((hole: HoleData) => ({
          tournament_id: tournament.id,
          hole_number: hole.hole_number,
          par: hole.par,
          handicap: hole.handicap
        }))
      );

    if (holesError) {
      console.error("Error creating holes:", holesError);
      return NextResponse.json(
        { error: "Failed to create holes" },
        { status: 500 }
      );
    }

    console.log("✅ Holes created");

    // Add creator as first participant
    const { error: participantError } = await supabase
      .from("golf_tournament_participants")
      .insert({
        tournament_id: tournament.id,
        user_id: user.id,
        player_name: user.email?.split("@")[0] || "Player 1",
        is_guest: false,
      });

    if (participantError) {
      console.error("Error adding creator as participant:", participantError);
      return NextResponse.json(
        { error: "Failed to add creator as participant" },
        { status: 500 }
      );
    }

    console.log("✅ Creator added as participant");

    return NextResponse.json({
      success: true,
      tournament: tournament,
    });
  } catch (error) {
    console.error("Error in POST /api/golf-tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}