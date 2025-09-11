import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string; boxId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId, boxId } = params;

    // Get box standings
    const { data: standings, error: standingsError } = await supabase.rpc(
      "get_box_standings",
      { p_league_id: leagueId, p_box_id: boxId }
    );

    if (standingsError) {
      console.error("Error fetching standings:", standingsError);
      return NextResponse.json(
        { error: "Failed to fetch box standings" },
        { status: 500 }
      );
    }

    // Get user details for each standing
    const standingsWithUsers = await Promise.all(
      standings.map(async (standing: any) => {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, raw_user_meta_data")
          .eq("id", standing.user_id)
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
          return { ...standing, user: null };
        }

        return {
          ...standing,
          user: userData,
        };
      })
    );

    return NextResponse.json({
      league_id: leagueId,
      box_id: boxId,
      standings: standingsWithUsers,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
