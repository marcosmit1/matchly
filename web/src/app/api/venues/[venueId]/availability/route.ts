import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const { venueId } = await params;

    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .eq("is_active", true)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Get bookings for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("table_number, start_time, end_time")
      .eq("venue_id", venueId)
      .in("status", ["pending", "confirmed", "active"])
      .gte("start_time", startOfDay.toISOString())
      .lte("end_time", endOfDay.toISOString());

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
    }

    // Generate time slots based on venue operating hours
    const dayOfWeek = startOfDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = venue.hours_of_operation[dayOfWeek];

    if (!hours) {
      return NextResponse.json({ 
        venue, 
        timeSlots: [], 
        message: "Venue is closed on this day" 
      });
    }

    // Generate hourly time slots
    const timeSlots = [];
    const openHour = parseInt(hours.open.split(':')[0]);
    const closeHour = parseInt(hours.close.split(':')[0]);

    for (let hour = openHour; hour < closeHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotStart = new Date(`${date}T${timeString}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour later

      // Check how many tables are available for this time slot
      const conflictingBookings = bookings?.filter(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        // Check if the time slot overlaps with any booking
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      }) || [];

      const availableTables = venue.number_of_tables - conflictingBookings.length;

      timeSlots.push({
        time: timeString,
        available: availableTables > 0,
        availableTables,
        price: venue.price_per_hour,
      });
    }

    return NextResponse.json({ venue, timeSlots });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
