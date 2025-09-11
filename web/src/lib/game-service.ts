"use client";

import { createClient } from "@/supabase/client";
import { GAME, PLAYER, TEAM, USER } from "@/types/game";

export class GAME_SERVICE {
  private supabase = createClient();

  /**
   * Create a new game with teams
   */
  async CREATE_GAME(team1players: PLAYER[], team2players: PLAYER[]): Promise<GAME> {
    const team1: TEAM = {
      score: 0,
      players: team1players,
      team_name: "Team 1",
    };

    const team2: TEAM = {
      score: 0,
      players: team2players,
      team_name: "Team 2",
    };

    const { data, error } = await this.supabase
      .from("games")
      .insert([
        {
          team1,
          team2,
          status: "pending",
          current_team: 1,
          current_player_index: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create game: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all users for player selection
   */
  async GET_USERS(): Promise<USER[]> {
    const { data, error } = await this.supabase.from("users").select("*").order("first_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get current user
   */
  async GET_CURRENT_USER(): Promise<USER | null> {
    const {
      data: { user: authUser },
    } = await this.supabase.auth.getUser();

    if (!authUser) return null;

    const { data, error } = await this.supabase.from("users").select("*").eq("id", authUser.id).single();

    if (error) {
      throw new Error(`Failed to fetch current user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update game status
   */
  async UPDATE_GAME_STATUS(gameid: string, status: GAME["status"]): Promise<void> {
    const { error } = await this.supabase.from("games").update({ status }).eq("id", gameid);

    if (error) {
      throw new Error(`Failed to update game status: ${error.message}`);
    }
  }

  /**
   * Get game by ID
   */
  async GET_GAME(gameid: string): Promise<GAME | null> {
    const { data, error } = await this.supabase.from("games").select("*").eq("id", gameid).single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch game: ${error.message}`);
    }

    return data;
  }

  /**
   * Search users by name or email
   */
  async SEARCH_USERS(query: string): Promise<USER[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("first_name", { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data || [];
  }
}
