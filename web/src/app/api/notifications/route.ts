import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { BookingNotificationData } from "@/types/notifications";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      type,
      recipient_id,
      booking_id,
      message,
      metadata
    } = body;

    // Validate required fields
    if (!type || !recipient_id) {
      return NextResponse.json(
        { error: "Missing required fields: type, recipient_id" },
        { status: 400 }
      );
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from("invitations")
      .insert({
        type,
        recipient_id,
        booking_id: booking_id || null,
        message: message || null,
        metadata: metadata || {},
        status: type.startsWith('booking_') ? 'unread' : 'pending',
        sender_id: null // System notifications have no sender
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
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

    // Get all notifications for the user
    const { data: notifications, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to create booking notifications
async function createBookingNotification(
  type: 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled',
  recipientId: string,
  bookingId: string,
  bookingData: BookingNotificationData
) {
  const supabase = await createClient();

  const messages = {
    booking_confirmation: `Your table booking at ${bookingData.venue_name} has been confirmed!`,
    booking_reminder: `Reminder: Your table booking at ${bookingData.venue_name} is coming up soon.`,
    booking_cancelled: `Your table booking at ${bookingData.venue_name} has been cancelled.`,
  };

  const { data: notification, error } = await supabase
    .from("invitations")
    .insert({
      type,
      recipient_id: recipientId,
      booking_id: bookingId,
      message: messages[type],
      metadata: bookingData,
      status: 'unread',
      sender_id: null
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating booking notification:", error);
    throw error;
  }

  return notification;
}
