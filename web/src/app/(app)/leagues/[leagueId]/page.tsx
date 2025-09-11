import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { LeagueDetails } from "./league-details";

export default async function LeagueDetailsPage({
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
        <h1 className="text-lg font-semibold text-gray-900">League Details</h1>
      </div>
      
      <div className="px-4 py-6">
        <LeagueDetails leagueId={leagueId} />
      </div>
    </div>
  );
}
