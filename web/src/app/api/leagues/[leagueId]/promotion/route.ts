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

    // Check if user is the league creator
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("created_by, status")
      .eq("id", leagueId)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    if (league.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the league creator can process promotions" },
        { status: 403 }
      );
    }

    if (league.status !== "started") {
      return NextResponse.json(
        { error: "League must be started to process promotions" },
        { status: 400 }
      );
    }

    // Get all boxes for this league
    const { data: boxes, error: boxesError } = await supabase
      .from("league_boxes")
      .select("id, box_level, box_number")
      .eq("league_id", leagueId)
      .eq("status", "active")
      .order("box_level", { ascending: false });

    if (boxesError) {
      console.error("Error fetching boxes:", boxesError);
      return NextResponse.json(
        { error: "Failed to fetch league boxes" },
        { status: 500 }
      );
    }

    const promotionResults = [];

    // Process each box for promotions/relegations
    for (const box of boxes) {
      // Get current standings for this box
      const { data: standings, error: standingsError } = await supabase
        .from("league_box_standings")
        .select("*")
        .eq("league_id", leagueId)
        .eq("box_id", box.id)
        .order("position");

      if (standingsError) {
        console.error("Error fetching standings:", standingsError);
        continue;
      }

      if (standings.length === 0) {
        continue; // Skip empty boxes
      }

      const totalPlayers = standings.length;
      const promoteCount = Math.max(1, Math.floor(totalPlayers / 5)); // Top 20%
      const relegateCount = Math.max(1, Math.floor(totalPlayers / 5)); // Bottom 20%

      // Find players to promote (top performers)
      const playersToPromote = standings.slice(0, promoteCount);
      
      // Find players to relegate (bottom performers)
      const playersToRelegate = standings.slice(-relegateCount);

      // Find the next higher box
      const nextHigherBox = boxes.find(b => b.box_level > box.box_level);
      
      // Find the next lower box
      const nextLowerBox = boxes.find(b => b.box_level < box.box_level);

      // Process promotions
      for (const player of playersToPromote) {
        if (nextHigherBox) {
          // Move to higher box
          await supabase
            .from("league_box_assignments")
            .update({ 
              status: "promoted",
              box_id: nextHigherBox.id 
            })
            .eq("league_id", leagueId)
            .eq("user_id", player.user_id);

          // Record promotion history
          await supabase
            .from("league_promotion_history")
            .insert({
              league_id: leagueId,
              user_id: player.user_id,
              from_box_id: box.id,
              to_box_id: nextHigherBox.id,
              movement_type: "promotion",
              season_period: "Current Round",
              matches_played: player.matches_played,
              matches_won: player.matches_won,
              final_position: player.position,
            });

          promotionResults.push({
            user_id: player.user_id,
            action: "promoted",
            from_box: box.box_number,
            to_box: nextHigherBox.box_number,
          });
        }
      }

      // Process relegations
      for (const player of playersToRelegate) {
        if (nextLowerBox) {
          // Move to lower box
          await supabase
            .from("league_box_assignments")
            .update({ 
              status: "relegated",
              box_id: nextLowerBox.id 
            })
            .eq("league_id", leagueId)
            .eq("user_id", player.user_id);

          // Record relegation history
          await supabase
            .from("league_promotion_history")
            .insert({
              league_id: leagueId,
              user_id: player.user_id,
              from_box_id: box.id,
              to_box_id: nextLowerBox.id,
              movement_type: "relegation",
              season_period: "Current Round",
              matches_played: player.matches_played,
              matches_won: player.matches_won,
              final_position: player.position,
            });

          promotionResults.push({
            user_id: player.user_id,
            action: "relegated",
            from_box: box.box_number,
            to_box: nextLowerBox.box_number,
          });
        }
      }
    }

    // Update box player counts
    for (const box of boxes) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from("league_box_assignments")
        .select("id")
        .eq("league_id", leagueId)
        .eq("box_id", box.id)
        .eq("status", "active");

      if (!assignmentsError) {
        await supabase
          .from("league_boxes")
          .update({ current_players: assignments.length })
          .eq("id", box.id);
      }
    }

    return NextResponse.json({
      message: "Promotion/relegation processed successfully",
      league_id: leagueId,
      promotions: promotionResults.filter(r => r.action === "promoted"),
      relegations: promotionResults.filter(r => r.action === "relegated"),
      total_movements: promotionResults.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
