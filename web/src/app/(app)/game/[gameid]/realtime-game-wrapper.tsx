"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { GAME_VIEW } from "../blocks/game-view";
import { GAME } from "@/types/game";
import { gamecolors } from "@/lib/game-theme";
import BubblesBackground from "@/components/bubbles-background";

interface REALTIME_GAME_WRAPPER_PROPS {
  gameid: string;
}

export function REALTIME_GAME_WRAPPER({ gameid }: REALTIME_GAME_WRAPPER_PROPS) {
  const [game, setgame] = useState<GAME | null>(null);
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const INITIALIZE_GAME = async () => {
      try {
        console.log("🎮 Initializing game wrapper for:", gameid);

        // Get authenticated user
        const {
          data: { user: authuser },
        } = await supabase.auth.getUser();

        if (!authuser) {
          console.log("❌ No authenticated user, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("✅ User authenticated:", authuser.id);

        // Get game from database
        const { data: gamedata, error: gameerror } = await supabase.from("games").select("*").eq("id", gameid).single();

        if (gameerror || !gamedata) {
          console.error("❌ Error fetching game:", gameerror);
          seterror("Game not found");
          setTimeout(() => router.push("/game"), 2000);
          return;
        }

        // Check if game is completed
        if (gamedata.status === "completed") {
          console.log("🏁 Game is completed, redirecting");
          router.push("/game");
          return;
        }

        // Convert database record to GAME type
        const gametype: GAME = {
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

        console.log("✅ Game loaded successfully:", gametype);
        setgame(gametype);
        setloading(false);
      } catch (err) {
        console.error("❌ Unexpected error initializing game:", err);
        seterror("Failed to load game");
        setloading(false);
      }
    };

    INITIALIZE_GAME();
  }, [gameid, supabase, router]);

  const HANDLE_END_GAME = () => {
    // If this game is part of a tournament, go back to the bracket view
    if (game?.is_part_of_tournament && game?.tournament_id) {
      console.log("🏁 Ending game, redirecting to tournament view");
      router.push(`/game/tournament/view?id=${encodeURIComponent(game.tournament_id)}`);
    } else {
      console.log("🏁 Ending game, redirecting to game list");
      router.push("/game");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
          }}
        />
        <BubblesBackground />
        <div className="relative z-10 text-center">
          <div className="text-xl font-semibold text-white mb-4">Loading game...</div>
          <div className="text-sm text-white opacity-70">🎮 Setting up realtime connection...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
          }}
        />
        <BubblesBackground />
        <div className="relative z-10 text-center">
          <div className="text-xl font-semibold text-white mb-4">❌ {error}</div>
          <div className="text-sm text-white opacity-70">Redirecting to game list...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
          }}
        />
        <BubblesBackground />
        <div className="relative z-10 text-center">
          <div className="text-xl font-semibold text-white mb-4">Game not found</div>
          <div className="text-sm text-white opacity-70">Redirecting to game list...</div>
        </div>
      </div>
    );
  }

  return <GAME_VIEW game={game} onEndGame={HANDLE_END_GAME} />;
}
