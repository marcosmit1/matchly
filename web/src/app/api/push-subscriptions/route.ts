import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import {
  SAVE_PUSH_SUBSCRIPTION,
  GET_USER_PUSH_SUBSCRIPTION,
  DEACTIVATE_PUSH_SUBSCRIPTION,
} from "@/lib/push-notifications-server";

// Get user's push subscription status
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

    // Check if user has an active subscription
    const subscription = await GET_USER_PUSH_SUBSCRIPTION(user.id);

    return NextResponse.json({
      subscribed: !!subscription,
      subscription: subscription,
    });
  } catch (error) {
    console.error("Error checking push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Subscribe to push notifications
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

    // Parse request body
    const subscriptionData = await request.json();

    // Validate required fields
    if (!subscriptionData.endpoint || !subscriptionData.p256dh || !subscriptionData.auth) {
      return NextResponse.json({ error: "Missing required subscription data" }, { status: 400 });
    }

    // Ensure user_id matches authenticated user
    subscriptionData.user_id = user.id;

    // Save subscription
    const subscription = await SAVE_PUSH_SUBSCRIPTION(subscriptionData);

    if (!subscription) {
      return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: subscription,
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
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

    // Deactivate user's push subscription
    const result = await DEACTIVATE_PUSH_SUBSCRIPTION(user.id);

    if (!result) {
      return NextResponse.json({ error: "Failed to deactivate push subscription" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Push subscription deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
