import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { MatchesView } from "./matches-view";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { leagueId } = await params;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">My Matches</h1>
      </div>
      <div className="px-4 py-6">
        <MatchesView leagueId={leagueId} />
      </div>
    </div>
  );
}
