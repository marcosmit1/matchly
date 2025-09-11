"use client";

import { useState, useEffect } from "react";
import { PLAYER, CUP_FORMATION_TYPE } from "@/types/game";
import { formatPlayerName } from "@/lib/player-utils";

interface PING_PONG_TABLE_PROPS {
  team1players: PLAYER[];
  team2players: PLAYER[];
  selectedcupformation: CUP_FORMATION_TYPE;
  onRemovePlayer: (playerid: string) => void;
}

interface CUP_FORMATION_PROPS {
  istop: boolean;
  selectedcupformation: CUP_FORMATION_TYPE;
}

interface PLAYER_BUBBLE_PROPS {
  player: PLAYER;
  onRemove: () => void;
}

function PlayerBubble({ player, onRemove }: PLAYER_BUBBLE_PROPS) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full text-sm"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255, 255, 255, 0.6)" }} />
      <span style={{ color: "#F5F5DC" }}>{formatPlayerName(player)}</span>
      {player.isRegisteredUser && <div className="w-3 h-3 rounded-full bg-green-500" title="Registered User" />}
      <button
        onClick={onRemove}
        className="ml-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
      >
        <span className="text-white text-xs">×</span>
      </button>
    </div>
  );
}

function CupFormation({ istop, selectedcupformation }: CUP_FORMATION_PROPS) {
  const [isanimating, setisanimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setisanimating(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const CIRCLE_WITH_ANIMATION = (delay: number) => (
    <div
      key={delay}
      className={`w-6 h-6 border-2 border-white/50 rounded-full bg-white/5 transition-all duration-500 ease-out ${
        isanimating ? "scale-100 opacity-100" : "scale-50 opacity-0"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    />
  );

  const ROW_OF_CUPS = (count: number, startdelay: number) => (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: count }, (_, index) => CIRCLE_WITH_ANIMATION(startdelay + index * 100))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {istop ? (
        // Top formation
        selectedcupformation === CUP_FORMATION_TYPE.tenCups ? (
          <>
            {ROW_OF_CUPS(4, 0)}
            {ROW_OF_CUPS(3, 400)}
            {ROW_OF_CUPS(2, 700)}
            {ROW_OF_CUPS(1, 900)}
          </>
        ) : (
          <>
            {ROW_OF_CUPS(3, 0)}
            {ROW_OF_CUPS(2, 300)}
            {ROW_OF_CUPS(1, 500)}
          </>
        )
      ) : // Bottom formation
      selectedcupformation === CUP_FORMATION_TYPE.tenCups ? (
        <>
          {ROW_OF_CUPS(1, 0)}
          {ROW_OF_CUPS(2, 100)}
          {ROW_OF_CUPS(3, 300)}
          {ROW_OF_CUPS(4, 600)}
        </>
      ) : (
        <>
          {ROW_OF_CUPS(1, 0)}
          {ROW_OF_CUPS(2, 100)}
          {ROW_OF_CUPS(3, 300)}
        </>
      )}
    </div>
  );
}

export function PingPongTable({
  team1players,
  team2players,
  selectedcupformation,
  onRemovePlayer,
}: PING_PONG_TABLE_PROPS) {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Table Surface */}
      <div
        className="relative w-full rounded-xl border-2 flex flex-col"
        style={{
          height: "300px",
          backgroundColor: "rgba(255, 255, 255, 0.075)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Team 1 Area (Top) */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-3 overflow-hidden"
          style={{ maxHeight: "calc(50% - 1px)" }}
        >
          {team1players.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-full overflow-y-auto">
              {team1players.map((player) => (
                <PlayerBubble key={player.id} player={player} onRemove={() => onRemovePlayer(player.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <CupFormation istop={true} selectedcupformation={selectedcupformation} />
            </div>
          )}
        </div>

        {/* Center Line */}
        <div
          className="h-0.5 w-full z-10 flex-shrink-0"
          style={{
            backgroundColor: "rgba(245, 245, 220, 0.3)",
          }}
        />

        {/* Team 2 Area (Bottom) */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-3 overflow-hidden"
          style={{ maxHeight: "calc(50% - 1px)" }}
        >
          {team2players.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-full overflow-y-auto">
              {team2players.map((player) => (
                <PlayerBubble key={player.id} player={player} onRemove={() => onRemovePlayer(player.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <CupFormation istop={false} selectedcupformation={selectedcupformation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
