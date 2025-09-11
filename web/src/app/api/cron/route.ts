import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(url, serviceRoleKey);

    // 1. Calculate the cutoff time (1 hour ago)
    const cutofftime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // 2. Fetch stale games that are still 'active' and older than the cutoff time
    const { data: stalegames, error: fetcherror } = await supabase
      .from("games")
      .select("id")
      .eq("status", "active")
      .lt("updated_at", cutofftime);

    if (fetcherror) {
      console.error("Error fetching stale games:", fetcherror);
      return NextResponse.json({ error: "Failed to fetch stale games" }, { status: 500 });
    }

    if (!stalegames || stalegames.length === 0) {
      return NextResponse.json({ message: "No stale games found to cancel." });
    }

    // 3. Cancel the stale games
    const gameidstocancel = stalegames.map((game) => game.id);
    const { error: updateerror } = await supabase
      .from("games")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .in("id", gameidstocancel);

    if (updateerror) {
      console.error("Error cancelling stale games:", updateerror);
      return NextResponse.json({ error: "Failed to cancel stale games" }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully cancelled ${stalegames.length} stale games.`,
      cancelled_games: gameidstocancel,
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
