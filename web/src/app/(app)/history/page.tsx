import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { gamecolors } from "@/lib/game-theme";

interface GAME_HISTORY {
  id: string;
  team1: {
    score: number;
    players: Array<{ name: string }>;
    team_name: string;
  };
  team2: {
    score: number;
    players: Array<{ name: string }>;
    team_name: string;
  };
  winner: number;
  created_at: string;
  cup_formation: string;
}

interface GAME_CARD_PROPS {
  game: GAME_HISTORY;
}

interface ACTIVE_GAME_CARD_PROPS {
  game: GAME_HISTORY;
}

function GAME_CARD({ game }: GAME_CARD_PROPS) {
  const gamedate = new Date(game.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const gametime = new Date(game.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className="rounded-2xl p-4 mb-4 mx-4"
      style={{
        background: `linear-gradient(135deg, ${gamecolors.accent}30, ${gamecolors.accent}20)`,
        border: `1.5px solid ${gamecolors.secondary}20`,
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm" style={{ color: `${gamecolors.secondary}80` }}>
          {gamedate} • {gametime} • {game.cup_formation} cups
        </div>
      </div>

      {/* Score Layout */}
      <div className="flex items-center justify-between mb-2">
        {/* Left Team Score */}
        <div className="text-center flex-1">
          <div
            className="text-4xl font-black mb-1"
            style={{
              backgroundImage:
                game.winner === 1
                  ? `linear-gradient(to bottom, ${gamecolors.cup}, ${gamecolors.cup}cc)`
                  : `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: game.winner === 1 ? "0 0 20px rgba(255, 215, 0, 0.5)" : "none",
            }}
          >
            {game.team1.score}
          </div>
          <div
            className="text-xs font-medium mb-1"
            style={{
              color: game.winner === 1 ? gamecolors.cup : `${gamecolors.secondary}80`,
            }}
          >
            {game.winner === 1 && "🏆 "}
            {game.team1.team_name}
          </div>
          <div className="text-xs" style={{ color: `${gamecolors.secondary}60` }}>
            {game.team1.players.map((player) => player.name).join(", ")}
          </div>
        </div>

        {/* VS in middle */}
        <div className="px-4">
          <div
            className="text-sm font-bold"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VS
          </div>
        </div>

        {/* Right Team Score */}
        <div className="text-center flex-1">
          <div
            className="text-4xl font-black mb-1"
            style={{
              backgroundImage:
                game.winner === 2
                  ? `linear-gradient(to bottom, ${gamecolors.cup}, ${gamecolors.cup}cc)`
                  : `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: game.winner === 2 ? "0 0 20px rgba(255, 215, 0, 0.5)" : "none",
            }}
          >
            {game.team2.score}
          </div>
          <div
            className="text-xs font-medium mb-1"
            style={{
              color: game.winner === 2 ? gamecolors.cup : `${gamecolors.secondary}80`,
            }}
          >
            {game.winner === 2 && "🏆 "}
            {game.team2.team_name}
          </div>
          <div className="text-xs" style={{ color: `${gamecolors.secondary}60` }}>
            {game.team2.players.map((player) => player.name).join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function ACTIVE_GAME_CARD({ game }: ACTIVE_GAME_CARD_PROPS) {
  const gamedate = new Date(game.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const gametime = new Date(game.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Link href={`/game/${game.id}`}>
      <div
        className="rounded-2xl p-4 mb-4 mx-4 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${gamecolors.accent}60, ${gamecolors.accent}40)`,
          border: `1.5px solid ${gamecolors.cup}60`,
          backdropFilter: "blur(20px)",
          boxShadow: `0 8px 32px ${gamecolors.cup}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm" style={{ color: gamecolors.secondary }}>
            {gamedate} • {gametime} • {game.cup_formation} cups
          </div>
          <div
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              color: gamecolors.secondary,
              backgroundColor: `${gamecolors.cup}20`,
            }}
          >
            ACTIVE
          </div>
        </div>

        {/* Score Layout */}
        <div className="flex items-center justify-between mb-2">
          {/* Left Team Score */}
          <div className="text-center flex-1">
            <div
              className="text-4xl font-black mb-1"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${gamecolors.cup}, ${gamecolors.cup}cc)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
              }}
            >
              {game.team1.score}
            </div>
            <div className="text-xs font-medium mb-1" style={{ color: gamecolors.secondary }}>
              {game.team1.team_name}
            </div>
            <div className="text-xs" style={{ color: `${gamecolors.secondary}cc` }}>
              {game.team1.players.map((player) => player.name).join(", ")}
            </div>
          </div>

          {/* VS in middle */}
          <div className="px-4">
            <div
              className="text-sm font-bold"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              VS
            </div>
          </div>

          {/* Right Team Score */}
          <div className="text-center flex-1">
            <div
              className="text-4xl font-black mb-1"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${gamecolors.cup}, ${gamecolors.cup}cc)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
              }}
            >
              {game.team2.score}
            </div>
            <div className="text-xs font-medium mb-1" style={{ color: gamecolors.secondary }}>
              {game.team2.team_name}
            </div>
            <div className="text-xs" style={{ color: `${gamecolors.secondary}cc` }}>
              {game.team2.players.map((player) => player.name).join(", ")}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs" style={{ color: `${gamecolors.secondary}80` }}>
            👆 Tap to rejoin game
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function HISTORY_PAGE() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authuser },
  } = await supabase.auth.getUser();

  if (!authuser) {
    redirect("/login");
  }

  // Fetch active games from database
  const { data: activegames, error: activeerror } = await supabase
    .from("games")
    .select("*")
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  if (activeerror) {
    console.error("Error fetching active games:", activeerror);
  }

  // Fetch completed games from database
  const { data: completedgames, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching game history:", error);
  }

  const activehistory: GAME_HISTORY[] = activegames || [];
  const gamehistory: GAME_HISTORY[] = completedgames || [];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 pt-6 pb-4 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Games</h1>
          <p className="text-white/70 text-sm">
            {activehistory.length > 0 && `${activehistory.length} active • `}
            {gamehistory.length} completed games
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto pb-6">

        {/* Active Games Section */}
        {activehistory.length > 0 && (
          <div className="mb-6">
            <div className="text-white font-semibold text-sm mb-3 mx-4">Active Games</div>
            <div className="space-y-0">
              {activehistory.map((game) => (
                <ACTIVE_GAME_CARD key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Games Section */}
        {gamehistory.length > 0 && (
          <div>
            <div className="text-white font-semibold text-sm mb-3 mx-4">Game History</div>
            <div className="space-y-0">
              {gamehistory.map((game) => (
                <GAME_CARD key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}

          {/* Empty State */}
          {activehistory.length === 0 && gamehistory.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/50 text-lg mb-2">🏓</div>
              <div className="text-white/70 text-sm">No games yet. Start playing to see your history!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
