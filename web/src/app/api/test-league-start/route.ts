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
    const { leagueId, playerCount = 8 } = body;

    if (!leagueId) {
      return NextResponse.json({ error: "League ID is required" }, { status: 400 });
    }

    const results: any = {
      leagueId,
      playerCount,
      steps: [],
      errors: [],
      success: false
    };

    // Step 1: Verify league exists and user is creator
    results.steps.push('Verifying league ownership...');
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .eq("created_by", user.id)
      .single();

    if (leagueError || !league) {
      results.errors.push("League not found or you're not the creator");
      return NextResponse.json(results, { status: 404 });
    }

    results.steps.push(`✅ League verified: ${league.name}`);

    // Step 2: Update league status to started
    results.steps.push('Updating league status to started...');
    const { error: statusError } = await supabase
      .from("leagues")
      .update({ 
        status: 'started',
        started_at: new Date().toISOString(),
        current_players: playerCount
      })
      .eq("id", leagueId);

    if (statusError) {
      results.errors.push(`Failed to update league status: ${statusError.message}`);
    } else {
      results.steps.push('✅ League status updated to started');
    }

    // Step 3: Create boxes based on player count
    results.steps.push('Creating league boxes...');
    const boxConfig = calculateBoxConfiguration(playerCount);
    const boxes = [];

    for (let i = 0; i < boxConfig.boxes; i++) {
      const playersInBox = i === boxConfig.boxes - 1 && boxConfig.remainder > 0
        ? boxConfig.remainder
        : boxConfig.playersPerBox;

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

    // Step 4: Generate matches for each box
    results.steps.push('Generating matches...');
    let totalMatches = 0;

    for (const box of boxes) {
      const playersInBox = box.current_players;
      const matchesInBox = (playersInBox * (playersInBox - 1)) / 2; // n choose 2
      
      const matches = [];
      for (let i = 0; i < playersInBox; i++) {
        for (let j = i + 1; j < playersInBox; j++) {
          matches.push({
            league_id: leagueId,
            box_id: box.id,
            player1_id: `test-player-${i + 1}`,
            player2_id: `test-player-${j + 1}`,
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + (totalMatches * 24 * 60 * 60 * 1000)).toISOString() // Spread matches over days
          });
        }
      }

      if (matches.length > 0) {
        const { error: matchesError } = await supabase
          .from("league_matches")
          .insert(matches);

        if (matchesError) {
          results.errors.push(`Failed to create matches for Box ${box.level}: ${matchesError.message}`);
        } else {
          results.steps.push(`✅ Created ${matches.length} matches for Box ${box.level}`);
          totalMatches += matches.length;
        }
      }
    }

    // Step 5: Get final results
    results.steps.push('Fetching final results...');
    const { data: finalLeague, error: finalLeagueError } = await supabase
      .from("leagues")
      .select(`
        *,
        league_boxes(*),
        league_matches(*)
      `)
      .eq("id", leagueId)
      .single();

    if (finalLeagueError) {
      results.errors.push(`Failed to fetch final results: ${finalLeagueError.message}`);
    } else {
      results.steps.push('✅ Final results retrieved');
      results.finalLeague = finalLeague;
      results.summary = {
        totalBoxes: finalLeague.league_boxes?.length || 0,
        totalMatches: finalLeague.league_matches?.length || 0,
        leagueStatus: finalLeague.status
      };
    }

    results.success = results.errors.length === 0;
    
    if (results.success) {
      results.steps.push('🎉 Test league started successfully!');
    } else {
      results.steps.push('❌ Test league start completed with errors');
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Test league start error:', error);
    return NextResponse.json(
      { 
        error: 'Test league start failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
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
