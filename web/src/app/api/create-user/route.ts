import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        message: "User already exists",
        user: existingUser 
      });
    }

    // Create user in public.users table
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json({ 
        error: "Failed to create user",
        details: createError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "User created successfully",
      user: newUser 
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
