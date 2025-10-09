import { createClient } from "@/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ClientWrapper } from "./client-wrapper";

interface GolfTournamentPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function GolfTournamentPage({ params }: GolfTournamentPageProps) {
  const supabase = await createClient();
  const { tournamentId } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?returnUrl=${encodeURIComponent(`/golf/${tournamentId}`)}`);
  }

  // Fetch golf tournament details
  const { data: tournament, error } = await supabase
    .from("golf_tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (error || !tournament) {
    notFound();
  }

  return <ClientWrapper tournament={tournament} userId={user.id} />;
}
