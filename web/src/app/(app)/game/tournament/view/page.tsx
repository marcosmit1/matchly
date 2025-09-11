import { notFound } from "next/navigation";
import Link from "next/link";
import { BracketView } from "../bracket-view";
import { createClient } from "@/supabase/server";

function decodeTeams(searchParams: { teams?: string }) {
  const raw = searchParams.teams;
  if (!raw) return [] as string[];
  return raw.split(",").map((s) => decodeURIComponent(s)).filter(Boolean);
}

export default async function TournamentBracketPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tid = typeof sp.id === "string" ? sp.id : undefined;
  
  console.log("🏆 Tournament view page accessed");
  console.log("🏆 Search params:", sp);
  console.log("🏆 Tournament ID:", tid);
  
  if (!tid) {
    console.log("🏆 No tournament ID found, returning 404");
    return notFound();
  }

  const supabase = await createClient();
  
  // Debug: Get current user info
  const { data: { user } } = await supabase.auth.getUser();
  console.log("🏆 Current user:", user?.id, user?.email);

  // Load tournament, teams with players, and round 1 matches
  const { data: trn, error: trnError } = await supabase.from("tournaments").select("*").eq("id", tid).single();
  
  console.log("🏆 Tournament query result:", { data: trn, error: trnError });
  
  // Debug: Check if user is in any tournament teams
  if (user) {
    const { data: userTeams } = await supabase
      .from("tournament_team_players")
      .select("*, tournament_teams(tournament_id)")
      .eq("player_name", user.email);
    console.log("🏆 User teams:", userTeams);
    
    const { data: tournamentTeams } = await supabase
      .from("tournament_teams")
      .select("*, tournament_team_players(*)")
      .eq("tournament_id", tid);
    console.log("🏆 All tournament teams:", tournamentTeams);
  }
  
  if (!trn) {
    console.log("🏆 Tournament not found in database, returning 404");
    return notFound();
  }

  const { data: teams } = await supabase
    .from("tournament_teams")
    .select("id, name, seed, tournament_team_players ( player_name )")
    .eq("tournament_id", tid)
    .order("seed", { ascending: true });

  const { data: matches } = await supabase
    .from("tournament_matches")
    .select("id, round, match_index, team_a_id, team_b_id, winner_team_id, status, game_id")
    .eq("tournament_id", tid)
    .order("round", { ascending: true })
    .order("match_index", { ascending: true });

  const teamMap = new Map<string, { name: string; players: string[] }>();
  for (const t of teams || []) {
    teamMap.set(t.id, { name: t.name, players: (t.tournament_team_players || []).map((p: any) => p.player_name) });
  }

  // Fetch game results for all matches with a game_id
  const gameIds = (matches || []).map((m: any) => m.game_id).filter(Boolean);
  const gameMap = new Map<string, { team1_score: number; team2_score: number; winner: number | null }>();
  if (gameIds.length > 0) {
    const { data: games } = await supabase
      .from("games")
      .select("id, team1, team2, winner")
      .in("id", gameIds);
    for (const g of games || []) {
      gameMap.set(g.id, { team1_score: g.team1.score, team2_score: g.team2.score, winner: g.winner });
    }
  }

  // Group matches by round for a simple columnar bracket
  const rounds = new Map<number, any[]>();
  for (const m of matches || []) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-2xl font-bold">Bracket</div>
      </div>
      {trn.status === "completed" && (
        <div className="mb-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-yellow-600/10 p-6 text-white shadow-xl" style={{ backdropFilter: "blur(15px)" as any }}>
          {/* Winner Banner */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🏆</div>
            <div className="text-sm font-medium text-amber-200/80 uppercase tracking-wider mb-1">Champion</div>
            {(() => {
              // Final is max round; find its winner
              const maxRound = Math.max(...[...rounds.keys()]);
              const finalMatches = rounds.get(maxRound) || [];
              const fm = finalMatches[0];
              const winnerTeamId = fm?.winner_team_id as string | undefined;
              const winnerTeam = winnerTeamId ? teamMap.get(winnerTeamId) : undefined;
              return (
                <div className="text-3xl font-bold text-amber-100 mb-2">
                  {winnerTeam?.name || "Champion"}
                </div>
              );
            })()}
            <div className="text-sm text-amber-200/60">
              {(() => {
                const maxRound = Math.max(...[...rounds.keys()]);
                const finalMatches = rounds.get(maxRound) || [];
                const fm = finalMatches[0];
                const winnerTeamId = fm?.winner_team_id as string | undefined;
                const winnerTeam = winnerTeamId ? teamMap.get(winnerTeamId) : undefined;
                return winnerTeam?.players.join(" & ") || "Tournament Complete";
              })()}
            </div>
          </div>

          {/* Tournament Results */}
          <div className="border-t border-white/10 pt-5">
            <div className="text-lg font-semibold mb-4 text-center text-amber-100">Tournament Results</div>
            <div className="space-y-3">
              {(matches || []).map((m: any) => {
                const a = m.team_a_id ? teamMap.get(m.team_a_id) : undefined;
                const b = m.team_b_id ? teamMap.get(m.team_b_id) : undefined;
                const g = m.game_id ? gameMap.get(m.game_id) : undefined;
                const score = g ? `${g.team1_score}-${g.team2_score}` : "-";
                const winnerLabel = m.winner_team_id ? teamMap.get(m.winner_team_id)?.name : undefined;
                const isWinnerA = m.winner_team_id === m.team_a_id;
                
                return (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-amber-200/60 font-medium">Round {m.round} • Match {m.match_index}</div>
                      <div className="text-lg font-mono font-bold text-amber-100">{score}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${isWinnerA ? 'font-semibold text-amber-100' : 'text-white/70'}`}>
                        {a?.name || "TBD"}
                      </div>
                      <div className="text-xs text-white/40 mx-2">vs</div>
                      <div className={`text-sm ${!isWinnerA && winnerLabel ? 'font-semibold text-amber-100' : 'text-white/70'}`}>
                        {b?.name || "TBD"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BracketView tid={tid} rounds={rounds} teamMap={teamMap} gameMap={gameMap} />
    </main>
  );
}


