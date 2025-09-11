import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import TournamentSetup from "./tournament-setup";

export default async function TournamentPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data: userdata, error } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  if (error || !userdata) redirect("/login");

  return <TournamentSetup user={userdata} />;
}


