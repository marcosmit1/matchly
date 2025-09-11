import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { CreateLeagueForm } from "./create-league-form";

export default async function CreateLeaguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Create League</h1>
      </div>
      
      <div className="px-4 py-6">
        <CreateLeagueForm />
      </div>
    </div>
  );
}
