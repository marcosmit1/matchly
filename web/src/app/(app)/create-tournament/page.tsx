import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { CreateTournamentForm } from "./create-tournament-form";

export default async function CreateTournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Create Tournament</h1>
      </div>
      
      <div className="px-4 py-6">
        <CreateTournamentForm />
      </div>
    </div>
  );
}
