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
      sport = "squash",
      max_players = 8,
      start_date,
      location,
      entry_fee = 0,
      prize_pool = 0,
      // Box configuration parameters
      number_of_boxes = null,
      min_players_per_box = null,
      max_players_per_box = null,
    } = body;

    // Validate required fields
    if (!name || !sport) {
      return NextResponse.json(
        { error: "Name and sport are required" },
        { status: 400 }
      );
    }

    // Validate max_players
    if (max_players < 4 || max_players > 32) {
      return NextResponse.json(
        { error: "Max players must be between 4 and 32" },
        { status: 400 }
      );
    }

    // Create league using the database function
    const { data, error } = await supabase.rpc("create_league", {
      p_name: name,
      p_description: description,
      p_sport: sport,
      p_max_players: max_players,
      p_start_date: start_date,
      p_location: location,
      p_entry_fee: entry_fee,
      p_prize_pool: prize_pool,
      // Box configuration parameters
      p_number_of_boxes: number_of_boxes,
      p_min_players_per_box: min_players_per_box,
      p_max_players_per_box: max_players_per_box,
    });

    if (error) {
      console.error("Error creating league:", error);
      return NextResponse.json(
        { error: "Failed to create league" },
        { status: 500 }
      );
    }

    // Get the created league details
    // data is a JSON object with {id, invite_code, invite_link}
    const leagueId = data.id;
    
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      console.error("Error fetching league:", leagueError);
      return NextResponse.json(
        { error: "Failed to fetch league details" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "League created successfully",
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        sport: league.sport,
        max_players: league.max_players,
        current_players: league.current_players,
        start_date: league.start_date,
        location: league.location,
        entry_fee: league.entry_fee,
        prize_pool: league.prize_pool,
        status: league.status,
        invite_code: league.invite_code,
        invite_link: league.invite_link,
        created_at: league.created_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
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
    const status = searchParams.get("status");
    const sport = searchParams.get("sport");
    const publicOnly = searchParams.get("public") === "true";

    // Get leagues with user participation info and creator details
    let query = supabase
      .from("leagues")
      .select(`
        *,
        league_participants!left (
          user_id,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (sport) {
      query = query.eq("sport", sport);
    }

    // If public only, filter to open leagues
    if (publicOnly) {
      query = query.eq("status", "open");
    }

    const { data: leagues, error } = await query;

    if (error) {
      console.error("Error fetching leagues:", error);
      return NextResponse.json(
        { error: "Failed to fetch leagues" },
        { status: 500 }
      );
    }


    // Get unique creator IDs
    const creatorIds = [...new Set(leagues?.map(league => league.created_by) || [])];
    
    // Fetch creator usernames separately
    const { data: creators, error: creatorsError } = await supabase
      .from("users")
      .select("id, username")
      .in("id", creatorIds);


    // Create a map of creator_id to username
    const creatorMap = new Map(creators?.map(creator => [creator.id, creator.username]) || []);

    // Process leagues to add user relationship info
    const processedLeagues = leagues.map(league => {
      const isCreator = league.created_by === user.id;
      const isParticipant = league.league_participants?.some(
        (participant: any) => participant.user_id === user.id && participant.status === 'confirmed'
      ) || false;

      const processedLeague = {
        ...league,
        is_creator: isCreator,
        is_participant: isParticipant,
        users: { username: creatorMap.get(league.created_by) || 'Unknown User' },
        league_participants: undefined // Remove the raw data
      };

      return processedLeague;
    });

    // If not public only, filter to only show leagues user is involved in
    const filteredLeagues = publicOnly 
      ? processedLeagues 
      : processedLeagues.filter(league => league.is_creator || league.is_participant);

    return NextResponse.json({ leagues: filteredLeagues });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
