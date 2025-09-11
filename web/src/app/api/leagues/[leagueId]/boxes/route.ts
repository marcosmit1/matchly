import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = params;

    // Get league box structure
    const { data: boxes, error: boxesError } = await supabase.rpc(
      "get_league_box_structure",
      { p_league_id: leagueId }
    );

    if (boxesError) {
      console.error("Error fetching boxes:", boxesError);
      return NextResponse.json(
        { error: "Failed to fetch league boxes" },
        { status: 500 }
      );
    }

    // Get participants for each box
    const boxesWithParticipants = await Promise.all(
      boxes.map(async (box: any) => {
        const { data: participants, error: participantsError } = await supabase
          .from("league_box_assignments")
          .select(`
            user_id,
            status,
            matches_played,
            matches_won,
            matches_lost,
            users!league_box_assignments_user_id_fkey(
              id,
              email,
              raw_user_meta_data
            )
          `)
          .eq("league_id", leagueId)
          .eq("box_id", box.box_id)
          .eq("status", "active");

        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
          return { ...box, participants: [] };
        }

        return {
          ...box,
          participants: participants || [],
        };
      })
    );

    return NextResponse.json({
      league_id: leagueId,
      boxes: boxesWithParticipants,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
