import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = await params;

    // Call the start_tournament function
    const { data, error } = await supabase.rpc('start_tournament', {
      p_tournament_id: tournamentId
    });

    if (error) {
      console.error("Error starting tournament:", error);
      return NextResponse.json(
        { error: error.message || "Failed to start tournament" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Tournament started successfully"
    });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/start:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
