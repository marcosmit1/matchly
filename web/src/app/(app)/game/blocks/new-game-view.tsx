"use client";

import { useState, useEffect } from "react";
import { PLAYER, GAME, CUP_FORMATION_TYPE, USER } from "@/types/game";
import { CREATE_GAME } from "../actions";
import { useRouter } from "next/navigation";

import { PingPongTable } from "./ping-pong-table";
import { TeamButton } from "./team-button";
import { AddPlayerSheet } from "./add-player-sheet";
import { Button } from "@/blocks/button";
import { X } from "lucide-react";

interface NEW_GAME_VIEW_PROPS {
  user: USER;
}

export function NEW_GAME_VIEW({ user }: NEW_GAME_VIEW_PROPS) {
  const router = useRouter();
  const [team1players, setteam1players] = useState<PLAYER[]>([]);
  const [team2players, setteam2players] = useState<PLAYER[]>([]);
  const [selectedteam, setselectedteam] = useState<1 | 2>(1);
  const [showaddplayer, setshowaddplayer] = useState(false);
  const [isstartinggame, setisstartinggame] = useState(false);
  const [selectedcupformation, setselectedcupformation] = useState<CUP_FORMATION_TYPE>(CUP_FORMATION_TYPE.sixCups);

  // Prevent scrolling on this screen
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Allow pinch zoom
      e.preventDefault();
    };
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    window.addEventListener('scroll', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      window.removeEventListener('scroll', preventDefault);
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventDefault);
    };
  }, []);

  const HANDLE_ADD_PLAYER = (team: 1 | 2) => {
    setselectedteam(team);
    setshowaddplayer(true);
  };

  const HANDLE_PLAYER_ADDED = (player: PLAYER) => {
    if (selectedteam === 1) {
      setteam1players((prev) => [...prev, player]);
    } else {
      setteam2players((prev) => [...prev, player]);
    }
  };

  const HANDLE_EXIT = () => {
    router.push("/");
  };

  const HANDLE_REMOVE_PLAYER = (playerid: string) => {
    setteam1players((prev) => prev.filter((p) => p.id !== playerid));
    setteam2players((prev) => prev.filter((p) => p.id !== playerid));
  };

  const allplayers = [...team1players, ...team2players];

  const HANDLE_START_GAME = async () => {
    if (team1players.length === 0 || team2players.length === 0) return;

    setisstartinggame(true);
    try {
      const { gameid } = await CREATE_GAME(team1players, team2players, selectedcupformation);
      router.push(`/game/${gameid}`);
    } catch (error) {
      console.error("Error creating game:", error);
    } finally {
      setisstartinggame(false);
    }
  };

  return (
    <div className="absolute-no-scroll">
      {/* Header */}
      <div className="relative pt-8 sm:pt-12 pb-4 text-center px-4">
        <button
          onClick={HANDLE_EXIT}
          aria-label="Close"
          className="absolute left-4 top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
        >
          <X size={18} />
        </button>
        <h1 className="text-4xl font-bold mb-2 text-white">New Games</h1>
        <p className="text-md opacity-70 text-white">Set up your teams</p>
      </div>

      {/* Cup Formation Selector */}
      <div className="px-4 pb-3 justify-center items-center w-full flex">
        <div className="flex gap-2">
          <button
            onClick={() => setselectedcupformation(CUP_FORMATION_TYPE.sixCups)}
            className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedcupformation === CUP_FORMATION_TYPE.sixCups ? "text-white shadow-lg" : "text-white text-opacity-70"
            }`}
            style={{
              background:
                selectedcupformation === CUP_FORMATION_TYPE.sixCups
                  ? "linear-gradient(to bottom right, #2c2c2c, #463e3f)"
                  : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: selectedcupformation === CUP_FORMATION_TYPE.sixCups ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
            }}
          >
            6 Cups
          </button>
          <button
            onClick={() => setselectedcupformation(CUP_FORMATION_TYPE.tenCups)}
            className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedcupformation === CUP_FORMATION_TYPE.tenCups ? "text-white shadow-lg" : "text-white text-opacity-70"
            }`}
            style={{
              background:
                selectedcupformation === CUP_FORMATION_TYPE.tenCups
                  ? "linear-gradient(to bottom right, #2c2c2c, #463e3f)"
                  : "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: selectedcupformation === CUP_FORMATION_TYPE.tenCups ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
            }}
          >
            10 Cups
          </button>
        </div>
      </div>

      {/* Ping Pong Table */}
      <div className="px-4">
        <PingPongTable
          team1players={team1players}
          team2players={team2players}
          selectedcupformation={selectedcupformation}
          onRemovePlayer={HANDLE_REMOVE_PLAYER}
        />
      </div>

      {/* Team Buttons */}
      <div className="px-4 py-4">
        <div className="flex gap-3 w-full">
          <TeamButton
            title="Team 1"
            playercount={team1players.length}
            maxplayers={2}
            disabled={team1players.length >= 2}
            onPress={() => HANDLE_ADD_PLAYER(1)}
          />
          <TeamButton
            title="Team 2"
            playercount={team2players.length}
            maxplayers={2}
            disabled={team2players.length >= 2}
            onPress={() => HANDLE_ADD_PLAYER(2)}
          />
        </div>
      </div>

      {/* Start Game Button */}
      <div className="px-4 pb-6 sm:pb-8 absolute bottom-0 left-0 right-0">
        <Button
          onClick={HANDLE_START_GAME}
          disabled={team1players.length === 0 || team2players.length === 0 || isstartinggame}
          className={`h-[50px] w-full py-3 ${
            team1players.length === 0 || team2players.length === 0 || isstartinggame ? "opacity-50 cursor-not-allowed" : "active:scale-95"
          }`}
          variant="pongbros-primary"
        >
          {isstartinggame ? "Starting Game..." : "Start Game"}
        </Button>
      </div>

      {/* Add Player Sheet */}
      {showaddplayer && (
        <AddPlayerSheet
          isopen={showaddplayer}
          onClose={() => setshowaddplayer(false)}
          onPlayerAdded={HANDLE_PLAYER_ADDED}
          existingplayers={allplayers}
          maxplayers={2}
          currentteamcount={selectedteam === 1 ? team1players.length : team2players.length}
          user={user}
        />
      )}
    </div>
  );
}
