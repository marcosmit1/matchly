import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import { TournamentDetails } from "./tournament-details";

interface TournamentPageProps {
  params: {
    tournamentId: string;
  };
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const supabase = await createClient();
  const { tournamentId } = params;

  // Fetch tournament details
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (error || !tournament) {
    notFound();
  }

  return <TournamentDetails tournament={tournament} />;
}
