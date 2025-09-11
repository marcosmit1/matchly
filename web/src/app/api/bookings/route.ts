import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      venue_id,
      start_time,
      end_time,
      number_of_players,
      special_requests,
    } = body;

    // Validate required fields
    if (!venue_id || !start_time || !end_time || !number_of_players) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get venue details to calculate pricing
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venue_id)
      .eq("is_active", true)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Calculate duration and total amount
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const total_amount = venue.price_per_hour * durationHours;

    // Find an available table for the time slot
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("table_number")
      .eq("venue_id", venue_id)
      .in("status", ["pending", "confirmed", "active"])
      .or(`and(start_time.lte.${end_time},end_time.gte.${start_time})`);

    if (bookingsError) {
      console.error("Error checking availability:", bookingsError);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    // Find an available table number
    const bookedTables = conflictingBookings?.map(b => b.table_number) || [];
    let table_number = 1;
    
    for (let i = 1; i <= venue.number_of_tables; i++) {
      if (!bookedTables.includes(i)) {
        table_number = i;
        break;
      }
    }

    if (bookedTables.length >= venue.number_of_tables) {
      return NextResponse.json(
        { error: "No tables available for the selected time slot" },
        { status: 409 }
      );
    }

    // Create the booking
    const { data: booking, error: createError } = await supabase
      .from("bookings")
      .insert({
        venue_id,
        user_id: user.id,
        table_number,
        start_time,
        end_time,
        total_amount,
        number_of_players,
        special_requests,
        status: "pending",
        payment_status: "pending",
      })
      .select(`
        *,
        venue:venues(*)
      `)
      .single();

    if (createError) {
      console.error("Error creating booking:", createError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        venue:venues(*)
      `)
      .eq("user_id", user.id)
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
