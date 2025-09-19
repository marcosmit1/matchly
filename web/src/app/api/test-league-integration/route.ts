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
      testType = 'full', 
      playerCount = 8,
      leagueName = 'Integration Test League',
      numberOfBoxes = null, // Allow custom box count
      minPlayersPerBox = null, // Allow custom min players per box
      maxPlayersPerBox = null // Allow custom max players per box
    } = body;

    const results: any = {
      testType,
      playerCount,
      leagueName,
      steps: [],
      errors: [],
      success: false
    };

    // Step 1: Create a test league
    results.steps.push('Creating test league...');
    const { data: leagueData, error: leagueError } = await supabase.rpc("create_league", {
      p_name: leagueName,
      p_description: `Integration test league with ${playerCount} players`,
      p_sport: "squash",
      p_max_players: playerCount,
      p_start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      p_location: "Test Location",
      p_entry_fee: 0,
      p_prize_pool: 0,
    });

    if (leagueError) {
      results.errors.push(`League creation failed: ${leagueError.message}`);
      return NextResponse.json(results, { status: 500 });
    }

    const leagueId = leagueData.id;
    results.leagueId = leagueId;
    results.steps.push(`✅ League created with ID: ${leagueId}`);

    // Step 2: Add the current user as a participant (use upsert to handle duplicates)
    results.steps.push('Adding current user as participant...');
    const { error: participantError } = await supabase
      .from("league_participants")
      .upsert({
        league_id: leagueId,
        user_id: user.id,
        status: 'confirmed',
        joined_at: new Date().toISOString()
      }, { onConflict: 'league_id,user_id' });

    if (participantError) {
      results.errors.push(`Failed to add user as participant: ${participantError.message}`);
    } else {
      results.steps.push('✅ Current user added as participant');
    }

    // Step 3: Set up the league for testing by updating player count
    results.steps.push(`Setting up league with ${playerCount} players...`);
    
    const { error: updateError } = await supabase
      .from("leagues")
      .update({ 
        current_players: playerCount,
        status: 'open'  // Keep as 'open' so we can start it
      })
      .eq("id", leagueId);

    if (updateError) {
      results.errors.push(`Failed to update league player count: ${updateError.message}`);
    } else {
      results.steps.push(`✅ League updated to ${playerCount} players (status: open)`);
    }

    // Step 4: Start the league by creating boxes and matches directly
    results.steps.push('Starting the league by creating boxes and matches...');
    
    // Calculate box configuration (use custom parameters if provided)
    const boxConfig = calculateFlexibleBoxConfiguration(
      playerCount, 
      numberOfBoxes, 
      minPlayersPerBox, 
      maxPlayersPerBox
    );
    
    const configDescription = buildConfigDescription(boxConfig, numberOfBoxes, minPlayersPerBox, maxPlayersPerBox);
    results.steps.push(`Creating ${boxConfig.boxes} boxes${configDescription}`);
    
    // Debug: Show the calculation logic
    if (minPlayersPerBox || maxPlayersPerBox) {
      results.steps.push(`Debug: ${playerCount} players, min ${minPlayersPerBox || 2}, max ${maxPlayersPerBox || 8} → ${boxConfig.boxes} boxes with sizes [${boxConfig.boxSizes?.join(', ') || 'N/A'}]`);
    }
    
    // Create boxes
    const boxes = [];
    for (let i = 0; i < boxConfig.boxes; i++) {
      const playersInBox = boxConfig.boxSizes ? boxConfig.boxSizes[i] : 
        (i === boxConfig.boxes - 1 && boxConfig.remainder > 0
          ? boxConfig.playersPerBox + boxConfig.remainder
          : boxConfig.playersPerBox);

      const { data: box, error: boxError } = await supabase
        .from("league_boxes")
        .insert({
          league_id: leagueId,
          level: i + 1,
          name: `Box ${i + 1}`,
          max_players: playersInBox,
          current_players: playersInBox
        })
        .select()
        .single();

      if (boxError) {
        results.errors.push(`Failed to create box ${i + 1}: ${boxError.message}`);
      } else {
        boxes.push(box);
        results.steps.push(`✅ Created Box ${i + 1} with ${playersInBox} players`);
      }
    }

    // Create matches for each box
    let totalMatches = 0;
    for (const box of boxes) {
      const playersInBox = box.current_players;
      const matchesInBox = (playersInBox * (playersInBox - 1)) / 2; // n choose 2
      
      // Generate test player UUIDs (using a deterministic approach for testing)
      // Since we're using the test table, we can use any UUIDs
      const testPlayerIds = [];
      for (let i = 0; i < playersInBox; i++) {
        // Generate a deterministic UUID for testing
        const testUuid = `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
        testPlayerIds.push(testUuid);
      }
      results.steps.push(`Generated ${testPlayerIds.length} test player UUIDs for Box ${box.level}`);
      
      const matches = [];
      for (let i = 0; i < playersInBox; i++) {
        for (let j = i + 1; j < playersInBox; j++) {
          matches.push({
            league_id: leagueId,
            box_id: box.id,
            player1_id: testPlayerIds[i],
            player2_id: testPlayerIds[j],
            player1_username: `TestPlayer${i + 1}`,
            player2_username: `TestPlayer${j + 1}`,
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + (totalMatches * 24 * 60 * 60 * 1000)).toISOString()
          });
        }
      }

      if (matches.length > 0) {
        results.steps.push(`Creating ${matches.length} matches for Box ${box.level}...`);
        const { error: matchesError } = await supabase
          .from("league_matches_test")
          .insert(matches);

        if (matchesError) {
          results.errors.push(`Failed to create matches for Box ${box.level}: ${matchesError.message}`);
        } else {
          results.steps.push(`✅ Created ${matches.length} matches for Box ${box.level}`);
          totalMatches += matches.length;
        }
      }
    }

    // Update league status to started
    const { error: statusError } = await supabase
      .from("leagues")
      .update({ 
        status: 'started',
        started_at: new Date().toISOString()
      })
      .eq("id", leagueId);

    if (statusError) {
      results.errors.push(`Failed to update league status: ${statusError.message}`);
    } else {
      results.steps.push('✅ League status updated to started');
    }

    // Step 5: Fetch the created boxes
    results.steps.push('Fetching created boxes...');
    const { data: fetchedBoxes, error: boxesError } = await supabase
      .from("league_boxes")
      .select("*")
      .eq("league_id", leagueId);

    if (boxesError) {
      results.errors.push(`Failed to fetch boxes: ${boxesError.message}`);
    } else {
      results.steps.push(`✅ Found ${fetchedBoxes?.length || 0} boxes created`);
      results.boxes = fetchedBoxes;
    }

    // Step 6: Fetch the created matches
    results.steps.push('Fetching created matches...');
    const { data: matches, error: matchesError } = await supabase
      .from("league_matches_test")
      .select("*")
      .eq("league_id", leagueId);

    if (matchesError) {
      results.errors.push(`Failed to fetch matches: ${matchesError.message}`);
    } else {
      results.steps.push(`✅ Found ${matches?.length || 0} matches created`);
      results.matches = matches;
    }

    // Step 7: Get final league status
    results.steps.push('Fetching final league status...');
    const { data: finalLeague, error: finalLeagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .single();

    if (finalLeagueError) {
      results.errors.push(`Failed to fetch final league status: ${finalLeagueError.message}`);
    } else {
      results.steps.push('✅ Final league status retrieved');
      results.finalLeague = finalLeague;
    }

    // Determine success
    results.success = results.errors.length === 0;
    
    if (results.success) {
      results.steps.push('🎉 Integration test completed successfully!');
    } else {
      results.steps.push('❌ Integration test completed with errors');
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Integration test error:', error);
    return NextResponse.json(
      { 
        error: 'Integration test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
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
  boxes: number;
  playersPerBox: number;
  remainder: number;
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
    boxSizes: generateBoxSizes(config.boxes, config.playersPerBox, config.remainder)
  };
}

// Helper function to calculate custom box configuration
function calculateCustomBoxConfiguration(playerCount: number, numberOfBoxes: number): {
  boxes: number;
  playersPerBox: number;
  remainder: number;
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
    boxes: numberOfBoxes,
    playersPerBox,
    remainder,
    boxSizes
  };
}

// Helper function to calculate optimal box configuration based on min/max players per box
function calculateOptimalBoxConfiguration(
  playerCount: number, 
  minPlayersPerBox?: number | null, 
  maxPlayersPerBox?: number | null
): {
  boxes: number;
  playersPerBox: number;
  remainder: number;
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
    boxes: optimalBoxes,
    playersPerBox,
    remainder,
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

// Helper function to build configuration description
function buildConfigDescription(
  boxConfig: any, 
  numberOfBoxes?: number | null, 
  minPlayersPerBox?: number | null, 
  maxPlayersPerBox?: number | null
): string {
  const parts: string[] = [];
  
  if (numberOfBoxes) {
    parts.push(`(custom: ${numberOfBoxes} boxes)`);
  }
  
  if (minPlayersPerBox || maxPlayersPerBox) {
    const min = minPlayersPerBox || 2;
    const max = maxPlayersPerBox || 8;
    parts.push(`(min: ${min}, max: ${max} players/box)`);
  }
  
  if (boxConfig.boxSizes) {
    const sizes = boxConfig.boxSizes.join(', ');
    parts.push(`with ${sizes} players respectively`);
  } else {
    parts.push(`with ${boxConfig.playersPerBox} players each`);
  }
  
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

// Helper function to calculate box configuration
function calculateBoxConfiguration(playerCount: number): {
  boxes: number;
  playersPerBox: number;
  remainder: number;
} {
  if (playerCount < 4) {
    return { boxes: 1, playersPerBox: playerCount, remainder: 0 };
  }

  // Optimal box sizes for different player counts
  const configurations = [
    { min: 4, max: 8, boxes: 1, playersPerBox: 8 },
    { min: 9, max: 16, boxes: 2, playersPerBox: 8 },
    { min: 17, max: 24, boxes: 3, playersPerBox: 8 },
    { min: 25, max: 32, boxes: 4, playersPerBox: 8 },
  ];

  const config = configurations.find(
    c => playerCount >= c.min && playerCount <= c.max
  );

  if (config) {
    const remainder = playerCount % config.playersPerBox;
    return {
      boxes: config.boxes,
      playersPerBox: config.playersPerBox,
      remainder,
    };
  }

  // Fallback for larger groups
  const boxes = Math.ceil(playerCount / 8);
  const playersPerBox = Math.floor(playerCount / boxes);
  const remainder = playerCount % boxes;

  return { boxes, playersPerBox, remainder };
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
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ error: "League ID is required" }, { status: 400 });
    }

    // Fetch comprehensive league data
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select(`
        *,
        league_boxes(*),
        league_matches(*),
        league_participants(
          *,
          users(id, username, email)
        )
      `)
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      return NextResponse.json({ error: "Failed to fetch league data" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      league,
      summary: {
        totalBoxes: league.league_boxes?.length || 0,
        totalMatches: league.league_matches?.length || 0,
        totalParticipants: league.league_participants?.length || 0,
        leagueStatus: league.status,
      }
    });

  } catch (error) {
    console.error('Fetch league data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}
