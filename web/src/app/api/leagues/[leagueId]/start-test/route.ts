import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = await params;
    console.log("Starting league with ID:", leagueId);

    // Use the test version of the start_league function
    const { data, error } = await supabase.rpc("start_league_test", {
      p_league_id: leagueId,
    });

    console.log("Start league result:", { data, error });

    if (error) {
      console.error("Error starting league:", error);
      return NextResponse.json(
        { error: "Failed to start league", details: error.message },
        { status: 500 }
      );
    }

    // Check if boxes were created
    const { data: boxes, error: boxesError } = await supabase
      .from('league_boxes')
      .select('id, level, name, league_id')
      .eq('league_id', leagueId);

    console.log("Boxes created:", { boxes, boxesError });

    // Check participants in the league
    const { data: participants, error: participantsError } = await supabase
      .from('league_participants')
      .select('user_id, status')
      .eq('league_id', leagueId);

    console.log("League participants:", { participants, participantsError });

    // Check box assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('league_box_assignments')
      .select('box_id, user_id')
      .in('box_id', boxes?.map(box => box.id) || []);

    console.log("Box assignments:", { assignments, assignmentsError });

    return NextResponse.json({
      message: "League started successfully! Boxes and matches have been created.",
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
