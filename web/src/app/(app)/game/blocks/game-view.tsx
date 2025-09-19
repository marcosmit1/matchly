"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GAME } from "@/types/game";
import { gamecolors } from "@/lib/game-theme";
import { formatPlayerName, formatDisplayName } from "@/lib/player-utils";
// import BubblesBackground from "@/components/bubbles-background"; // Removed - component not found
import Lottie from "lottie-react";
import { ChevronLeft } from "lucide-react";
import { UPDATE_GAME_STATE, LOG_GAME_EVENT, UPDATE_PLAYER_STATS, UPDATE_FINAL_GAME_STATS, ADVANCE_TOURNAMENT_AFTER_GAME } from "../actions";
import { USE_REALTIME_GAME } from "@/hooks/use-realtime-game";
import { createClient } from "@/supabase/client";
import { REDEMPTION_VIEW } from "./redemption-view";

const lottie_hit = "/lottie/wired-lineal-458-goal-target-hover-hit.json";
const lottie_miss = "/lottie/wired-lineal-38-error-cross-simple-hover-wobble.json";
const lottie_catch = "/lottie/wired-lineal-1092-applause-hover-pinch.json";
const lottie_celebration = "/lottie/wired-lineal-502-two-glasses-pint-beer-hover-pinch.json";

function USE_LOTTIE_ANIMATION(url: string) {
  const [data, setdata] = useState<object | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (mounted) setdata(json);
      });
    return () => {
      mounted = false;
    };
  }, [url]);
  return data;
}

interface GAME_VIEW_PROPS {
  game: GAME;
  onEndGame: () => void;
}

interface SCORE_NUMBER_PROPS {
  number: number;
  isHighlighted: boolean;
}

const SCORE_NUMBER = React.memo(({ number, isHighlighted }: SCORE_NUMBER_PROPS) => {
  const style = useMemo(
    () => ({
      backgroundImage: isHighlighted
        ? `linear-gradient(to bottom, ${gamecolors.cup}, ${gamecolors.cup}cc)`
        : `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: isHighlighted ? "0 0 20px rgba(255, 215, 0, 0.5)" : "none",
    }),
    [isHighlighted]
  );

  return (
    <div
      className={`text-6xl font-black transition-all duration-300 ${isHighlighted ? "scale-110" : "scale-100"}`}
      style={style}
    >
      {number}
    </div>
  );
});

SCORE_NUMBER.displayName = "SCORE_NUMBER";

function ACTION_BUTTON({
  title,
  lottie,
  color,
  onClick,
  disabled = false,
}: {
  title: string;
  lottie: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const animationdata = USE_LOTTIE_ANIMATION(lottie);
  const [shouldplay, setshouldplay] = useState(false);

  const HANDLE_CLICK = () => {
    if (!disabled) {
      setshouldplay(true);
      onClick();
    }
  };

  const HANDLE_ANIMATION_COMPLETE = () => {
    setshouldplay(false);
  };

  return (
    <button
      onClick={HANDLE_CLICK}
      disabled={disabled}
      className={`flex-1 h-auto pt-2 pb-3 flex flex-col items-center justify-center gap-1 rounded-2xl text-white font-semibold transition-all duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        background: disabled ? "rgba(255, 255, 255, 0.1)" : `linear-gradient(135deg, ${color}50, ${color}30)`,
        border: `1.5px solid ${color}40`,
        boxShadow: disabled ? "none" : `0 8px 16px ${color}30, 0 0 0 1px rgba(255,255,255,0.1) inset`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ width: 45, height: 45 }}>
        {animationdata && (
          <Lottie
            animationData={animationdata}
            loop={false}
            autoplay={shouldplay}
            onComplete={HANDLE_ANIMATION_COMPLETE}
            style={{ width: 45, height: 45 }}
            key={shouldplay ? "playing" : "idle"}
          />
        )}
      </div>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
}

// Confetti Component
function CONFETTI_VIEW() {
  const [particles, setparticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    console.log("🎉 CONFETTI_VIEW mounted and creating particles");
    const newparticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: [gamecolors.cup, gamecolors.secondary, gamecolors.main][Math.floor(Math.random() * 3)],
    }));
    setparticles(newparticles);

    const timer = setTimeout(() => {
      console.log("🎉 Clearing confetti particles");
      setparticles([]);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  console.log("🎉 CONFETTI_VIEW rendering with", particles.length, "particles");

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animation: `confetti-fall 3s linear forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// Hit Celebration Component
function HIT_CELEBRATION({ playername, oncomplete }: { playername: string; oncomplete: () => void }) {
  const [isvisible, setisvisible] = useState(false);
  const celebrationanimation = USE_LOTTIE_ANIMATION(lottie_celebration);

  useEffect(() => {
    // Start the animation
    setisvisible(true);

    // Auto-complete after animation duration (4 seconds total)
    const timer = setTimeout(() => {
      setisvisible(false);
      setTimeout(oncomplete, 300); // Small delay for fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [oncomplete]);

  if (!celebrationanimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${isvisible ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
      />

      <div
        className={`relative z-10 text-center transition-all duration-500 ${
          isvisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {/* Lottie Animation */}
        <div className="flex justify-center mb-8">
          <Lottie
            animationData={celebrationanimation}
            loop={true}
            autoplay={true}
            style={{ width: 200, height: 200 }}
          />
        </div>

        {/* Player drink message */}
        <div className="space-y-2">
          <div
            className="text-4xl font-bold leading-tight px-4"
            style={{
              color: gamecolors.secondary,
              textShadow: `0 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px ${gamecolors.secondary}40`,
              filter: "brightness(1.2)",
            }}
          >
            {playername}, drink up!
          </div>
        </div>
      </div>
    </div>
  );
}

// Miss Celebration Component
function MISS_CELEBRATION({ playername, oncomplete }: { playername: string; oncomplete: () => void }) {
  const [isvisible, setisvisible] = useState(false);
  const missanimation = USE_LOTTIE_ANIMATION(lottie_miss);

  useEffect(() => {
    // Start the animation
    setisvisible(true);

    // Auto-complete after animation duration (shorter than hit - 1.5 seconds)
    const timer = setTimeout(() => {
      setisvisible(false);
      setTimeout(oncomplete, 300); // Small delay for fade out
    }, 1500);

    return () => clearTimeout(timer);
  }, [oncomplete]);

  if (!missanimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${isvisible ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
      />

      <div
        className={`relative z-10 text-center transition-all duration-500 ${
          isvisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {/* Lottie Animation */}
        <div className="flex justify-center mb-8">
          <Lottie
            animationData={missanimation}
            loop={true}
            autoplay={true}
            style={{ width: 200, height: 200 }}
          />
        </div>

        {/* Miss message */}
        <div className="space-y-2">
          <div
            className="text-4xl font-bold leading-tight px-4"
            style={{
              color: "#ef4444", // Red color for miss
              textShadow: `0 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px #ef444440`,
              filter: "brightness(1.2)",
            }}
          >
            Miss!
          </div>
          <div
            className="text-xl font-medium px-4"
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
            }}
          >
            {playername ? `${playername}'s turn` : "Next player's turn"}
          </div>
        </div>
      </div>
    </div>
  );
}

// Catch Celebration Component
function CATCH_CELEBRATION({ playername, oncomplete }: { playername: string; oncomplete: () => void }) {
  const [isvisible, setisvisible] = useState(false);
  const celebrationanimation = USE_LOTTIE_ANIMATION(lottie_celebration);

  useEffect(() => {
    // Start the animation
    setisvisible(true);

    // Auto-complete after animation duration (4 seconds total)
    const timer = setTimeout(() => {
      setisvisible(false);
      setTimeout(oncomplete, 300); // Small delay for fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [oncomplete]);

  if (!celebrationanimation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${isvisible ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
      />

      <div
        className={`relative z-10 text-center transition-all duration-500 ${
          isvisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {/* Lottie Animation */}
        <div className="flex justify-center mb-8">
          <Lottie
            animationData={celebrationanimation}
            loop={true}
            autoplay={true}
            style={{ width: 200, height: 200 }}
          />
        </div>

        {/* Player drink message for catch */}
        <div className="space-y-2">
          <div
            className="text-4xl font-bold leading-tight"
            style={{
              color: gamecolors.secondary,
              textShadow: `0 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px ${gamecolors.secondary}40`,
              filter: "brightness(1.2)",
            }}
          >
            Caught! {playername}, drink up!
          </div>
        </div>
      </div>
    </div>
  );
}

export function GAME_VIEW({ game, onEndGame }: GAME_VIEW_PROPS) {
  // Use realtime hook for game state management
  const {
    game: currentgame,
    isConnected: realtimeconnected,
    connectionError: realtimeerror,
    refetchGame: REFETCH_GAME,
    latestUIEvent: latestuievent,
    triggerUIEvent: TRIGGER_UI_EVENT,
    applyOptimisticUpdate: APPLY_OPTIMISTIC_UPDATE,
  } = USE_REALTIME_GAME(game.id, game);

  const [previousgamestate, setpreviousgamestate] = useState<{
    team1score: number;
    team2score: number;
    currentteam: number;
    currentplayerindex: number;
  } | null>(null);
  const [canundo, setcanundo] = useState(false);
  const [undotimer, setundotimer] = useState<NodeJS.Timeout | null>(null);
  const [undoremainingtime, setundoremainingtime] = useState(5000);
  const [undostarttime, setundostarttime] = useState<number | null>(null);
  const [showhitcelebration, setshowhitcelebration] = useState(false);
  const [showmisscelebration, setshowmisscelebration] = useState(false);
  const [showcatchcelebration, setshowcatchcelebration] = useState(false);
  const [team1drinkingindex, setteam1drinkingindex] = useState(0);
  const [team2drinkingindex, setteam2drinkingindex] = useState(0);
  const [currentdrinkingplayer, setcurrentdrinkingplayer] = useState("");
  const [catchdrinkingplayer, setcatchdrinkingplayer] = useState("");
  const [nextplayername, setnextplayername] = useState("");
  const [showconfetti, setshowconfetti] = useState(false);

  // Redemption mode state
  const [isredemptionmode, setisredemptionmode] = useState(false);
  const [redemptionteam, setredemptionteam] = useState<1 | 2 | null>(null);
  const [winningshotteam, setwinningshotteam] = useState<1 | 2 | null>(null);
  const [team1redemptionused, setteam1redemptionused] = useState(false);
  const [team2redemptionused, setteam2redemptionused] = useState(false);
  const [showredemptionview, setshowredemptionview] = useState(false);

  // Island mode state
  const [playerislandcalls, setplayerislandcalls] = useState<Record<string, number>>({});
  const [islandmodeactive, setislandmodeactive] = useState(false);
  const [islandcallingplayer, setislandcallingplayer] = useState("");

  // Load celebration animation (must be at top level for React hooks rules)
  const celebrationanimationdata = USE_LOTTIE_ANIMATION(lottie_celebration);

  // Initialize drinking indices when game loads
  useEffect(() => {
    // Reset drinking rotation for both teams when game starts/changes
    setteam1drinkingindex(0);
    setteam2drinkingindex(0);
    // Reset redemption and island state
    setisredemptionmode(false);
    setredemptionteam(null);
    setwinningshotteam(null);
    setteam1redemptionused(false);
    setteam2redemptionused(false);
    setplayerislandcalls({});
    setislandmodeactive(false);
    setislandcallingplayer("");
  }, [game.id]);

  // Calculate total cups based on formation from game data
  const totalcups = game.total_cups_per_team;
 
  // Safely derive current player info (works even if currentgame is null)
  const activeteamnumber = currentgame
    ? isredemptionmode && redemptionteam
      ? redemptionteam
      : currentgame.current_team
    : 1;
  const activeplayerindex = currentgame ? (isredemptionmode && redemptionteam ? 0 : currentgame.current_player_index) : 0;
  const activeteamplayers = currentgame
    ? activeteamnumber === 1
      ? currentgame.team1.players
      : currentgame.team2.players
    : [];
  const currentplayer = activeteamplayers.length > 0
    ? activeteamplayers[activeplayerindex % activeteamplayers.length]
    : null;
  const currentplayername = formatPlayerName(currentplayer);

  // Undo timer management functions
  const PAUSE_UNDO_TIMER = useCallback(() => {
    if (undotimer && undostarttime) {
      const elapsedtime = Date.now() - undostarttime;
      const remainingtime = Math.max(0, undoremainingtime - elapsedtime);
      setundoremainingtime(remainingtime);
      clearTimeout(undotimer);
      setundotimer(null);
      setundostarttime(null);
    }
  }, [undotimer, undostarttime, undoremainingtime]);

  const RESUME_UNDO_TIMER = useCallback(() => {
    if (canundo && !undotimer && undoremainingtime > 0) {
      setundostarttime(Date.now());
      const timer = setTimeout(() => {
        setcanundo(false);
        setundotimer(null);
        setundostarttime(null);
      }, undoremainingtime);
      setundotimer(timer);
    }
  }, [canundo, undotimer, undoremainingtime]);

  // Save previous state for undo
  const SAVE_PREVIOUS_STATE = useCallback(() => {
    if (!currentgame) return;

    setpreviousgamestate({
      team1score: currentgame.team1.score,
      team2score: currentgame.team2.score,
      currentteam: currentgame.current_team,
      currentplayerindex: currentgame.current_player_index,
    });

    // Clear existing timer
    if (undotimer) {
      clearTimeout(undotimer);
    }

    setcanundo(true);
    setundoremainingtime(5000);
    setundostarttime(Date.now());

    // Set new timer
    const timer = setTimeout(() => {
      setcanundo(false);
      setundotimer(null);
      setundostarttime(null);
    }, 5000);
    setundotimer(timer);
  }, [currentgame, undotimer]);

  // Handle undo - now uses database update instead of local state
  const HANDLE_UNDO = useCallback(async () => {
    if (!currentgame || !previousgamestate) return;

    try {
      await UPDATE_GAME_STATE(currentgame.id, {
        team1: { ...currentgame.team1, score: previousgamestate.team1score },
        team2: { ...currentgame.team2, score: previousgamestate.team2score },
        current_team: previousgamestate.currentteam,
        current_player_index: previousgamestate.currentplayerindex,
        updated_at: new Date().toISOString(),
      });

      // The realtime hook will automatically update the UI
      setcanundo(false);
      setpreviousgamestate(null);
      setundoremainingtime(5000);
      setundostarttime(null);
      if (undotimer) {
        clearTimeout(undotimer);
        setundotimer(null);
      }
    } catch (error) {
      console.error("Failed to undo game state:", error);
      // Optionally show error to user
    }
  }, [currentgame, previousgamestate, undotimer]);

  // Keep track of processed events to avoid duplicates
  const processedeventsref = useRef<Set<number>>(new Set());

  // Handle UI events from realtime
  useEffect(() => {
    if (!latestuievent) return;

    const eventid = latestuievent.data.timestamp;

    // Check if we've already processed this event
    if (processedeventsref.current.has(eventid)) {
      console.log("🔄 Skipping already processed event:", eventid);
      return;
    }

    console.log("🎬 Processing NEW UI event:", latestuievent, "with ID:", eventid);

    // Mark this event as processed
    processedeventsref.current.add(eventid);

    switch (latestuievent.type) {
      case "hit_celebration":
        {
          const displayName = latestuievent.data.playername || latestuievent.data.drinking_player || "Player";
          console.log("🍺 Showing hit celebration for:", displayName);
          setcurrentdrinkingplayer(formatDisplayName(displayName));
        }
        setshowhitcelebration(true);
        PAUSE_UNDO_TIMER();
        break;

      case "catch_celebration":
        {
          const displayName = latestuievent.data.playername || latestuievent.data.drinking_player || "Player";
          console.log("🤚 Showing catch celebration for:", displayName);
          setcatchdrinkingplayer(formatDisplayName(displayName));
        }
        setshowcatchcelebration(true);
        PAUSE_UNDO_TIMER();
        break;

      case "miss_celebration":
        {
          const nextPlayer = latestuievent.data.nextplayername || "";
          console.log("❌ Showing miss celebration for next player:", nextPlayer);
          setnextplayername(formatDisplayName(nextPlayer));
        }
        setshowmisscelebration(true);
        PAUSE_UNDO_TIMER();
        break;

      case "redemption_start":
        console.log("🍺 Entering redemption mode");
        setisredemptionmode(true);
        setredemptionteam(latestuievent.data.redemptionteam);
        setwinningshotteam(latestuievent.data.winningteam);
        setshowredemptionview(true);
        break;

      case "redemption_end":
        console.log("🏁 Exiting redemption mode, successful:", latestuievent.data.successful);
        console.log("🏁 Event data:", latestuievent);
        setisredemptionmode(false);
        setredemptionteam(null);
        setwinningshotteam(null);
        setshowredemptionview(false); // Make sure to hide the view
        if (latestuievent.data.successful) {
          // Mark redemption as used for the team that used it
          // Use the team_number from the event (which team logged the redemption_end event)
          const redemptionTeamUsed = latestuievent.team_number;
          console.log("🏁 Marking redemption as used for team:", redemptionTeamUsed);
          if (redemptionTeamUsed === 1) {
            setteam1redemptionused(true);
            console.log("✅ Team 1 redemption marked as used.");
          } else if (redemptionTeamUsed === 2) {
            setteam2redemptionused(true);
            console.log("✅ Team 2 redemption marked as used.");
          }
        } else {
          // Even if redemption failed, mark it as used (they don't get another chance)
          const redemptionTeamUsed = latestuievent.team_number;
          console.log("🏁 Marking failed redemption as used for team:", redemptionTeamUsed);
          if (redemptionTeamUsed === 1) {
            setteam1redemptionused(true);
            console.log("✅ Team 1 redemption marked as used (failed).");
          } else if (redemptionTeamUsed === 2) {
            setteam2redemptionused(true);
            console.log("✅ Team 2 redemption marked as used (failed).");
          }
        }
        break;

      case "confetti":
        console.log("🎉 Showing confetti");
        setshowconfetti(true);
        break;

      default:
        console.log("❓ Unknown UI event type:", latestuievent.type);
        break;
    }

    // Clean up old processed events (keep only last 50 to prevent memory leak)
    if (processedeventsref.current.size > 50) {
      const eventArray = Array.from(processedeventsref.current);
      const recentEvents = eventArray.slice(-25); // Keep only 25 most recent
      processedeventsref.current = new Set(recentEvents);
    }
  }, [latestuievent, PAUSE_UNDO_TIMER, redemptionteam]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undotimer) {
        clearTimeout(undotimer);
      }
    };
  }, [undotimer]);

  // Get next drinking player (opposing team member who has to drink)
  const GET_NEXT_DRINKING_PLAYER = useCallback(() => {
    if (!currentgame) return "";
    const opposingteam = currentgame.current_team === 1 ? currentgame.team2 : currentgame.team1;
    if (opposingteam.players.length === 1) {
      return formatPlayerName(opposingteam.players[0]);
    }

    // Get current drinking index for opposing team
    // Each team maintains its own drinking rotation independently
    const currentdrinkingindex = currentgame.current_team === 1 ? team2drinkingindex : team1drinkingindex;

    // Get the player who should drink this time (using current index)
    const drinkingplayer = opposingteam.players[currentdrinkingindex];

    // Calculate next drinking index for future hits (cycle through team)
    const nextdrinkingindex = (currentdrinkingindex + 1) % opposingteam.players.length;

    // Update the drinking index for the opposing team for next time
    // This ensures proper rotation: Player A → Player B → Player A → etc.
    if (currentgame.current_team === 1) {
      setteam2drinkingindex(nextdrinkingindex);
    } else {
      setteam1drinkingindex(nextdrinkingindex);
    }

    return formatPlayerName(drinkingplayer);
  }, [currentgame, team2drinkingindex, team1drinkingindex]);

  // Get drinking player for catch (from the shooting team, since they got caught)
  const GET_CATCH_DRINKING_PLAYER = useCallback(() => {
    if (!currentgame) return "";
    const shootingteam = currentgame.current_team === 1 ? currentgame.team1 : currentgame.team2;
    if (shootingteam.players.length === 1) {
      return shootingteam.players[0].name;
    }

    // Get current drinking index for shooting team
    const currentdrinkingindex = currentgame.current_team === 1 ? team1drinkingindex : team2drinkingindex;

    // Get the player who should drink this time
    const drinkingplayer = shootingteam.players[currentdrinkingindex];

    // Calculate next drinking index for future catches
    const nextdrinkingindex = (currentdrinkingindex + 1) % shootingteam.players.length;

    // Update the drinking index for the shooting team for next time
    if (currentgame.current_team === 1) {
      setteam1drinkingindex(nextdrinkingindex);
    } else {
      setteam2drinkingindex(nextdrinkingindex);
    }

    return formatPlayerName(drinkingplayer);
  }, [currentgame, team1drinkingindex, team2drinkingindex]);

  // Check if current player can call island
  const CAN_CALL_ISLAND = useCallback(() => {
    if (!currentgame) return false;
    const playerid = currentplayer?.userId || currentplayer?.id;
    if (!playerid) return false;

    const callsused = playerislandcalls[playerid] || 0;
    const isonlastcup =
      (currentgame.current_team === 1 ? currentgame.team1.score : currentgame.team2.score) >= totalcups - 1;

    return callsused < 1 && !isonlastcup && !isredemptionmode;
  }, [currentplayer?.userId, currentplayer?.id, playerislandcalls, currentgame?.current_team, currentgame?.team1.score, currentgame?.team2.score, totalcups, isredemptionmode]);

  // Handle island call
  const HANDLE_ISLAND_CALL = useCallback(() => {
    const playerid = currentplayer?.userId || currentplayer?.id;
    if (!playerid || !CAN_CALL_ISLAND()) return;

    // Mark island mode as active
    setislandmodeactive(true);
    setislandcallingplayer(formatPlayerName(currentplayer));

    // Update player's island call count
    setplayerislandcalls((prev) => ({
      ...prev,
      [playerid]: (prev[playerid] || 0) + 1,
    }));
  }, [currentplayer?.userId, currentplayer?.id, currentplayer?.name, CAN_CALL_ISLAND, currentgame]);

  // Check if we should enter redemption mode (team about to win)
  const SHOULD_ENTER_REDEMPTION = useCallback((teamscore: number, shootingteam: number) => {
    console.log("🔍 SHOULD_ENTER_REDEMPTION check:", {
      teamscore,
      shootingteam,
      totalcups,
      isredemptionmode,
      team1redemptionused,
      team2redemptionused
    });

    // Don't enter redemption if already in redemption mode
    if (isredemptionmode) {
      console.log("❌ Already in redemption mode");
      return false;
    }

    // Only enter redemption if score reaches or exceeds winning threshold
    if (teamscore < totalcups) {
      console.log("❌ Score not at winning threshold");
      return false;
    }

    // Check if opposing team has already used their redemption
    const opposingteam = shootingteam === 1 ? 2 : 1;
    const opposingteamredemptionused = opposingteam === 1 ? team1redemptionused : team2redemptionused;

    console.log("✅ Should enter redemption:", !opposingteamredemptionused);
    console.log("🔍 Redemption usage check - Team 1 used:", team1redemptionused, "Team 2 used:", team2redemptionused);
    // Only enter redemption if opposing team hasn't used theirs yet
    return !opposingteamredemptionused;
  }, [isredemptionmode, totalcups, team1redemptionused, team2redemptionused]);

  const HANDLE_GAME_COMPLETION = useCallback(async (completedgame: GAME, winningteam: number) => {
    console.log("🏁 HANDLE_GAME_COMPLETION called for game:", completedgame.id, "winner:", winningteam);

    // Ensure the game isn't already marked as completed
    if (completedgame.status === "completed") {
      console.log("Game already completed, skipping completion logic.");
      return;
    }

    const finalgamestate = {
      ...completedgame,
      status: "completed" as const,
      winner: winningteam,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log("🏁 Updating game status to completed in database...");
      // 1. Update the game state to completed
      const updatedgame = await UPDATE_GAME_STATE(completedgame.id, {
        team1: completedgame.team1,
        team2: completedgame.team2,
        status: finalgamestate.status,
        winner: finalgamestate.winner,
        updated_at: finalgamestate.updated_at,
      });

      console.log("🏁 Game status updated successfully:", updatedgame.status);

      // 1.5. Double-check by refetching the game from database to verify update
      const supabase = await createClient();
      const { data: verificationdata, error: verificationerror } = await supabase
        .from("games")
        .select("status, winner")
        .eq("id", completedgame.id)
        .single();

      if (verificationerror) {
        console.error("❌ Error verifying game completion:", verificationerror);
      } else {
        console.log("🔍 Verification - Game status in database:", verificationdata);
      }

      // 2. Log game end event
      const allplayers = [...completedgame.team1.players, ...completedgame.team2.players];
      const registereduser = allplayers.find((p) => p.userId);
      if (registereduser?.userId) {
        await LOG_GAME_EVENT(
          completedgame.id,
          registereduser.userId,
          "game_end",
          winningteam,
          {
            team1_cups: totalcups - completedgame.team1.score,
            team2_cups: totalcups - completedgame.team2.score,
            team1_score: completedgame.team1.score,
            team2_score: completedgame.team2.score,
          },
          { winner: winningteam }
        );
      }

      // 3. Update final player stats
      await UPDATE_FINAL_GAME_STATS(completedgame.id, winningteam);

      // 3.5. If this game is part of a tournament, advance the bracket
      if (completedgame.is_part_of_tournament && completedgame.tournament_id) {
        try {
          console.log("🏆 Advancing tournament bracket for game:", completedgame.id);
          const { data: match } = await supabase
            .from("tournament_matches")
            .select("id, tournament_id, round, match_index, team_a_id, team_b_id")
            .eq("game_id", completedgame.id)
            .maybeSingle();

          if (match) {
            const winnerTeamId = winningteam === 1 ? match.team_a_id : match.team_b_id;

            if (winnerTeamId) {
              // Use the new proper tournament advancement logic
              await ADVANCE_TOURNAMENT_AFTER_GAME(match.tournament_id, match.id, winnerTeamId);
            }
          } else {
            console.warn("⚠️ No tournament match found for game", completedgame.id);
          }
        } catch (e) {
          console.error("❌ Failed to advance tournament bracket:", e);
        }
      }

      // 4. Trigger confetti
      TRIGGER_UI_EVENT({ type: "confetti", data: { timestamp: Date.now() } });

      // 5. Small delay to ensure realtime update processes
      console.log("🏁 Waiting for realtime update to process...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("🏁 Game completion process finished");

      // 6. Auto-redirect for tournament games after a delay to show confetti
      if (completedgame.is_part_of_tournament && completedgame.tournament_id) {
        console.log("🏁 Tournament game completed, redirecting to tournament view in 3 seconds...");
        setTimeout(() => {
          onEndGame();
        }, 3000); // 3 second delay to let players see the celebration
      }
    } catch (error) {
      console.error("❌ Error during game completion:", error);
      // Re-throw the error so calling function knows about the failure
      throw error;
    }
  }, [totalcups, TRIGGER_UI_EVENT]);

  // Auto-fix corrupted state: if a team has reached winning score but game status is not completed
  useEffect(() => {
    if (!currentgame) return;
    const totalcupsLocal = game.total_cups_per_team;
    const team1exceededLocal = currentgame.team1.score > totalcupsLocal;
    const team2exceededLocal = currentgame.team2.score > totalcupsLocal;
    const gamecorruptedLocal = team1exceededLocal || team2exceededLocal;

    if (gamecorruptedLocal && currentgame.status !== "completed") {
      const winner = team1exceededLocal ? 1 : 2;
      HANDLE_GAME_COMPLETION(currentgame, winner).catch((error) => {
        console.error("❌ Failed to auto-complete corrupted game:", error);
      });
    }
  }, [currentgame, game.total_cups_per_team, HANDLE_GAME_COMPLETION]);

  // Handle Hit
  const HANDLE_HIT = useCallback(async () => {
    if (!currentgame) return;

    console.log("🎯 HANDLE_HIT called - Start");
    console.log("Current game state:", {
      currentTeam: currentgame.current_team,
      currentPlayerIndex: currentgame.current_player_index,
      currentPlayer: currentplayer,
      isRedemptionMode: isredemptionmode,
      redemptionTeam: redemptionteam,
    });

    SAVE_PREVIOUS_STATE();

    const newgame = { ...currentgame };
    let shouldenterredemption = false; // Declare variable in function scope

    // Use active team number (accounts for redemption mode)
    const shootingteam = isredemptionmode && redemptionteam ? redemptionteam : currentgame.current_team;

    // Determine points to add (island mode gives +2, normal gives +1)
    const pointstoadd = islandmodeactive ? 2 : 1;

    // Track if redemption was successful (to avoid team switching)
    let redemptionsuccessful = false;

    // Handle redemption shot
    if (isredemptionmode && shootingteam === redemptionteam) {
      // Redemption shot hit! Void the winning shot and continue game
      redemptionsuccessful = true;

      // Redemption team does NOT get points - they just void the winning shot
      // Void the winning shot - subtract 1 from winning team
      if (winningshotteam === 1) {
        newgame.team1.score = Math.max(0, newgame.team1.score - 1);
      } else if (winningshotteam === 2) {
        newgame.team2.score = Math.max(0, newgame.team2.score - 1);
      }

      // Exit redemption mode and continue game (now handled via realtime events)
      // Note: redemption state will be updated via realtime events

      // Set current team to the team that was about to win (now back to 5 points)
      if (winningshotteam) {
        newgame.current_team = winningshotteam;
      
        // Advance to next player in the team that was about to win (normal turn rotation)
        const winningteamdata = winningshotteam === 1 ? newgame.team1 : newgame.team2;
        newgame.current_player_index = (activeplayerindex + 1) % winningteamdata.players.length;
      }

      // Log redemption end event
      if (currentplayer && (currentplayer.userId || currentplayer.id)) {
        const playerid = currentplayer.userId || currentplayer.id!;
        await LOG_GAME_EVENT(
          currentgame.id,
          playerid,
          "redemption_end",
          currentgame.current_team,
          {
            team1_cups: totalcups - newgame.team1.score,
            team2_cups: totalcups - newgame.team2.score,
            team1_score: newgame.team1.score,
            team2_score: newgame.team2.score,
          },
          {
            redemption_successful: true,
            voided_winning_team: winningshotteam,
            island_mode: islandmodeactive,
            points_scored: pointstoadd,
          }
        );
      }
    } else {
      // Normal shot (not redemption)

      // Check if this shot would win the game BEFORE adding points
      const currentscore = shootingteam === 1 ? newgame.team1.score : newgame.team2.score;
      const scoreafterhit = currentscore + pointstoadd;

      // Cap the score at totalcups maximum
      const finalscore = Math.min(scoreafterhit, totalcups);

      // Add the capped points
      if (shootingteam === 1) {
        newgame.team1.score = finalscore;
      } else {
        newgame.team2.score = finalscore;
      }

      // Check if we reached the winning score
      shouldenterredemption = SHOULD_ENTER_REDEMPTION(finalscore, shootingteam);
      console.log("🎯 Win condition check:", {
        finalscore,
        totalcups,
        shootingteam,
        shouldenterredemption,
        team1redemptionused,
        team2redemptionused,
        isredemptionmode,
      });

      if (finalscore >= totalcups && shouldenterredemption) {
        console.log("🎯 ENTERING REDEMPTION MODE!");
        // Enter redemption mode instead of ending game (now handled via realtime events)
        // Switch to redemption team immediately
        newgame.current_team = shootingteam === 1 ? 2 : 1;

        // Set player index for redemption team (start with first player)
        newgame.current_player_index = 0;

        console.log("🎯 Logging redemption_start event...");
        // Log redemption start event
        if (currentplayer && (currentplayer.userId || currentplayer.id)) {
          const playerid = currentplayer.userId || currentplayer.id!;
          await LOG_GAME_EVENT(
            currentgame.id,
            playerid,
            "redemption_start",
            shootingteam, // Shooting team that triggered redemption
            {
              team1_cups: totalcups - newgame.team1.score,
              team2_cups: totalcups - newgame.team2.score,
              team1_score: newgame.team1.score,
              team2_score: newgame.team2.score,
            },
            {
              winning_team: shootingteam,
              redemption_team: shootingteam === 1 ? 2 : 1,
              island_mode: islandmodeactive,
              points_scored: pointstoadd,
            }
          );
          console.log("✅ Redemption start event logged successfully");
        }
        
        // Update game state for redemption and return early to prevent further processing
        try {
          await UPDATE_GAME_STATE(currentgame.id, {
            team1: newgame.team1,
            team2: newgame.team2,
            current_team: newgame.current_team,
            current_player_index: newgame.current_player_index,
            updated_at: new Date().toISOString(),
          });
          console.log("🎯 Redemption game state updated successfully");
        } catch (error) {
          console.error("❌ Failed to update game state for redemption:", error);
        }
        
        console.log("🎯 HANDLE_HIT completed (redemption mode)");
        return; // Exit early to prevent double processing
      } else if (finalscore >= totalcups) {
        // Game ends immediately (no redemption available)
        console.log("🏁 Game won! Final score reached:", finalscore, "Team", shootingteam, "wins!");
        console.log("🏁 shouldenterredemption was false, ending game immediately");
        // Don't set status to completed here - let HANDLE_GAME_COMPLETION do it
        newgame.winner = shootingteam;
        try {
          await HANDLE_GAME_COMPLETION(newgame, shootingteam);
          console.log("🏁 Game completion successful, returning early");
          return; // Exit early to avoid double update
        } catch (error) {
          console.error("❌ Error during game completion:", error);
          // Continue with regular update as fallback
        }
      }
      // Note: Points are already added above with proper capping
    }

    // Get drinking player for celebration (only if not entering redemption mode)
    let drinkingplayer = "";
    if (!shouldenterredemption) {
      drinkingplayer = GET_NEXT_DRINKING_PLAYER();
      if (!drinkingplayer || drinkingplayer.trim().length === 0) {
        // Extra safety: fallback to any opponent player name
        const opp = currentgame.current_team === 1 ? currentgame.team2 : currentgame.team1;
        drinkingplayer = formatPlayerName(opp.players[0]) || "Player";
      }
    }

    // Track shot statistics and events
    console.log("🎯 About to log game event for player:", currentplayer);
    if (currentplayer?.userId) {
      const eventData: any = {
        opposing_team: shootingteam === 1 ? 2 : 1,
        island_mode: islandmodeactive,
        points_scored: pointstoadd,
        redemption_mode: isredemptionmode,
        timestamp: Date.now(),
      };

      // Only include drinking_player if not entering redemption mode
      if (!shouldenterredemption && drinkingplayer) {
        eventData.drinking_player = drinkingplayer;
        console.log("🎯 Logging shot_hit event for REGISTERED USER with drinking player:", drinkingplayer);
      } else {
        console.log("🎯 Logging shot_hit event for REGISTERED USER (no drinking player - redemption mode)");
      }

      // Log shot hit event with island and redemption info (registered users only)
      await LOG_GAME_EVENT(
        currentgame.id,
        currentplayer.userId,
        islandmodeactive ? "island" : "shot_hit",
        shootingteam,
        {
          team1_cups: totalcups - newgame.team1.score,
          team2_cups: totalcups - newgame.team2.score,
          team1_score: newgame.team1.score,
          team2_score: newgame.team2.score,
        },
        eventData
      );

      console.log("🎯 Shot hit game event logged successfully");

      // Update player stats (only for registered users with userId)
      if (currentplayer?.userId) {
        await UPDATE_PLAYER_STATS(currentgame.id, currentplayer.userId, shootingteam, {
          shots_attempted: 1,
          shots_made: 1, // Individual shot success (not team cups)
          ...(isredemptionmode && { redemption_shots: 1 }),
        });
      }
    } else if (currentplayer) {
      console.log("🎯 GUEST PLAYER detected - finding registered user to broadcast event:", {
        guest_id: currentplayer.id,
        guest_name: currentplayer.name,
        drinking_player: drinkingplayer,
      });

      // Find ANY registered user in the game to log the event (so it broadcasts to everyone)
      const allplayers = [...currentgame.team1.players, ...currentgame.team2.players];
      const registereduser = allplayers.find((p) => p.userId);

      if (registereduser?.userId) {
        console.log("🎯 Using registered user to broadcast guest event:", registereduser.name);
        // Log event using registered user but include guest info in event_data
        await LOG_GAME_EVENT(
          currentgame.id,
          registereduser.userId,
          islandmodeactive ? "island" : "shot_hit",
          shootingteam,
          {
            team1_cups: totalcups - newgame.team1.score,
            team2_cups: totalcups - newgame.team2.score,
            team1_score: newgame.team1.score,
            team2_score: newgame.team2.score,
          },
          {
            drinking_player: drinkingplayer,
            opposing_team: shootingteam === 1 ? 2 : 1,
            island_mode: islandmodeactive,
            points_scored: pointstoadd,
            redemption_mode: isredemptionmode,
            timestamp: Date.now(),
            actual_shooter: {
              id: currentplayer.id,
              name: currentplayer.name,
              is_guest: true,
            },
          }
        );
      } else {
        console.log("🚨 NO registered users found - falling back to manual trigger");
        // Fallback: trigger manually if no registered users
        TRIGGER_UI_EVENT({
          type: "hit_celebration",
          data: {
            drinking_player: drinkingplayer,
            playername: drinkingplayer,
            opposing_team: shootingteam === 1 ? 2 : 1,
            island_mode: islandmodeactive,
            points_scored: pointstoadd,
            redemption_mode: isredemptionmode,
            timestamp: Date.now(),
            guest_player: {
              id: currentplayer.id,
              name: currentplayer.name,
              is_guest: true,
            },
          },
        });
      }
    } else {
      console.log("❌ No player found in HANDLE_HIT - cannot log game event");
      console.log("Current player object:", currentplayer);
    }

    // Reset island mode after shot
    if (islandmodeactive) {
      setislandmodeactive(false);
      setislandcallingplayer("");
    }

    // Only update if game is not completed (to avoid overwriting completion status)
    if (newgame.status !== "completed") {
      try {
        // Update in database - realtime hook will automatically update UI
        await UPDATE_GAME_STATE(currentgame.id, {
          team1: newgame.team1,
          team2: newgame.team2,
          current_team: newgame.current_team,
          current_player_index: newgame.current_player_index,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Failed to update game in HANDLE_HIT:", error);
        // Realtime will handle retries, or user can manually refetch
      }
    }

    console.log("🎯 HANDLE_HIT completed");
  }, [
    SAVE_PREVIOUS_STATE,
    currentgame,
    currentplayer,
    isredemptionmode,
    redemptionteam,
    islandmodeactive,
    winningshotteam,
    totalcups,
    GET_NEXT_DRINKING_PLAYER,
    HANDLE_GAME_COMPLETION,
    SHOULD_ENTER_REDEMPTION,
    team1redemptionused,
    team2redemptionused,
    activeplayerindex,
    TRIGGER_UI_EVENT
  ]);

  // Handle Miss
  const HANDLE_MISS = useCallback(async () => {
    if (!currentgame) return;

    const newgame = { ...currentgame };

    // Use active team number (accounts for redemption mode)
    const shootingteam = isredemptionmode && redemptionteam ? redemptionteam : currentgame.current_team;

    // Calculate next player for miss celebration (only if not redemption mode)
    let nextPlayerName = "";
    if (!isredemptionmode) {
      const nextTeamLocal = shootingteam === 1 ? 2 : 1;
      const nextPlayerIndexLocal = (() => {
        const nextteam = nextTeamLocal === 1 ? newgame.team1 : newgame.team2;
        
        // If the next team only has 1 player, always use index 0
        if (nextteam.players.length === 1) {
          return 0;
        }
        
        // For teams with multiple players, alternate between them
        if (nextTeamLocal === 1) {
          return newgame.current_player_index === 0 ? 1 : 0;
        }
        return Math.min(newgame.current_player_index, nextteam.players.length - 1);
      })();
      
      const nextteam = nextTeamLocal === 1 ? newgame.team1 : newgame.team2;
      const nextplayer = nextteam.players[nextPlayerIndexLocal];
      
      // Try multiple approaches to get the player name
      nextPlayerName = formatPlayerName(nextplayer);
      
      // If formatPlayerName returns "Player", try alternatives
      if (nextPlayerName === "Player" && nextplayer) {
        // Try direct name access
        if (nextplayer.name && nextplayer.name.trim()) {
          nextPlayerName = nextplayer.name.trim();
        }
        // Try using formatDisplayName instead
        else if (nextplayer.name) {
          nextPlayerName = formatDisplayName(nextplayer.name);
        }
        // Last resort: use player ID or fallback
        else {
          nextPlayerName = nextplayer.id || "Next Player";
        }
      }
      
      console.log("🎯 Miss: Next player calculation:", {
        currentTeam: shootingteam,
        nextTeam: nextTeamLocal,
        nextPlayerIndex: nextPlayerIndexLocal,
        nextPlayer: nextplayer,
        nextPlayerName: nextPlayerName,
        nextPlayerRaw: JSON.stringify(nextplayer),
        isRegistered: nextplayer?.isRegisteredUser,
        playerId: nextplayer?.id,
        playerUserId: nextplayer?.userId,
        playerNameProp: nextplayer?.name,
        formatPlayerNameResult: formatPlayerName(nextplayer),
        formatDisplayNameResult: nextplayer?.name ? formatDisplayName(nextplayer.name) : "N/A",
        // Team size information
        team1PlayerCount: newgame.team1.players.length,
        team2PlayerCount: newgame.team2.players.length,
        nextTeamPlayerCount: nextteam.players.length,
        // For comparison with current player logic
        currentPlayer: currentplayer,
        currentPlayerName: currentplayername,
        currentPlayerRaw: JSON.stringify(currentplayer)
      });
    }

    // Trigger miss celebration immediately for instant feedback
    TRIGGER_UI_EVENT({
      type: "miss_celebration",
      data: { 
        timestamp: Date.now(),
        nextplayername: nextPlayerName
      }
    });

    SAVE_PREVIOUS_STATE();

    // Handle redemption miss (game ends)
    if (isredemptionmode && shootingteam === redemptionteam) {
      // Redemption failed - game ends, winning team wins - confetti now handled via realtime events
      newgame.status = "completed";
      newgame.winner = winningshotteam || undefined;
      try {
        await HANDLE_GAME_COMPLETION(newgame, newgame.winner as number);
        console.log("🏁 Redemption failure completion successful");
      } catch (error) {
        console.error("❌ Error during redemption failure completion:", error);
      }

      // Log redemption end event (failed)
      if (currentplayer && (currentplayer.userId || currentplayer.id)) {
        const playerid = currentplayer.userId || currentplayer.id!;
        await LOG_GAME_EVENT(
          currentgame.id,
          playerid,
          "redemption_end",
          currentgame.current_team,
          {
            team1_cups: totalcups - newgame.team1.score,
            team2_cups: totalcups - newgame.team2.score,
            team1_score: newgame.team1.score,
            team2_score: newgame.team2.score,
          },
          {
            redemption_successful: false,
            winning_team: winningshotteam,
            island_mode: islandmodeactive,
          }
        );

        // Reset redemption state (now handled via realtime events)
        // Note: redemption state will be updated via realtime events
      }
    }

    // Track shot statistics and events for current player before switching teams
    if (currentplayer && (currentplayer.userId || currentplayer.id)) {
      const playerid = currentplayer.userId || currentplayer.id!;
      // Log shot miss event
      await LOG_GAME_EVENT(
        currentgame.id,
        playerid,
        "shot_miss",
        shootingteam,
        {
          team1_cups: totalcups - currentgame.team1.score,
          team2_cups: totalcups - currentgame.team2.score,
          team1_score: currentgame.team1.score,
          team2_score: currentgame.team2.score,
        },
        {
          island_mode: islandmodeactive,
          redemption_mode: isredemptionmode,
        }
      );

      // Update player stats (only for registered users)
      if (currentplayer.userId) {
        await UPDATE_PLAYER_STATS(currentgame.id, currentplayer.userId, shootingteam, {
          shots_attempted: 1,
          ...(isredemptionmode && { redemption_shots: 1 }),
        });
      }
    }

    // Reset island mode after miss
    if (islandmodeactive) {
      setislandmodeactive(false);
      setislandcallingplayer("");
    }

    // Only switch teams if not in redemption mode or if redemption failed
    if (!isredemptionmode || newgame.status === "completed") {
      // Compute next turn
      const nextTeamLocal = shootingteam === 1 ? 2 : 1;
      const nextPlayerIndexLocal = (() => {
        const nextteam = nextTeamLocal === 1 ? newgame.team1 : newgame.team2;
        if (nextTeamLocal === 1) {
          return newgame.current_player_index === 0 ? 1 : 0;
        }
        return Math.min(newgame.current_player_index, nextteam.players.length - 1);
      })();

      // Optimistic UI: apply immediately
      APPLY_OPTIMISTIC_UPDATE((g) => ({
        ...g,
        current_team: nextTeamLocal,
        current_player_index: nextPlayerIndexLocal,
        updated_at: new Date().toISOString() as unknown as any,
      }));

      // Mutate local copy to persist
      newgame.current_team = nextTeamLocal;
      newgame.current_player_index = nextPlayerIndexLocal;
    }

    // Persist in background, do not block UI switching
    UPDATE_GAME_STATE(currentgame.id, {
      current_team: newgame.current_team,
      current_player_index: newgame.current_player_index,
      status: newgame.status,
      winner: newgame.winner,
      updated_at: new Date().toISOString(),
    }).catch((error) => {
      console.error("Failed to update game:", error);
    });
  }, [
    SAVE_PREVIOUS_STATE,
    currentgame,
    currentplayer,
    isredemptionmode,
    redemptionteam,
    islandmodeactive,
    totalcups,
    winningshotteam,
    HANDLE_GAME_COMPLETION,
    APPLY_OPTIMISTIC_UPDATE,
    TRIGGER_UI_EVENT
  ]);

  // Handle Catch
  const HANDLE_CATCH = useCallback(async () => {
    if (!currentgame) return;

    SAVE_PREVIOUS_STATE();

    const newgame = { ...currentgame };

    // Get the catching player (from opposing team)
    const opposingteam = currentgame.current_team === 1 ? currentgame.team2 : currentgame.team1;
    const catchingplayerindex = Math.floor(Math.random() * opposingteam.players.length); // Random for now
    const catchingplayer = opposingteam.players[catchingplayerindex];

    // Get drinking player from shooting team (they got caught!) - now handled via realtime events
    const drinkingplayer = GET_CATCH_DRINKING_PLAYER();

    // Switch teams and add point to new team
    newgame.current_team = currentgame.current_team === 1 ? 2 : 1;

    if (newgame.current_team === 1) {
      newgame.team1.score += 1;
    } else {
      newgame.team2.score += 1;
    }

    // Check for win condition
    const currentscore = newgame.current_team === 1 ? newgame.team1.score : newgame.team2.score;
    if (currentscore >= totalcups) {
      newgame.status = "completed";
      newgame.winner = newgame.current_team;
      try {
        await HANDLE_GAME_COMPLETION(newgame, newgame.winner);
        console.log("🏁 Catch completion successful, returning early");
        return; // Exit early to avoid double update
      } catch (error) {
        console.error("❌ Error during catch completion:", error);
        // Continue with regular update as fallback
      }
    }

    // Track catch statistics and events
    if (catchingplayer?.userId) {
      console.log("🎯 Logging catch event for REGISTERED USER:", catchingplayer.name);
      // Log catch event with drinking player info (registered users only)
      await LOG_GAME_EVENT(
        currentgame.id,
        catchingplayer.userId,
        "catch",
        newgame.current_team,
        {
          team1_cups: totalcups - newgame.team1.score,
          team2_cups: totalcups - newgame.team2.score,
          team1_score: newgame.team1.score,
          team2_score: newgame.team2.score,
        },
        {
          drinking_player: drinkingplayer,
          shooting_team: currentgame.current_team, // Original shooting team that got caught
          timestamp: Date.now(),
        }
      );

      // Update player stats (only for registered users)
      await UPDATE_PLAYER_STATS(currentgame.id, catchingplayer.userId, newgame.current_team, {
        catches: 1,
      });
    } else if (catchingplayer) {
      console.log("🎯 GUEST PLAYER catch detected - finding registered user to broadcast event:", {
        guest_id: catchingplayer.id,
        guest_name: catchingplayer.name,
        drinking_player: drinkingplayer,
      });

      // Find ANY registered user in the game to log the event (so it broadcasts to everyone)
      const allplayers = [...currentgame.team1.players, ...currentgame.team2.players];
      const registereduser = allplayers.find((p) => p.userId);

      if (registereduser?.userId) {
        console.log("🎯 Using registered user to broadcast guest catch event:", registereduser.name);
        // Log catch event using registered user but include guest info in event_data
        await LOG_GAME_EVENT(
          currentgame.id,
          registereduser.userId,
          "catch",
          newgame.current_team,
          {
            team1_cups: totalcups - newgame.team1.score,
            team2_cups: totalcups - newgame.team2.score,
            team1_score: newgame.team1.score,
            team2_score: newgame.team2.score,
          },
          {
            drinking_player: drinkingplayer,
            shooting_team: currentgame.current_team,
            timestamp: Date.now(),
            actual_catcher: {
              id: catchingplayer.id,
              name: catchingplayer.name,
              is_guest: true,
            },
          }
        );
      } else {
        console.log("🚨 NO registered users found - falling back to manual trigger");
        // Fallback: trigger manually if no registered users
        TRIGGER_UI_EVENT({
          type: "catch_celebration",
          data: {
            drinking_player: drinkingplayer,
            shooting_team: currentgame.current_team,
            timestamp: Date.now(),
            guest_player: {
              id: catchingplayer.id,
              name: catchingplayer.name,
              is_guest: true,
            },
          },
        });
      }
    }

    try {
      // Update in database - realtime hook will automatically update UI
      await UPDATE_GAME_STATE(currentgame.id, {
        current_team: newgame.current_team,
        team1: newgame.team1,
        team2: newgame.team2,
        status: newgame.status,
        winner: newgame.winner,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update game:", error);
      // Realtime will handle retries, or user can manually refetch
    }
  }, [
    SAVE_PREVIOUS_STATE,
    currentgame,
    totalcups,
    GET_CATCH_DRINKING_PLAYER,
    HANDLE_GAME_COMPLETION,
    TRIGGER_UI_EVENT
  ]);

  // Handle Redemption Shot Hit
  const HANDLE_REDEMPTION_HIT = useCallback(async () => {
    if (!currentgame || !redemptionteam) return;

    console.log("🎯 Redemption shot HIT! Team", redemptionteam, "stays in the game");

    // Redemption team does NOT get points - they just void the winning shot
    const newgame = { ...currentgame };
    
    // Void the winning shot - subtract 1 from winning team
    if (winningshotteam === 1) {
      newgame.team1.score = Math.max(0, newgame.team1.score - 1);
    } else if (winningshotteam === 2) {
      newgame.team2.score = Math.max(0, newgame.team2.score - 1);
    }

    // Exit redemption mode and continue game
    // Set current team to the team that was about to win (now back to 5 points)
    if (winningshotteam) {
      newgame.current_team = winningshotteam;
    }
    newgame.current_player_index = 0; // Start with first player

    // Log redemption end event
    if (currentplayer && (currentplayer.userId || currentplayer.id)) {
      const playerid = currentplayer.userId || currentplayer.id!;
      await LOG_GAME_EVENT(
        currentgame.id,
        playerid,
        "redemption_end",
        redemptionteam,
        {
          team1_cups: totalcups - newgame.team1.score,
          team2_cups: totalcups - newgame.team2.score,
          team1_score: newgame.team1.score,
          team2_score: newgame.team2.score,
        },
        {
          redemption_successful: true,
          voided_winning_team: winningshotteam,
          points_scored: 1,
        }
      );
    }

    // Update game state
    try {
      await UPDATE_GAME_STATE(currentgame.id, {
        current_team: newgame.current_team,
        current_player_index: newgame.current_player_index,
        team1: newgame.team1,
        team2: newgame.team2,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update game after redemption hit:", error);
    }

    // Hide redemption view
    setshowredemptionview(false);
  }, [currentgame, redemptionteam, winningshotteam, currentplayer, totalcups]);

  // Handle Redemption Shot Miss
  const HANDLE_REDEMPTION_MISS = useCallback(async () => {
    if (!currentgame || !redemptionteam) return;

    // Trigger miss celebration immediately for instant feedback (no next player - game ends)
    TRIGGER_UI_EVENT({
      type: "miss_celebration",
      data: { 
        timestamp: Date.now(),
        nextplayername: "" // Game ends, no next player
      }
    });

    console.log("❌ Redemption shot MISSED! Game ends");
    console.log("🔍 Current game status when miss handler starts:", currentgame.status);

    // End game with current winning team
    const newgame = { ...currentgame };
    const winner = winningshotteam || 1; // Fallback to team 1 if null

    // Ensure final score is total cups for winning team
    if (winningshotteam === 1) {
      newgame.team1.score = totalcups;
    } else if (winningshotteam === 2) {
      newgame.team2.score = totalcups;
    }

    // Log redemption end event
    if (currentplayer && (currentplayer.userId || currentplayer.id)) {
      const playerid = currentplayer.userId || currentplayer.id!;
      await LOG_GAME_EVENT(
        currentgame.id,
        playerid,
        "redemption_end",
        redemptionteam,
        {
          team1_cups: totalcups - newgame.team1.score,
          team2_cups: totalcups - newgame.team2.score,
          team1_score: newgame.team1.score,
          team2_score: newgame.team2.score,
        },
        {
          redemption_successful: false,
          winning_team: winningshotteam,
        }
      );
    }

    // Complete the game
    try {
      await HANDLE_GAME_COMPLETION(newgame, winner);
    } catch (error) {
      console.error("Error during redemption game completion:", error);
    }

    // Hide redemption view
    setshowredemptionview(false);
  }, [currentgame, redemptionteam, winningshotteam, currentplayer, totalcups, HANDLE_GAME_COMPLETION, TRIGGER_UI_EVENT]);

  // Determine if catch is allowed (can't catch when shooting team is on their last cup/redemption shot)
  const CAN_CATCH = useCallback(() => {
    if (!currentgame) return false;
    const shootingteam = currentgame.current_team === 1 ? currentgame.team1 : currentgame.team2;
    return shootingteam.score < totalcups - 1;
  }, [currentgame, totalcups]);

  // Show loading state if game is null (after hooks are declared)
  if (!currentgame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
          }}
        />
        {/* <BubblesBackground /> - Removed component */}
        <div className="relative z-10 text-center">
          <div className="text-xl font-semibold text-white mb-4">Loading game...</div>
          <div className="text-sm text-white opacity-70">
            {realtimeerror ? `Error: ${realtimeerror}` : "Connecting to realtime..."}
          </div>
        </div>
      </div>
    );
  }

  // Check if game is completed OR if scores exceed total cups (corrupted state)
  const team1exceeded = currentgame.team1.score > totalcups;
  const team2exceeded = currentgame.team2.score > totalcups;
  const gamecorrupted = team1exceeded || team2exceeded;

  if (currentgame.status === "completed" || gamecorrupted) {
    console.log("🏁 Game is completed or corrupted, showing game over screen");
    console.log(
      "Status:",
      currentgame.status,
      "Team1 score:",
      currentgame.team1.score,
      "Team2 score:",
      currentgame.team2.score,
      "Total cups:",
      totalcups
    );

    const winner = currentgame.winner || (team1exceeded ? 1 : team2exceeded ? 2 : null);
    const iswinner =
      currentgame.winner === 1
        ? currentgame.team1.players.some((p) => p.isRegisteredUser)
        : currentgame.team2.players.some((p) => p.isRegisteredUser);

    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
          }}
        />
        {/* <BubblesBackground /> - Removed component */}

        {/* Animated background effects */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl -top-20 -left-20 animate-pulse"
            style={{ background: `${gamecolors.main}40` }}
          />
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl top-40 right-10 animate-pulse"
            style={{ background: `${gamecolors.cup}40` }}
          />
        </div>

        {/* Confetti - now triggered via realtime events */}
        {showconfetti && <CONFETTI_VIEW />}

        {/* Game Over Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center">
          {/* Beer Celebration Animation */}
          <div className="mb-8">
            {celebrationanimationdata && (
              <Lottie
                animationData={celebrationanimationdata}
                loop={true}
                autoplay={true}
                style={{ width: 200, height: 200 }}
              />
            )}
          </div>

          <h1 className="text-5xl font-bold mb-8" style={{ color: gamecolors.secondary }}>
            {iswinner ? "🏆 WINNER!" : "GAME OVER"}
          </h1>

          {iswinner && (
            <p className="text-3xl font-bold mb-8" style={{ color: gamecolors.secondary }}>
              CHEERS! 🍻
            </p>
          )}

          {/* Final Score */}
          <div
            className="p-8 rounded-3xl mb-8"
            style={{
              background: `linear-gradient(135deg, ${gamecolors.accent}50, ${gamecolors.accent}30)`,
              border: `1px solid ${gamecolors.secondary}40`,
              backdropFilter: "blur(20px)",
              boxShadow: `0 0 40px ${gamecolors.cup}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          >
            <p className="text-lg mb-4" style={{ color: gamecolors.secondary }}>
              Final Score
            </p>
            <div className="flex items-center gap-8">
              <SCORE_NUMBER number={currentgame.team1.score} isHighlighted={false} />
              <span className="text-3xl" style={{ color: gamecolors.secondary }}>
                -
              </span>
              <SCORE_NUMBER number={currentgame.team2.score} isHighlighted={false} />
            </div>
          </div>

          {/* Show manual complete button only for corrupted games */}
          {gamecorrupted && currentgame.status !== "completed" && (
            <button
              onClick={async () => {
                const winner = team1exceeded ? 1 : 2;
                console.log("🔧 Manual game completion triggered, winner:", winner);
                try {
                  await HANDLE_GAME_COMPLETION(currentgame, winner);
                  console.log("✅ Manual game completion successful");
                } catch (error) {
                  console.error("❌ Manual game completion failed:", error);
                }
              }}
              className="mt-4 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:opacity-80"
              style={{
                background: `linear-gradient(135deg, ${gamecolors.accent}, ${gamecolors.accent}80)`,
                color: gamecolors.dark,
                border: `1px solid ${gamecolors.secondary}40`,
              }}
            >
              🏁 Complete Game Manually
            </button>
          )}

          <button
            onClick={onEndGame}
            className="mt-4 flex items-center gap-2 transition-all duration-200 hover:opacity-80"
          >
            <ChevronLeft className="text-white" size={20} />
            <span className="text-white underline underline-offset-4">Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, ${gamecolors.dark}, ${gamecolors.main})`,
        }}
      />
      {/* <BubblesBackground /> - Removed component */}

      {/* Animated background effects */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl -top-20 -left-20 animate-pulse"
          style={{ background: `${gamecolors.main}40` }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl top-40 right-10 animate-pulse"
          style={{ background: `${gamecolors.cup}40` }}
        />
      </div>

      {/* Game Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6">
        {/* Score Display */}
        <div className="flex justify-center items-center gap-10 mb-8 pt-16">
          {/* Team 1 Score */}
          <div
            className="flex flex-col items-center p-6 rounded-3xl min-w-32 transition-all duration-300"
            style={{
              background:
                currentgame.current_team === 1
                  ? `linear-gradient(135deg, ${gamecolors.accent}60, ${gamecolors.accent}40)`
                  : `linear-gradient(135deg, ${gamecolors.accent}30, ${gamecolors.accent}20)`,
              border:
                currentgame.current_team === 1
                  ? `1.5px solid ${gamecolors.cup}60`
                  : `1.5px solid ${gamecolors.secondary}20`,
              backdropFilter: "blur(20px)",
              boxShadow:
                currentgame.current_team === 1
                  ? `0 8px 32px ${gamecolors.cup}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : "0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-md font-medium text-center mb-2" style={{ color: gamecolors.secondary }}>
              Team 1
            </p>
            <SCORE_NUMBER number={currentgame.team1.score} isHighlighted={currentgame.current_team === 1} />
          </div>

          {/* VS */}
          <div
            className="text-2xl font-bold"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${gamecolors.secondary}cc, ${gamecolors.secondary}80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VS
          </div>

          {/* Team 2 Score */}
          <div
            className="flex flex-col items-center p-6 rounded-3xl min-w-32 transition-all duration-300"
            style={{
              background:
                currentgame.current_team === 2
                  ? `linear-gradient(135deg, ${gamecolors.accent}60, ${gamecolors.accent}40)`
                  : `linear-gradient(135deg, ${gamecolors.accent}30, ${gamecolors.accent}20)`,
              border:
                currentgame.current_team === 2
                  ? `1.5px solid ${gamecolors.cup}60`
                  : `1.5px solid ${gamecolors.secondary}20`,
              backdropFilter: "blur(20px)",
              boxShadow:
                currentgame.current_team === 2
                  ? `0 8px 32px ${gamecolors.cup}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : "0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-md font-medium text-center mb-2" style={{ color: gamecolors.secondary }}>
              Team 2
            </p>
            <SCORE_NUMBER number={currentgame.team2.score} isHighlighted={currentgame.current_team === 2} />
          </div>
        </div>

        {/* Realtime Connection Status */}
        <div className="flex justify-center mb-4">
          <div
            className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-300"
            style={{
              background: realtimeconnected ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: realtimeconnected ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              color: realtimeconnected ? "#22c55e" : "#ef4444",
            }}
          >
            {realtimeconnected ? "🟢 Live Connected" : "🔴 Connecting..."}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="flex justify-center mb-8">
          <div
            className="px-10 py-4 rounded-3xl transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${gamecolors.accent}50, ${gamecolors.accent}30)`,
              border: `1.5px solid ${gamecolors.cup}40`,
              backdropFilter: "blur(20px)",
              boxShadow: `0 12px 24px ${gamecolors.cup}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          >
            <p className="text-center">
              <span className="text-2xl font-semibold block" style={{ color: gamecolors.secondary }}>
                {currentplayername}&apos;s Turn
              </span>
              <span className="text-md opacity-90" style={{ color: gamecolors.secondary }}>
                Team {currentgame.current_team}
              </span>
            </p>
          </div>
        </div>

        {/* Redemption Mode Indicator */}
        {isredemptionmode && (
          <div className="mb-6 text-center">
            <div
              className="w-fit m-auto px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(45deg, ${gamecolors.main}, ${gamecolors.accent})`,
                color: gamecolors.secondary,
                boxShadow: `0 4px 16px ${gamecolors.main}40`,
              }}
            >
              🍺 Redemption Time! 🍺
            </div>
            <div className="mt-2 text-sm opacity-70 text-white">
              {redemptionteam === 1 ? "Team 1" : "Team 2"} gets a chance to stay in the game!
            </div>
          </div>
        )}

        {/* Island Mode Indicator */}
        {islandmodeactive && (
          <div className="mb-4 text-center">
            <div
              className="w-fit m-auto px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(45deg, #FF6B35, #F7931E)`,
                color: "white",
                boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)",
              }}
            >
              🏝️ Island Mode Active!
            </div>
          </div>
        )}

        {/* Island Call Button */}
        {CAN_CALL_ISLAND() && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={HANDLE_ISLAND_CALL}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(45deg, #FF6B35, #F7931E)",
                boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
              }}
            >
              🏝️ Call Island (+2 if hit!)
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Undo Button - Fixed height to prevent layout shift */}
        <div className="flex justify-center mb-4" style={{ height: "40px" }}>
          {canundo && (
            <button
              onClick={HANDLE_UNDO}
              className="px-6 py-2 rounded-full text-white font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              ↶ Undo
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <ACTION_BUTTON title="Hit!" lottie={lottie_hit} color="#22c55e" onClick={HANDLE_HIT} />
          <ACTION_BUTTON title="Miss" lottie={lottie_miss} color="#ef4444" onClick={HANDLE_MISS} />
          <ACTION_BUTTON
            title="Catch!"
            lottie={lottie_catch}
            color="#f97316"
            onClick={HANDLE_CATCH}
            disabled={!CAN_CATCH()}
          />
        </div>
      </div>

      {/* Hit Celebration Overlay */}
      {showhitcelebration && (
        <HIT_CELEBRATION
          playername={currentdrinkingplayer}
          oncomplete={() => {
            setshowhitcelebration(false);
            RESUME_UNDO_TIMER();
          }}
        />
      )}

      {/* Miss Celebration Overlay */}
      {showmisscelebration && (
        <MISS_CELEBRATION
          playername={nextplayername}
          oncomplete={() => {
            setshowmisscelebration(false);
            RESUME_UNDO_TIMER();
          }}
        />
      )}

      {/* Catch Celebration Overlay */}
      {showcatchcelebration && (
        <CATCH_CELEBRATION
          playername={catchdrinkingplayer}
          oncomplete={() => {
            setshowcatchcelebration(false);
            RESUME_UNDO_TIMER();
          }}
        />
      )}

      {/* Redemption View Overlay */}
      {showredemptionview && currentgame && (
        <REDEMPTION_VIEW
          game={currentgame}
          onHit={HANDLE_REDEMPTION_HIT}
          onMiss={HANDLE_REDEMPTION_MISS}
          onClose={() => setshowredemptionview(false)}
        />
      )}
    </div>
  );
}
