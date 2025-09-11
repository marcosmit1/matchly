"use client";

import Link from "next/link";
import { useMemo } from "react";

type Team = { id: string; name: string } | null;
type Match = { id: string; round: number; match_index: number; team_a_id: string | null; team_b_id: string | null; status: string; game_id?: string | null; winner_team_id?: string | null };
type TeamMap = Map<string, { name: string; players: string[] }>;

function Connector() {
  return (
    <div className="absolute left-[50%] top-0 h-full w-px bg-white/10" aria-hidden />
  );
}

export function BracketView({
  tid,
  rounds,
  teamMap,
  gameMap,
}: {
  tid: string;
  rounds: Map<number, Match[]>;
  teamMap: TeamMap;
  gameMap?: Map<string, { team1_score: number; team2_score: number; winner: number | null }>;
}) {
  const orderedRounds = useMemo(() => [...rounds.keys()].sort((a, b) => a - b), [rounds]);

  return (
    <div className="-mx-4 px-4">
      <div className="flex flex-col gap-6">
        {orderedRounds.map((r) => (
          <div key={r} className="relative">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10" style={{ backdropFilter: "blur(10px)" as any }}>
                <div className="text-xl font-bold text-white">Round {r}</div>
                {r === Math.max(...orderedRounds) && (
                  <div className="text-lg">🏆</div>
                )}
              </div>
            </div>
            <div className="space-y-4 relative">
              {/* Vertical layout on mobile; connector optional */}
              {(rounds.get(r) || []).map((m) => {
                const a = m.team_a_id ? teamMap.get(m.team_a_id) : undefined;
                const b = m.team_b_id ? teamMap.get(m.team_b_id) : undefined;
                const href = a && b ? `/game/tournament/match?tid=${encodeURIComponent(tid)}&aid=${encodeURIComponent(m.team_a_id!)}&bid=${encodeURIComponent(m.team_b_id!)}&mid=${encodeURIComponent(m.id)}` : undefined;
                const gameResult = m.game_id ? gameMap?.get(m.game_id) : undefined;
                const isWinnerA = m.winner_team_id === m.team_a_id;
                const hasWinner = !!m.winner_team_id;

                return (
                  <div key={m.id} className="relative">
                    {href ? (
                      <Link href={href} className="block rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-lg active:scale-[0.99] transition-all duration-200" style={{ backdropFilter: "blur(10px)" as any }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-white/60 font-medium">Match {m.match_index}</div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${m.status === 'complete' ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-300' : m.status === 'in_progress' ? 'bg-yellow-400/15 border-yellow-300/20 text-yellow-300' : 'bg-white/10 border-white/15 text-white/70'}`}>{m.status.replace('_',' ')}</span>
                        </div>
                        
                        {/* Team A */}
                        <div className={`flex items-center justify-between p-3 rounded-xl mb-2 ${hasWinner && isWinnerA ? 'bg-emerald-500/10 border border-emerald-400/20' : 'bg-white/5'}`}>
                          <div className="flex-1">
                            <div className={`text-sm font-semibold truncate ${hasWinner && isWinnerA ? 'text-emerald-200' : 'text-white'}`}>
                              {a?.name || "TBD"}
                            </div>
                            <div className="text-[10px] text-white/50 truncate">
                              {a ? (a.players.join(" & ") || "-") : "Winner previous"}
                            </div>
                          </div>
                          {gameResult && (
                            <div className={`text-lg font-bold ml-2 ${hasWinner && isWinnerA ? 'text-emerald-200' : 'text-white/80'}`}>
                              {gameResult.team1_score}
                            </div>
                          )}
                        </div>

                        <div className="text-center py-1">
                          <div className="text-xs text-white/30 font-medium">VS</div>
                        </div>

                        {/* Team B */}
                        <div className={`flex items-center justify-between p-3 rounded-xl ${hasWinner && !isWinnerA ? 'bg-emerald-500/10 border border-emerald-400/20' : 'bg-white/5'}`}>
                          <div className="flex-1">
                            <div className={`text-sm font-semibold truncate ${hasWinner && !isWinnerA ? 'text-emerald-200' : 'text-white'}`}>
                              {b?.name || "TBD"}
                            </div>
                            <div className="text-[10px] text-white/50 truncate">
                              {b ? (b.players.join(" & ") || "-") : "Winner previous"}
                            </div>
                          </div>
                          {gameResult && (
                            <div className={`text-lg font-bold ml-2 ${hasWinner && !isWinnerA ? 'text-emerald-200' : 'text-white/80'}`}>
                              {gameResult.team2_score}
                            </div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-lg" style={{ backdropFilter: "blur(10px)" as any }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-white/60 font-medium">Match {m.match_index}</div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${m.status === 'complete' ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-300' : m.status === 'in_progress' ? 'bg-yellow-400/15 border-yellow-300/20 text-yellow-300' : 'bg-white/10 border-white/15 text-white/70'}`}>{m.status.replace('_',' ')}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="truncate font-semibold">{a?.name || "TBD"}</div>
                            <div className="text-[10px] text-white/50">{a ? (a.players.join(", ") || "-") : "Winner prev"}</div>
                          </div>
                          <div className="text-center text-white/40 text-[10px]">vs</div>
                          <div className="flex items-center justify-between">
                            <div className="truncate font-semibold">{b?.name || "TBD"}</div>
                            <div className="text-[10px] text-white/50">{b ? (b.players.join(", ") || "-") : "Winner prev"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


