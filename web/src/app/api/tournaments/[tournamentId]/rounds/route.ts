import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { tournamentId } = await params;

    // Fetch tournament rounds
    const { data: rounds, error } = await supabase
      .from("tournament_rounds")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round_number", { ascending: true });

    if (error) {
      console.error("Error fetching rounds:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch rounds" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      rounds: rounds || [],
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/rounds:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
