import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { GAME } from "@/types/game";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface GAME_UI_EVENT {
  type:
    | "hit_celebration"
    | "miss_celebration"
    | "catch_celebration"
    | "redemption_start"
    | "redemption_end"
    | "island_call"
    | "game_end"
    | "confetti";
  data: any;
  team_number?: number; // Optional team_number for events that need it (like redemption_end)
}

interface USE_REALTIME_GAME_RETURN {
  game: GAME | null;
  isConnected: boolean;
  connectionError: string | null;
  refetchGame: () => Promise<void>;
  latestUIEvent: GAME_UI_EVENT | null;
  triggerUIEvent: (event: GAME_UI_EVENT) => void;
  applyOptimisticUpdate: (updater: (g: GAME) => GAME) => void;
}

export function USE_REALTIME_GAME(gameid: string, initialgame: GAME): USE_REALTIME_GAME_RETURN {
  const [game, setgame] = useState<GAME>(initialgame);
  const [isconnected, setisconnected] = useState(false);
  const [connectionerror, setconnectionerror] = useState<string | null>(null);
  const [channel, setchannel] = useState<RealtimeChannel | null>(null);
  const [latestuievent, setlatestuievent] = useState<GAME_UI_EVENT | null>(null);

  const supabase = createClient();

  // Function to fetch latest game data
  const REFETCH_GAME = useCallback(async () => {
    try {
      console.log("🔄 Fetching latest game data for:", gameid);
      const { data: gamedata, error } = await supabase.from("games").select("*").eq("id", gameid).single();

      if (error) {
        console.error("❌ Error fetching game:", error);
        setconnectionerror(`Failed to fetch game: ${error.message}`);
        return;
      }

      if (gamedata) {
        const updatedgame: GAME = {
          id: gamedata.id,
          current_player_index: gamedata.current_player_index,
          current_team: gamedata.current_team,
          is_part_of_tournament: gamedata.is_part_of_tournament,
          status: gamedata.status,
          tournament_id: gamedata.tournament_id,
          winner: gamedata.winner,
          team1: gamedata.team1,
          team2: gamedata.team2,
          cup_formation: gamedata.cup_formation,
          total_cups_per_team: gamedata.total_cups_per_team,
          detailed_tracking: gamedata.detailed_tracking,
          created_at: gamedata.created_at,
          updated_at: gamedata.updated_at,
        };

        console.log("✅ Game data updated via refetch:", updatedgame);
        setgame(updatedgame);
        setconnectionerror(null);
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching game:", error);
      setconnectionerror("Unexpected error occurred");
    }
  }, [gameid, supabase]);

  // Handle realtime updates
  const HANDLE_REALTIME_UPDATE = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log("🔄 Realtime update received:", payload);

    if (payload.eventType === "UPDATE" && payload.new) {
      const gamedata = payload.new;
      const updatedgame: GAME = {
        id: gamedata.id,
        current_player_index: gamedata.current_player_index,
        current_team: gamedata.current_team,
        is_part_of_tournament: gamedata.is_part_of_tournament,
        status: gamedata.status,
        tournament_id: gamedata.tournament_id,
        winner: gamedata.winner,
        team1: gamedata.team1,
        team2: gamedata.team2,
        cup_formation: gamedata.cup_formation,
        total_cups_per_team: gamedata.total_cups_per_team,
        detailed_tracking: gamedata.detailed_tracking,
        created_at: gamedata.created_at,
        updated_at: gamedata.updated_at,
      };

      console.log("✅ Game state updated via realtime:", updatedgame);
      setgame(updatedgame);
      setconnectionerror(null);
    }
  }, []);

  // Handle game events for UI synchronization
  const HANDLE_GAME_EVENT = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log("🎯 Game event received:", payload);

    if (payload.eventType === "INSERT" && payload.new) {
      const eventdata = payload.new;
      console.log("🎮 New game event:", eventdata.event_type, "by player:", eventdata.player_id);

      // Trigger UI events based on game events
      switch (eventdata.event_type) {
        case "shot_hit":
        case "island":
          if (eventdata.event_data?.drinking_player) {
            console.log("🍺 Triggering hit celebration for:", eventdata.event_data.drinking_player);
            setlatestuievent({
              type: "hit_celebration",
              data: {
                playername: eventdata.event_data.drinking_player,
                timestamp: Date.now(),
              },
            });
          }
          break;

        case "catch":
          if (eventdata.event_data?.drinking_player) {
            console.log("🤚 Triggering catch celebration for:", eventdata.event_data.drinking_player);
            setlatestuievent({
              type: "catch_celebration",
              data: {
                playername: eventdata.event_data.drinking_player,
                timestamp: Date.now(),
              },
            });
          }
          break;

        case "redemption_start":
          console.log("🍺 Triggering redemption mode");
          setlatestuievent({
            type: "redemption_start",
            data: {
              redemptionteam: eventdata.event_data?.redemption_team,
              winningteam: eventdata.event_data?.winning_team,
              timestamp: Date.now(),
            },
          });
          break;

        case "redemption_end":
          console.log("🏁 Ending redemption mode");
          setlatestuievent({
            type: "redemption_end",
            data: {
              successful: eventdata.event_data?.redemption_successful,
              timestamp: Date.now(),
            },
            team_number: eventdata.team_number, // Add team_number to the UI event
          });
          break;

        case "game_end":
          console.log("🎉 Triggering game end celebration");
          setlatestuievent({
            type: "confetti",
            data: {
              timestamp: Date.now(),
            },
          });
          break;

        default:
          // Log other events for debugging
          console.log("📝 Other game event:", eventdata.event_type);
          break;
      }
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    console.log("🔌 Setting up realtime subscription for game:", gameid);

    // Create realtime channel with both game state and event subscriptions
    const realtimechannel = supabase
      .channel(`game-${gameid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameid}`,
        },
        HANDLE_REALTIME_UPDATE
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_events",
          filter: `game_id=eq.${gameid}`,
        },
        (payload) => {
          console.log("🎯 Raw game event received:", payload);
          HANDLE_GAME_EVENT(payload);
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);

        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to realtime updates for game:", gameid);
          setisconnected(true);
          setconnectionerror(null);
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime subscription error for game:", gameid);
          setisconnected(false);
          setconnectionerror("Realtime connection failed");

          // Auto-retry connection after 2 seconds
          setTimeout(() => {
            console.log("🔄 Attempting to reconnect realtime...");
            // The useEffect will handle reconnection
          }, 2000);
        } else if (status === "TIMED_OUT") {
          console.error("⏰ Realtime subscription timed out for game:", gameid);
          setisconnected(false);
          setconnectionerror("Connection timed out - will retry");

          // Auto-retry connection after 3 seconds
          setTimeout(() => {
            console.log("🔄 Attempting to reconnect after timeout...");
          }, 3000);
        } else if (status === "CLOSED") {
          console.log("🔒 Realtime subscription closed for game:", gameid);
          setisconnected(false);
          setconnectionerror("Connection closed - reconnecting...");
        }
      });

    setchannel(realtimechannel);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up realtime subscription for game:", gameid);
      if (realtimechannel) {
        supabase.removeChannel(realtimechannel);
      }
      setisconnected(false);
    };
  }, [gameid, supabase, HANDLE_REALTIME_UPDATE, HANDLE_GAME_EVENT]);

  // Initial connection status check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isconnected) {
        console.log("⚠️ Realtime connection taking longer than expected");
        setconnectionerror("Connection is taking longer than expected");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isconnected]);

  // Manual trigger function for guest players or other local UI events
  const TRIGGER_UI_EVENT = (event: GAME_UI_EVENT) => {
    console.log("🎯 Manually triggering UI event:", event);
    setlatestuievent(event);
  };

  // Allow optimistic local game updates for instant UI feedback
  const APPLY_OPTIMISTIC_UPDATE = useCallback((updater: (g: GAME) => GAME) => {
    setgame((prev) => {
      if (!prev) return prev as unknown as GAME;
      try {
        const next = updater(prev);
        return next;
      } catch (e) {
        console.error("❌ Optimistic update failed:", e);
        return prev;
      }
    });
  }, []);

  return {
    game,
    isConnected: isconnected,
    connectionError: connectionerror,
    refetchGame: REFETCH_GAME,
    latestUIEvent: latestuievent,
    triggerUIEvent: TRIGGER_UI_EVENT,
    applyOptimisticUpdate: APPLY_OPTIMISTIC_UPDATE,
  };
}
