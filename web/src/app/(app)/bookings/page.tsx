import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { BookingsView } from "./bookings-view";

export default async function BookingsPage() {
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

  return <BookingsView user={userdata} />;
}
