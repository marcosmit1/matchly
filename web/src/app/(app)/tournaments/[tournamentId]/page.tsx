import { createClient } from "@/supabase/server";
import { notFound, redirect } from "next/navigation";
import { TournamentDetails } from "./tournament-details";

interface TournamentPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const supabase = await createClient();
  const { tournamentId } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?returnUrl=${encodeURIComponent(`/tournaments/${tournamentId}`)}`);
  }

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
