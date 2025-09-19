import { NEW_GAME_ROOT } from "./blocks/new-game-root";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export default async function GamePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();


  if (!authUser) {
    redirect("/login");
  }

  // Get user profile from database
  const { data: userdata, error } = await supabase.from("users").select("*").eq("id", authUser.id).single();

  if (error) {
    console.error("Error fetching user data:", error);
    redirect("/login");
  }

  if (!userdata) {
    console.error("No user data found");
    redirect("/login");
  }


  return <NEW_GAME_ROOT user={userdata} />;
}
