import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = params;

    // Start league using the database function
    const { data: success, error } = await supabase.rpc("start_league", {
      p_league_id: leagueId,
    });

    if (error) {
      console.error("Error starting league:", error);
      return NextResponse.json(
        { error: error.message || "Failed to start league" },
        { status: 400 }
      );
    }

    // Get all confirmed participants
    const { data: participants, error: participantsError } = await supabase
      .from("league_participants")
      .select(`
        user_id,
        users!league_participants_user_id_fkey(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq("league_id", leagueId)
      .eq("status", "confirmed");

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    const participantCount = participants.length;

    // Calculate optimal box configuration
    const boxConfig = calculateBoxConfiguration(participantCount);
    
    // Create boxes and assign players
    const { data: boxes, error: boxesError } = await createBoxesAndAssignPlayers(
      supabase,
      leagueId,
      participants,
      boxConfig
    );

    if (boxesError) {
      console.error("Error creating boxes:", boxesError);
      return NextResponse.json(
        { error: "Failed to create boxes" },
        { status: 500 }
      );
    }

    // Generate initial matches for each box
    const { data: matches, error: matchesError } = await generateInitialMatches(
      supabase,
      leagueId,
      boxes
    );

    if (matchesError) {
      console.error("Error generating matches:", matchesError);
      return NextResponse.json(
        { error: "Failed to generate initial matches" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "League started successfully",
      league_id: leagueId,
      participants: participantCount,
      box_configuration: boxConfig,
      boxes_created: boxes.length,
      matches_generated: matches.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate optimal box configuration
function calculateBoxConfiguration(participantCount: number) {
  // Ideal box size is 5 players for optimal round-robin
  const idealBoxSize = 5;
  const minBoxSize = 4;
  const maxBoxSize = 6;

  let boxCount: number;
  let playersPerBox: number;

  if (participantCount <= 8) {
    // Small leagues: 2 boxes of 4-5 players each
    boxCount = 2;
    playersPerBox = Math.ceil(participantCount / 2);
  } else if (participantCount <= 15) {
    // Medium leagues: 3 boxes of 5 players each
    boxCount = 3;
    playersPerBox = Math.ceil(participantCount / 3);
  } else if (participantCount <= 25) {
    // Large leagues: 4-5 boxes of 5 players each
    boxCount = Math.ceil(participantCount / idealBoxSize);
    playersPerBox = Math.ceil(participantCount / boxCount);
  } else {
    // Very large leagues: 6+ boxes
    boxCount = Math.ceil(participantCount / idealBoxSize);
    playersPerBox = idealBoxSize;
  }

  // Ensure box size is within reasonable limits
  playersPerBox = Math.max(minBoxSize, Math.min(maxBoxSize, playersPerBox));

  return {
    total_players: participantCount,
    box_count: boxCount,
    players_per_box: playersPerBox,
    box_size_range: `${minBoxSize}-${maxBoxSize}`,
  };
}

// Helper function to create boxes and assign players
async function createBoxesAndAssignPlayers(
  supabase: any,
  leagueId: string,
  participants: any[],
  boxConfig: any
) {
  const { box_count, players_per_box } = boxConfig;
  
  // Shuffle participants randomly for initial assignment
  const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
  
  const boxes = [];
  
  for (let boxNumber = 1; boxNumber <= box_count; boxNumber++) {
    // Create box
    const { data: box, error: boxError } = await supabase
      .from("league_boxes")
      .insert({
        league_id: leagueId,
        box_number: boxNumber,
        box_level: boxNumber, // Higher number = higher skill level
        max_players: players_per_box,
        current_players: 0,
        status: "active",
      })
      .select()
      .single();

    if (boxError) {
      throw boxError;
    }

    // Assign players to this box
    const startIndex = (boxNumber - 1) * players_per_box;
    const endIndex = Math.min(startIndex + players_per_box, shuffledParticipants.length);
    const boxPlayers = shuffledParticipants.slice(startIndex, endIndex);

    for (const participant of boxPlayers) {
      const { error: assignmentError } = await supabase
        .from("league_box_assignments")
        .insert({
          league_id: leagueId,
          box_id: box.id,
          user_id: participant.user_id,
          assigned_at: new Date().toISOString(),
          status: "active",
        });

      if (assignmentError) {
        throw assignmentError;
      }
    }

    // Update box player count
    await supabase
      .from("league_boxes")
      .update({ current_players: boxPlayers.length })
      .eq("id", box.id);

    boxes.push({
      ...box,
      players: boxPlayers,
    });
  }

  return { data: boxes, error: null };
}

// Helper function to generate initial matches
async function generateInitialMatches(supabase: any, leagueId: string, boxes: any[]) {
  const allMatches = [];

  for (const box of boxes) {
    const players = box.players;
    
    // Generate round-robin matches for this box
    const boxMatches = generateRoundRobinMatches(players, box.id, leagueId);
    
    // Insert matches into database
    for (const match of boxMatches) {
      const { data: insertedMatch, error: matchError } = await supabase
        .from("league_matches")
        .insert(match)
        .select()
        .single();

      if (matchError) {
        throw matchError;
      }

      allMatches.push(insertedMatch);
    }
  }

  return { data: allMatches, error: null };
}

// Helper function to generate round-robin matches
function generateRoundRobinMatches(players: any[], boxId: string, leagueId: string) {
  const matches = [];
  const playerIds = players.map(p => p.user_id);
  
  // Generate all possible pairings
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        league_id: leagueId,
        box_id: boxId,
        player1_id: playerIds[i],
        player2_id: playerIds[j],
        status: "scheduled",
        match_type: "round_robin",
        created_at: new Date().toISOString(),
      });
    }
  }
  
  return matches;
}
