import { createClient } from "@/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GolfLeaderboard } from "./golf-leaderboard";

interface GolfLeaderboardPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function GolfLeaderboardPage({ params }: GolfLeaderboardPageProps) {
  const supabase = await createClient();
  const { tournamentId } = await params;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnUrl=${encodeURIComponent(`/golf/${tournamentId}/leaderboard`)}`);
  }

  // Fetch golf tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("golf_tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  return <GolfLeaderboard tournament={tournament} userId={user.id} />;
}
