import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import { TournamentStandings } from "./tournament-standings";

interface TournamentStandingsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentStandingsPage({ params }: TournamentStandingsPageProps) {
  const supabase = await createClient();
  const { tournamentId } = await params;

  // Fetch tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Fetch tournament players
  const { data: players, error: playersError } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  // Fetch tournament matches
  const { data: matches, error: matchesError } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("status", "completed");

  return (
    <TournamentStandings 
      tournament={tournament}
      players={players || []}
      matches={matches || []}
    />
  );
}
