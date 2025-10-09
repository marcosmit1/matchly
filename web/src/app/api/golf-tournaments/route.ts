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
    
    const query = supabase
      .from("golf_tournaments")
      .select(`
        *,
        golf_tournament_participants (*),
        golf_scores (
          hole_number,
          participant_id
        )
      `);

    // Log the base query
    console.log("📝 Base query built");

    console.log("⏳ Executing queries...");
    let tournaments: any[] = [];
    let error;

    if (isPublic) {
      // Get all public tournaments (setup or active status)
      const { data, error: queryError } = await query
        .in("status", ["setup", "active"])
        .order("created_at", { ascending: false });
      
      tournaments = data || [];
      error = queryError;
      console.log("🎯 Fetched public tournaments");
    } else {
      // Get tournaments created by user
      const { data: createdTournaments, error: createdError } = await query
        .eq("created_by", user.id);

      // Get tournaments where user is a participant
      const { data: participatingTournaments, error: participatingError } = await supabase
        .from("golf_tournament_participants")
        .select(`
          tournament:tournament_id (
            *,
            golf_tournament_participants (*),
            golf_scores (
              hole_number,
              participant_id
            )
          )
        `)
        .eq("user_id", user.id);

      if (createdError || participatingError) {
        error = createdError || participatingError;
      } else {
        // Extract tournaments from participating data and combine with created tournaments
        const participatingTournamentsData = participatingTournaments
          ?.map(p => p.tournament)
          .filter(t => t !== null) || [];

        // Combine and deduplicate tournaments
        const tournamentMap = new Map();
        [...(createdTournaments || []), ...participatingTournamentsData].forEach(t => {
          if (!tournamentMap.has(t.id)) {
            tournamentMap.set(t.id, t);
          }
        });
        
        // Sort by created_at after combining
        tournaments = Array.from(tournamentMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      console.log("🎯 Fetched user's tournaments:", tournaments.length);
    }
    
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
      
      // Find the current user's participant record
      const userParticipant = tournament.golf_tournament_participants?.find(
        (p: any) => p.user_id === user.id
      );
      
      const baseData = {
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
          username: "Golf Tournament"
        }
      };

      // If this is a participant request, add participant info
      const { searchParams } = new URL(request.url);
      if (searchParams.get("participant") === "true" && userParticipant) {
        // Calculate holes completed for this participant
        const holesCompleted = tournament.golf_scores?.filter(
          (score: any) => score.participant_id === userParticipant.id
        ).length || 0;

        return {
          ...baseData,
          course_name: tournament.course_name,
          participant_id: userParticipant.id,
          fourball_number: userParticipant.fourball_number || 1,
          holes_completed: holesCompleted,
          total_holes: tournament.holes_count || 18
        };
      }

      return baseData;
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
        // Store course and tee box selection directly
        selected_tee_box: body.tee_box_name || null,
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

    // Check if holes already exist (in case of retry/duplicate request)
    const { data: existingHoles } = await supabase
      .from("golf_holes")
      .select("hole_number")
      .eq("tournament_id", tournament.id)
      .limit(1);

    if (!existingHoles || existingHoles.length === 0) {
      // Only insert if holes don't exist yet
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
    } else {
      console.log("⚠️ Holes already exist for this tournament, skipping insertion");
    }

    console.log("✅ Holes created");

    // Update cached course holes if any handicaps were filled in by the user
    if (body.course_id && body.tee_box_name) {
      try {
        // First, find the cached course by api_course_id
        const { data: cachedCourse } = await supabase
          .from("golf_courses")
          .select("id")
          .eq("api_course_id", body.course_id)
          .single();

        if (cachedCourse) {
          // Update tournament with cached_course_id
          await supabase
            .from("golf_tournaments")
            .update({ cached_course_id: cachedCourse.id })
            .eq("id", tournament.id);
          // Check if we have handicaps that should be updated in the cache
          const holesToUpdate = holes.filter((hole: HoleData) => hole.handicap);

          if (holesToUpdate.length > 0) {
            console.log(`💾 Updating ${holesToUpdate.length} hole handicaps in course cache...`);

            for (const hole of holesToUpdate) {
              // Update or insert handicap in cached course holes
              const { error: updateError } = await supabase
                .from("golf_course_holes")
                .upsert({
                  course_id: cachedCourse.id,
                  tee_box_name: body.tee_box_name,
                  hole_number: hole.hole_number,
                  par: hole.par,
                  handicap: hole.handicap,
                  yardage: null, // We don't have yardage from tournament form
                  meters: null,
                }, {
                  onConflict: 'course_id,tee_box_name,hole_number',
                  ignoreDuplicates: false
                });

              if (updateError) {
                console.error(`Error updating hole ${hole.hole_number} cache:`, updateError);
              }
            }

            console.log("✅ Course cache updated with user-provided handicaps");
          }
        }
      } catch (error) {
        console.error("Error updating course cache:", error);
        // Don't fail tournament creation if cache update fails
      }
    }

    // Persist a reference to cached course for downstream lookups (best-effort)
    if (body.course_id) {
      try {
        const { data: cached } = await supabase
          .from('golf_courses')
          .select('id')
          .eq('api_course_id', body.course_id)
          .maybeSingle();
        if (cached?.id) {
          await supabase
            .from('golf_tournaments')
            .update({ cached_course_id: cached.id })
            .eq('id', tournament.id);
        }
      } catch {}
    }

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