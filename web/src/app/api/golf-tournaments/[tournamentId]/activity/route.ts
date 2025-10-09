import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const WATER_HAZARD_MESSAGES = [
  "🌊 {player} practiced their swimming technique on hole {hole}!",
  "💦 {player} donated a ball to the water gods on hole {hole}",
  "🏊‍♂️ {player} decided to go for a swim on hole {hole}",
  "🚣‍♂️ {player} might need a boat for hole {hole}",
  "🐠 {player}'s ball is making friends with the fish on hole {hole}",
];

const BUNKER_MESSAGES = [
  "🏖️ {player} built some sandcastles on hole {hole}",
  "⛱️ {player} found the beach on hole {hole}",
  "🌴 {player} practiced their sand art on hole {hole}",
  "🏺 {player} did some sand trap archaeology on hole {hole}",
];

const FAIRWAY_STREAK_MESSAGES = [
  "🎯 {player} is a fairway finding machine! {count} in a row!",
  "🎪 {player} is putting on a driving clinic! {count} fairways hit!",
  "🚀 {player} is striping it down the middle! {count} straight fairways!",
];

const PUTTING_MESSAGES = [
  "🔥 {player} is on fire with the putter! {count} one-putts in a row!",
  "🎳 {player} is rolling it pure! Another one-putt!",
  "🎯 {player} has the putting yips... {count} three-putts today",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = await params;
    
    // Get tournament scores with player info
    const { data: scores, error: scoresError } = await supabase
      .from("golf_scores")
      .select(`
        *,
        participant:golf_tournament_participants!inner(
          id,
          player_name,
          user_id
        )
      `)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false });

    if (scoresError) {
      console.error("Error fetching scores:", scoresError);
      return NextResponse.json(
        { error: "Failed to fetch scores" },
        { status: 500 }
      );
    }

    // Process scores into activity feed
    const activities = [];
    const playerStats: Record<string, {
      fairwayStreak: number;
      onePuttStreak: number;
      threePuttCount: number;
      waterHazardCount: number;
      bunkerCount: number;
    }> = {};

    for (const score of scores) {
      const player = score.participant;
      if (!player) continue;

      // Initialize player stats if needed
      if (!playerStats[player.id]) {
        playerStats[player.id] = {
          fairwayStreak: 0,
          onePuttStreak: 0,
          threePuttCount: 0,
          waterHazardCount: 0,
          bunkerCount: 0,
        };
      }

      // Track water hazards
      if (score.water_hazard) {
        playerStats[player.id].waterHazardCount++;
        activities.push({
          id: `water-${score.id}`,
          type: "water",
          message: WATER_HAZARD_MESSAGES[Math.floor(Math.random() * WATER_HAZARD_MESSAGES.length)]
            .replace("{player}", player.player_name)
            .replace("{hole}", score.hole_number.toString()),
          hole_number: score.hole_number,
          created_at: score.created_at,
        });
      }

      // Track bunkers
      if (score.bunker) {
        playerStats[player.id].bunkerCount++;
        activities.push({
          id: `bunker-${score.id}`,
          type: "bunker",
          message: BUNKER_MESSAGES[Math.floor(Math.random() * BUNKER_MESSAGES.length)]
            .replace("{player}", player.player_name)
            .replace("{hole}", score.hole_number.toString()),
          hole_number: score.hole_number,
          created_at: score.created_at,
        });
      }

      // Track fairway streaks
      if (score.fairway_hit) {
        playerStats[player.id].fairwayStreak++;
        if (playerStats[player.id].fairwayStreak >= 3) {
          activities.push({
            id: `fairway-streak-${score.id}`,
            type: "fairway_streak",
            message: FAIRWAY_STREAK_MESSAGES[Math.floor(Math.random() * FAIRWAY_STREAK_MESSAGES.length)]
              .replace("{player}", player.player_name)
              .replace("{count}", playerStats[player.id].fairwayStreak.toString()),
            hole_number: score.hole_number,
            created_at: score.created_at,
          });
        }
      } else {
        playerStats[player.id].fairwayStreak = 0;
      }

      // Track putting
      if (score.putts === 1) {
        playerStats[player.id].onePuttStreak++;
        if (playerStats[player.id].onePuttStreak >= 2) {
          activities.push({
            id: `putting-streak-${score.id}`,
            type: "putting_streak",
            message: PUTTING_MESSAGES[Math.floor(Math.random() * 2)] // First two messages are for good putting
              .replace("{player}", player.player_name)
              .replace("{count}", playerStats[player.id].onePuttStreak.toString()),
            hole_number: score.hole_number,
            created_at: score.created_at,
          });
        }
      } else {
        playerStats[player.id].onePuttStreak = 0;
      }

      if (score.putts >= 3) {
        playerStats[player.id].threePuttCount++;
        if (playerStats[player.id].threePuttCount >= 2) {
          activities.push({
            id: `three-putt-${score.id}`,
            type: "putting_streak",
            message: PUTTING_MESSAGES[2] // Last message is for bad putting
              .replace("{player}", player.player_name)
              .replace("{count}", playerStats[player.id].threePuttCount.toString()),
            hole_number: score.hole_number,
            created_at: score.created_at,
          });
        }
      }

      // Add scoring achievements
      if (score.is_eagle) {
        activities.push({
          id: `eagle-${score.id}`,
          type: "eagle",
          message: `🦅 ${player.player_name} just eagled hole ${score.hole_number}! Incredible shot!`,
          hole_number: score.hole_number,
          created_at: score.created_at,
        });
      } else if (score.is_birdie) {
        activities.push({
          id: `birdie-${score.id}`,
          type: "birdie",
          message: `🐦 ${player.player_name} birdied hole ${score.hole_number}! Nice one!`,
          hole_number: score.hole_number,
          created_at: score.created_at,
        });
      } else if (score.is_double_bogey_plus) {
        activities.push({
          id: `double-plus-${score.id}`,
          type: "double_plus",
          message: `💀 ${player.player_name} might want to forget about hole ${score.hole_number}...`,
          hole_number: score.hole_number,
          created_at: score.created_at,
        });
      }
    }

    // Sort activities by creation time
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 50), // Limit to most recent 50 activities
    });
  } catch (error) {
    console.error("Error in GET /api/golf-tournaments/[id]/activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}