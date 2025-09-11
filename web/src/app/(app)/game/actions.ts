"use server";

import { createClient } from "@/supabase/server";
import { GAME, PLAYER, USER, CUP_FORMATION_TYPE } from "@/types/game";
import { SEND_GAME_INVITE_NOTIFICATIONS } from "@/lib/game-notifications";

export async function CREATE_GAME(
  team1players: PLAYER[],
  team2players: PLAYER[],
  cupformation: CUP_FORMATION_TYPE = CUP_FORMATION_TYPE.tenCups,
  opts?: { isTournament?: boolean; tournamentId?: string | null; team1Name?: string; team2Name?: string }
): Promise<{ gameid: string; game: GAME }> {
  const supabase = await createClient();

  // Determine total cups based on formation
  const totalcupsperteam = cupformation === CUP_FORMATION_TYPE.sixCups ? 6 : 10;

  // Create the game object
  const gamedata = {
    current_player_index: 0,
    current_team: 1,
    is_part_of_tournament: Boolean(opts?.isTournament),
    status: "active",
    tournament_id: opts?.tournamentId || null,
    winner: null,
    cup_formation: cupformation,
    total_cups_per_team: totalcupsperteam,
    detailed_tracking: true,
    team1: {
      score: 0,
      players: team1players,
      team_name: opts?.team1Name || "Team 1",
    },
    team2: {
      score: 0,
      players: team2players,
      team_name: opts?.team2Name || "Team 2",
    },
  };

  // Insert into database
  const { data, error } = await supabase.from("games").insert(gamedata).select("*").single();

  if (error) {
    throw new Error(`Failed to create game: ${error.message}`);
  }

  // Convert database record to GAME type
  const game: GAME = {
    id: data.id,
    current_player_index: data.current_player_index,
    current_team: data.current_team,
    is_part_of_tournament: data.is_part_of_tournament,
    status: data.status,
    tournament_id: data.tournament_id,
    winner: data.winner,
    team1: data.team1,
    team2: data.team2,
    cup_formation: data.cup_formation,
    total_cups_per_team: data.total_cups_per_team,
    detailed_tracking: data.detailed_tracking,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  // Log a single game_start from the authenticated user (creator)
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user?.id) {
      await LOG_GAME_EVENT(data.id, auth.user.id, "game_start", 1, {
        team1_cups: totalcupsperteam,
        team2_cups: totalcupsperteam,
        team1_score: 0,
        team2_score: 0,
      });
    }
  } catch {}

  // Send push notifications to all players about the game invite
  try {
    console.log("🔔 Starting game invite notification process...");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log("👤 Current user:", user?.id);
    console.log("👥 All players in game:", [...team1players, ...team2players].map(p => ({ id: p.id, userId: p.userId, name: p.name, isRegistered: p.isRegisteredUser })));
    
    if (user) {
      // Get the creator's display name
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .maybeSingle();

      const creatorName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.first_name 
        ? profile.first_name
        : profile?.email?.split("@")[0] || "Someone";

      console.log("👤 Creator name:", creatorName);

      // Send notifications to all players (excluding the creator if they're in the game)
      const otherPlayers = [...team1players, ...team2players].filter(p => p.userId && p.userId !== user.id);
      console.log("📤 Other players to notify:", otherPlayers.map(p => ({ userId: p.userId, name: p.name, isRegistered: p.isRegisteredUser })));
      
      if (otherPlayers.length > 0) {
        console.log("📨 Sending notifications...");
        const notificationResult = await SEND_GAME_INVITE_NOTIFICATIONS(
          otherPlayers, 
          data.id, 
          creatorName
        );
        
        console.log("🔔 Game invite notifications result:", notificationResult);
      } else {
        console.log("🔕 No other players to notify (all players are guests or creator)");
      }
    } else {
      console.log("❌ No authenticated user found");
    }
  } catch (error) {
    // Don't fail game creation if notifications fail
    console.error("⚠️ Failed to send game invite notifications (non-blocking):", error);
  }

  return { gameid: data.id, game };
}

export async function UPDATE_GAME_STATE(gameid: string, updates: Partial<GAME>): Promise<GAME> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("games").update(updates).eq("id", gameid).select("*").single();

  if (error) {
    throw new Error(`Failed to update game: ${error.message}`);
  }

  // Convert database record to GAME type
  const game: GAME = {
    id: data.id,
    current_player_index: data.current_player_index,
    current_team: data.current_team,
    is_part_of_tournament: data.is_part_of_tournament,
    status: data.status,
    tournament_id: data.tournament_id,
    winner: data.winner,
    team1: data.team1,
    team2: data.team2,
    cup_formation: data.cup_formation,
    total_cups_per_team: data.total_cups_per_team,
    detailed_tracking: data.detailed_tracking,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return game;
}

/**
 * Get all users for player selection
 */
export async function GET_USERS(): Promise<USER[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("users").select("*").order("first_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data || [];
}

/**
 * Get current user
 */
export async function GET_CURRENT_USER(): Promise<USER | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase.from("users").select("*").eq("id", authUser.id).single();

  if (error) {
    console.error("Failed to fetch current user:", error.message);
    return null;
  }

  return data;
}

/**
 * Search user by exact email match
 */
export async function FIND_USER_BY_EMAIL(email: string): Promise<USER | null> {
  const supabase = await createClient();

  // Clean the email
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.from("users").select("*").ilike("email", cleanEmail).single();

  if (error) {
    // User not found is expected, don't throw error
    if (error.code === "PGRST116") return null;
    console.error("Error searching user:", error.message);
    return null;
  }

  return data;
}

/**
 * Update game status
 */
export async function UPDATE_GAME_STATUS(gameid: string, status: GAME["status"]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("games").update({ status }).eq("id", gameid);

  if (error) {
    throw new Error(`Failed to update game status: ${error.message}`);
  }
}

/**
 * Get game by ID
 */
export async function GET_GAME(gameid: string): Promise<GAME | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("games").select("*").eq("id", gameid).single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to fetch game: ${error.message}`);
  }

  // Convert database record to GAME type
  const game: GAME = {
    id: data.id,
    current_player_index: data.current_player_index,
    current_team: data.current_team,
    is_part_of_tournament: data.is_part_of_tournament,
    status: data.status,
    tournament_id: data.tournament_id,
    winner: data.winner,
    team1: data.team1,
    team2: data.team2,
    cup_formation: data.cup_formation,
    total_cups_per_team: data.total_cups_per_team,
    detailed_tracking: data.detailed_tracking,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return game;
}

/**
 * Log a game event
 */
export async function LOG_GAME_EVENT(
  gameid: string,
  playerid: string,
  eventtype: string,
  teamnumber: number,
  scoreafterevent?: { team1_cups: number; team2_cups: number; team1_score: number; team2_score: number },
  eventdata?: any
): Promise<void> {
  const supabase = await createClient();

  // Always use the authenticated user as the actor to satisfy FK/RLS
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const actorUserId = authUser?.id || playerid; // fallback to provided id if auth missing

  if (!actorUserId) {
    console.warn("⚠️ Skipping LOG_GAME_EVENT because no authenticated user id is available");
    return;
  }

  const eventrecord = {
    game_id: gameid,
    player_id: actorUserId,
    event_type: eventtype,
    team_number: teamnumber,
    cup_position: null, // Keeping as NULL for now as requested
    score_after_event: scoreafterevent || { team1_cups: 10, team2_cups: 10, team1_score: 0, team2_score: 0 },
    event_data: eventdata,
  };

  console.log("📝 Logging game event:", eventrecord);

  const { data, error } = await supabase.from("game_events").insert(eventrecord).select("*");

  if (error) {
    console.error("❌ Failed to log game event:", error);
    // Don't throw - we don't want to break gameplay if event logging fails
  } else {
    console.log("✅ Game event logged successfully:", data);
  }
}

/**
 * Update player game stats
 */
export async function UPDATE_PLAYER_STATS(
  gameid: string,
  playerid: string,
  teamnumber: number,
  updates: {
    shots_attempted?: number;
    shots_made?: number; // Now means "individual shots hit" not team cups
    cups_hit?: number;
    catches?: number;
    redemption_shots?: number;
  }
): Promise<void> {
  const supabase = await createClient();

  // First, get current stats
  const { data: currentstats } = await supabase
    .from("player_game_stats")
    .select("*")
    .eq("game_id", gameid)
    .eq("player_id", playerid)
    .single();

  if (currentstats) {
    // Update existing stats
    const updatedstats = {
      shots_attempted: (currentstats.shots_attempted || 0) + (updates.shots_attempted || 0),
      shots_made: (currentstats.shots_made || 0) + (updates.shots_made || 0),
      cups_hit: (currentstats.cups_hit || 0) + (updates.cups_hit || 0),
      catches: (currentstats.catches || 0) + (updates.catches || 0),
      redemption_shots: (currentstats.redemption_shots || 0) + (updates.redemption_shots || 0),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("player_game_stats")
      .update(updatedstats)
      .eq("game_id", gameid)
      .eq("player_id", playerid);

    if (error) {
      console.error("Failed to update player stats:", error);
    }
  } else {
    // Create new stats record
    const newstats = {
      game_id: gameid,
      player_id: playerid,
      team_number: teamnumber,
      shots_attempted: updates.shots_attempted || 0,
      shots_made: updates.shots_made || 0,
      cups_hit: updates.cups_hit || 0,
      catches: updates.catches || 0,
      redemption_shots: updates.redemption_shots || 0,
      final_score: 0,
      won: false,
    };

    const { error } = await supabase.from("player_game_stats").insert(newstats);

    if (error) {
      console.error("Failed to create player stats:", error);
    }
  }
}

/**
 * Update final game stats when game ends
 */
export async function UPDATE_FINAL_GAME_STATS(gameid: string, winnerteam: number): Promise<void> {
  const supabase = await createClient();

  // Get the game to access team data
  const game = await GET_GAME(gameid);
  if (!game) return;

  // Update stats for all players
  const allplayers = [...game.team1.players, ...game.team2.players];

  for (const player of allplayers) {
    if (player.userId) {
      const playerteam = game.team1.players.find((p) => p.id === player.id) ? 1 : 2;
      const won = playerteam === winnerteam;
      const finalscore = playerteam === 1 ? game.team1.score : game.team2.score;

      const { error } = await supabase
        .from("player_game_stats")
        .update({
          won,
          final_score: finalscore,
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameid)
        .eq("player_id", player.userId);

      if (error) {
        console.error("Failed to update final stats for player:", player.userId, error);
      }
    }
  }
}

/**
 * Advance tournament bracket when a tournament game completes.
 * Sets winner on the current match and seeds into next round.
 */
export async function ADVANCE_TOURNAMENT_AFTER_GAME(
  tournamentId: string,
  matchId: string,
  winnerTeamId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("tournament_matches")
    .select("id, round, match_index")
    .eq("id", matchId)
    .single();

  if (!match) return;

  // Step 1: Mark the current match as complete with winner
  await supabase
    .from("tournament_matches")
    .update({ winner_team_id: winnerTeamId, status: "complete" })
    .eq("id", matchId);

  // Step 2: Check if the current round is now complete
  const { data: currentRoundMatches } = await supabase
    .from("tournament_matches")
    .select("id, winner_team_id, status")
    .eq("tournament_id", tournamentId)
    .eq("round", match.round);
  
  const completedMatches = currentRoundMatches?.filter(m => m.status === "complete") || [];
  const totalMatches = currentRoundMatches?.length || 0;
  
  // Only advance to next round if ALL matches in current round are complete
  if (completedMatches.length !== totalMatches) {
    console.log(`🏆 Round ${match.round} not complete yet: ${completedMatches.length}/${totalMatches} matches finished`);
    return; // Wait for other matches in this round to complete
  }

  console.log(`🏆 Round ${match.round} is complete! Advancing winners to Round ${match.round + 1}`);
  
  // Step 3: Current round is complete - advance ALL winners to next round
  const winners = completedMatches.map(m => m.winner_team_id).filter(Boolean);
  const nextRound = match.round + 1;
  
  // Get all matches in the next round
  const { data: nextRoundMatches } = await supabase
    .from("tournament_matches")
    .select("id, team_a_id, team_b_id, match_index")
    .eq("tournament_id", tournamentId)
    .eq("round", nextRound)
    .order("match_index");

  if (!nextRoundMatches || nextRoundMatches.length === 0) {
    // No next round exists - check if tournament is complete
    const { data: allMatches } = await supabase
      .from("tournament_matches")
      .select("round, status, winner_team_id")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: false });

    if (!allMatches || allMatches.length === 0) return;

    const highestRound = allMatches[0].round;
    const highestRoundMatches = allMatches.filter(m => m.round === highestRound);
    
    // Tournament is complete if ALL matches in the highest round are complete with winners
    const allHighestRoundComplete = highestRoundMatches.every(m => 
      m.status === "complete" && m.winner_team_id
    );
    
    if (allHighestRoundComplete && highestRoundMatches.length > 0) {
      console.log(`🏆 Tournament complete! Winner: ${highestRoundMatches[0].winner_team_id}`);
      await supabase.from("tournaments").update({ status: "completed" }).eq("id", tournamentId);
    }
    return;
  }

  // Step 4: Place winners into next round matches
  let winnerIndex = 0;
  for (const nextMatch of nextRoundMatches) {
    // Fill team_a_id first, then team_b_id
    const updates: any = {};
    
    if (!nextMatch.team_a_id && winnerIndex < winners.length) {
      updates.team_a_id = winners[winnerIndex++];
    }
    
    if (!nextMatch.team_b_id && winnerIndex < winners.length) {
      updates.team_b_id = winners[winnerIndex++];
    }
    
    // Update the match if we have changes
    if (Object.keys(updates).length > 0) {
      await supabase
        .from("tournament_matches")
        .update(updates)
        .eq("id", nextMatch.id);
      
      console.log(`🏆 Seeded teams into Round ${nextRound} Match ${nextMatch.match_index}:`, updates);
    }
  }

  // Step 5: Handle byes if odd number of winners
  if (winnerIndex < winners.length) {
    // We have leftover winners - they get byes to the round after next
    const byeTeams = winners.slice(winnerIndex);
    console.log(`🏆 ${byeTeams.length} teams get byes to Round ${nextRound + 1}:`, byeTeams);
    
    // Find matches in the round after next to place bye teams
    const { data: byeRoundMatches } = await supabase
      .from("tournament_matches")
      .select("id, team_a_id, team_b_id, match_index")
      .eq("tournament_id", tournamentId)
      .eq("round", nextRound + 1)
      .order("match_index");
    
    if (byeRoundMatches) {
      let byeIndex = 0;
      for (const byeMatch of byeRoundMatches) {
        if (byeIndex >= byeTeams.length) break;
        
        const byeUpdates: any = {};
        
        if (!byeMatch.team_a_id) {
          byeUpdates.team_a_id = byeTeams[byeIndex++];
        } else if (!byeMatch.team_b_id) {
          byeUpdates.team_b_id = byeTeams[byeIndex++];
        }
        
        if (Object.keys(byeUpdates).length > 0) {
          await supabase
            .from("tournament_matches")
            .update(byeUpdates)
            .eq("id", byeMatch.id);
          
          console.log(`🏆 Bye team seeded into Round ${nextRound + 1} Match ${byeMatch.match_index}:`, byeUpdates);
        }
      }
    }
  }
}
