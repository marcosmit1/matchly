import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  try {
    const { gameid } = await request.json();

    if (!gameid) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    console.log("🧪 Testing game completion for game:", gameid);

    // Update the game status to completed
    const { data, error } = await supabase
      .from("games")
      .update({
        status: "completed",
        winner: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameid)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating game:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("🧪 Game updated successfully:", data);
    return NextResponse.json({
      message: "Game marked as completed successfully",
      game: data,
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
