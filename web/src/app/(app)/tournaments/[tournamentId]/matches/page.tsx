import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import { TournamentMatches } from "./tournament-matches";

interface TournamentMatchesPageProps {
  params: {
    tournamentId: string;
  };
}

export default async function TournamentMatchesPage({ params }: TournamentMatchesPageProps) {
  const supabase = await createClient();
  const { tournamentId } = params;

  // Fetch tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Fetch tournament rounds
  const { data: rounds, error: roundsError } = await supabase
    .from("tournament_rounds")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: true });

  // Fetch tournament matches (simplified for debugging)
  const { data: matches, error: matchesError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  // Fetch tournament players separately
  const { data: players, error: playersError } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournamentId);

  // Combine matches with player data
  const matchesWithPlayers = matches?.map(match => ({
    ...match,
    player1: players?.find(p => p.id === match.player1_id),
    player2: players?.find(p => p.id === match.player2_id),
    player3: players?.find(p => p.id === match.player3_id),
    player4: players?.find(p => p.id === match.player4_id),
  })) || [];

  // Debug logging
  console.log('Tournament ID:', tournamentId);
  console.log('Matches found:', matches?.length || 0);
  console.log('Players found:', players?.length || 0);
  console.log('Rounds found:', rounds?.length || 0);
  console.log('Matches with players:', matchesWithPlayers.length);

  return (
    <TournamentMatches 
      tournament={tournament}
      rounds={rounds || []}
      matches={matchesWithPlayers}
    />
  );
}
