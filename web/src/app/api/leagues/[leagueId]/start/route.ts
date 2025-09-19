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

    // Get all confirmed participants (including guests)
    const { data: participants, error: participantsError } = await supabase
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

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
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
        ? (participant.users?.raw_user_meta_data?.username || participant.users?.email)
        : participant.guest_players?.name,
      email: participant.user_id 
        ? participant.users?.email 
        : participant.guest_players?.email,
      phone: participant.guest_players?.phone,
      status: participant.status,
      is_guest: !!participant.guest_player_id,
      joined_at: participant.joined_at
    })) || [];

    const participantCount = formattedParticipants.length;

    // Get league details to check for custom box configuration
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("number_of_boxes, min_players_per_box, max_players_per_box")
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      console.error("Error fetching league:", leagueError);
      return NextResponse.json(
        { error: "Failed to fetch league details" },
        { status: 500 }
      );
    }

    // Calculate optimal box configuration using flexible logic
    const boxConfig = calculateFlexibleBoxConfiguration(
      participantCount,
      league.number_of_boxes,
      league.min_players_per_box,
      league.max_players_per_box
    );
    
    // Create boxes and assign players
    const { data: boxes, error: boxesError } = await createBoxesAndAssignPlayers(
      supabase,
      leagueId,
      formattedParticipants,
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

// Helper function to calculate flexible box configuration
function calculateFlexibleBoxConfiguration(
  playerCount: number, 
  numberOfBoxes?: number | null, 
  minPlayersPerBox?: number | null, 
  maxPlayersPerBox?: number | null
): {
  total_players: number;
  box_count: number;
  players_per_box: number;
  box_size_range: string;
  boxSizes: number[];
} {
  // If specific number of boxes is provided, use that
  if (numberOfBoxes) {
    return calculateCustomBoxConfiguration(playerCount, numberOfBoxes);
  }
  
  // If min/max players per box is provided, calculate optimal box count
  if (minPlayersPerBox || maxPlayersPerBox) {
    return calculateOptimalBoxConfiguration(playerCount, minPlayersPerBox, maxPlayersPerBox);
  }
  
  // Default to automatic calculation
  const config = calculateBoxConfiguration(playerCount);
  return {
    ...config,
    boxSizes: generateBoxSizes(config.box_count, config.players_per_box, 0)
  };
}

// Helper function to calculate custom box configuration
function calculateCustomBoxConfiguration(playerCount: number, numberOfBoxes: number): {
  total_players: number;
  box_count: number;
  players_per_box: number;
  box_size_range: string;
  boxSizes: number[];
} {
  if (numberOfBoxes <= 0) {
    throw new Error('Number of boxes must be greater than 0');
  }
  
  if (numberOfBoxes > playerCount) {
    throw new Error('Number of boxes cannot be greater than number of players');
  }
  
  const playersPerBox = Math.floor(playerCount / numberOfBoxes);
  const remainder = playerCount % numberOfBoxes;
  const boxSizes = generateBoxSizes(numberOfBoxes, playersPerBox, remainder);
  
  return {
    total_players: playerCount,
    box_count: numberOfBoxes,
    players_per_box: playersPerBox,
    box_size_range: `${Math.min(...boxSizes)}-${Math.max(...boxSizes)}`,
    boxSizes
  };
}

// Helper function to calculate optimal box configuration based on min/max players per box
function calculateOptimalBoxConfiguration(
  playerCount: number, 
  minPlayersPerBox?: number | null, 
  maxPlayersPerBox?: number | null
): {
  total_players: number;
  box_count: number;
  players_per_box: number;
  box_size_range: string;
  boxSizes: number[];
} {
  const minPlayers = minPlayersPerBox || 2;
  const maxPlayers = maxPlayersPerBox || 8;
  
  if (minPlayers > maxPlayers) {
    throw new Error('Minimum players per box cannot be greater than maximum players per box');
  }
  
  if (playerCount < minPlayers) {
    throw new Error(`Not enough players. Need at least ${minPlayers} players.`);
  }
  
  // Calculate optimal number of boxes
  // Start with maximum possible boxes (using min players per box)
  let optimalBoxes = Math.floor(playerCount / minPlayers);
  let playersPerBox = Math.floor(playerCount / optimalBoxes);
  
  // Adjust if we exceed maximum players per box
  while (playersPerBox > maxPlayers && optimalBoxes < playerCount) {
    optimalBoxes++;
    playersPerBox = Math.floor(playerCount / optimalBoxes);
  }
  
  // Check if it's possible with given constraints
  if (playersPerBox < minPlayers) {
    throw new Error(`Cannot create boxes with minimum ${minPlayers} players. Try reducing min players or increasing total players.`);
  }
  
  const remainder = playerCount % optimalBoxes;
  const boxSizes = generateBoxSizes(optimalBoxes, playersPerBox, remainder);
  
  // Final validation: ensure no box exceeds max players
  const maxBoxSize = Math.max(...boxSizes);
  if (maxBoxSize > maxPlayers) {
    throw new Error(`Cannot create boxes with maximum ${maxPlayers} players. The optimal configuration would have ${maxBoxSize} players in some boxes. Try increasing max players or reducing total players.`);
  }
  
  return {
    total_players: playerCount,
    box_count: optimalBoxes,
    players_per_box: playersPerBox,
    box_size_range: `${minPlayers}-${maxPlayers}`,
    boxSizes
  };
}

// Helper function to generate box sizes array
function generateBoxSizes(boxes: number, playersPerBox: number, remainder: number): number[] {
  const boxSizes: number[] = [];
  for (let i = 0; i < boxes; i++) {
    const playersInBox = i === boxes - 1 && remainder > 0
      ? playersPerBox + remainder
      : playersPerBox;
    boxSizes.push(playersInBox);
  }
  return boxSizes;
}

// Helper function to calculate optimal box configuration (default/fallback)
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
    // Get the number of players for this specific box
    const playersInThisBox = boxConfig.boxSizes ? boxConfig.boxSizes[boxNumber - 1] : players_per_box;
    
    // Create box
    const { data: box, error: boxError } = await supabase
      .from("league_boxes")
      .insert({
        league_id: leagueId,
        level: boxNumber, // Use 'level' instead of 'box_number' and 'box_level'
        name: `Box ${boxNumber}`, // Add name field
        max_players: playersInThisBox,
        current_players: playersInThisBox,
      })
      .select()
      .single();

    if (boxError) {
      throw boxError;
    }

    // Assign players to this box
    const startIndex = boxNumber === 1 ? 0 : boxConfig.boxSizes ? 
      boxConfig.boxSizes.slice(0, boxNumber - 1).reduce((sum, size) => sum + size, 0) :
      (boxNumber - 1) * players_per_box;
    const endIndex = startIndex + playersInThisBox;
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

    // Box player count is already set correctly during creation

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
  
  // Generate all possible pairings
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      
      const match: any = {
        league_id: leagueId,
        box_id: boxId,
        status: "scheduled",
        match_type: "round_robin",
        created_at: new Date().toISOString(),
      };
      
      // Handle player1 (registered user or guest)
      if (player1.user_id) {
        match.player1_id = player1.user_id;
        match.player1_username = player1.name;
      } else if (player1.guest_player_id) {
        match.player1_guest_id = player1.guest_player_id;
        match.player1_username = player1.name;
      }
      
      // Handle player2 (registered user or guest)
      if (player2.user_id) {
        match.player2_id = player2.user_id;
        match.player2_username = player2.name;
      } else if (player2.guest_player_id) {
        match.player2_guest_id = player2.guest_player_id;
        match.player2_username = player2.name;
      }
      
      matches.push(match);
    }
  }
  
  return matches;
}
