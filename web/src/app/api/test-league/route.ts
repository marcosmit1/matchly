import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple test - just get all leagues without any complex processing
    const { data: leagues, error } = await supabase
      .from("leagues")
      .select("id, name, status, created_by")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error", details: error }, { status: 500 });
    }

    return NextResponse.json({
      message: "Test successful",
      user_id: user.id,
      leagues: leagues,
      league_count: leagues?.length || 0
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
