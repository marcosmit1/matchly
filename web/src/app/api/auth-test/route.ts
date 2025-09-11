import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    console.log("API Auth Test - User:", user);
    console.log("API Auth Test - Error:", authError);

    if (!user) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        authError: authError,
        user: null 
      }, { status: 401 });
    }

    // Test database access
    const { data: userdata, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("API Auth Test - User Data:", userdata);
    console.log("API Auth Test - User Error:", userError);

    // Test leagues access
    const { data: leagues, error: leaguesError } = await supabase
      .from("leagues")
      .select("*")
      .limit(5);

    console.log("API Auth Test - Leagues:", leagues);
    console.log("API Auth Test - Leagues Error:", leaguesError);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      userData: userdata,
      leagues: leagues,
      errors: {
        authError,
        userError,
        leaguesError
      }
    });

  } catch (error) {
    console.error("API Auth Test - Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
