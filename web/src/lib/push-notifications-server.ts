import { createClient } from "@/supabase/service";
import webpush from "web-push";

// Types for push notifications
export interface PUSH_SUBSCRIPTION {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
  active: boolean;
}

export interface PUSH_NOTIFICATION_PAYLOAD {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
  notificationId?: string;
}

// Initialize web-push configuration
export function INITIALIZE_WEB_PUSH() {
  const vapidPublicKey = process.env.WEB_PUSH_PUBLIC_VAPID_KEY;
  const vapidPrivateKey = process.env.WEB_PUSH_PRIVATE_VAPID_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@pongbros.co.za";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID keys not configured");
    return false;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  return true;
}

// Save push subscription to database
export async function SAVE_PUSH_SUBSCRIPTION(subscriptionData: PUSH_SUBSCRIPTION): Promise<PUSH_SUBSCRIPTION | null> {
  try {
    const supabase = await createClient();

    // First, deactivate any existing subscriptions for this user
    await supabase.from("push_subscriptions").update({ active: false }).eq("user_id", subscriptionData.user_id);

    // Insert new subscription
    const { data, error } = await supabase.from("push_subscriptions").insert(subscriptionData).select().single();

    if (error) {
      console.error("Error saving push subscription:", error);
      return null;
    }

    return data as PUSH_SUBSCRIPTION;
  } catch (error) {
    console.error("Exception in SAVE_PUSH_SUBSCRIPTION:", error);
    return null;
  }
}

// Get user's push subscription from database
export async function GET_USER_PUSH_SUBSCRIPTION(userId: string): Promise<PUSH_SUBSCRIPTION | null> {
  try {
    const supabase = await createClient();

    console.log("🔍 Looking for push subscription for user:", userId);

    // First, let's see all subscriptions for this user (for debugging)
    // Try with RLS bypassed using rpc or raw SQL if needed
    const { data: allSubs, error: debugError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);
    
    console.log("🔍 All subscriptions for user:", userId, "total count:", allSubs?.length);
    
    const activeSubs = allSubs?.filter(s => s.active === true) || [];
    console.log("🔍 Active subscriptions:", activeSubs.length, "of", allSubs?.length);
    
    if (allSubs && allSubs.length > 0) {
      console.log("🔍 Subscription details:", allSubs.map(s => ({ 
        id: s.id, 
        active: s.active, 
        created_at: s.created_at,
        endpoint: s.endpoint?.substring(0, 50) + "..." 
      })));
    }

    // Try using raw SQL to bypass any RLS issues
    const { data, error } = await supabase.rpc('get_user_push_subscription', { 
      target_user_id: userId 
    }).single();

    console.log("🔍 Main query result - data:", data ? "found" : "null", "error:", error?.code || "none");

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        console.log("❌ No active subscription found for user:", userId, "(PGRST116 - no rows returned by active=true query)");
        return null;
      }
      console.error("❌ Error fetching push subscription for user:", userId, "Error:", error);
      return null;
    }

    if (data && typeof data === 'object' && 'endpoint' in data) {
      console.log("✅ Found subscription for user:", userId, "endpoint:", (data as any).endpoint.substring(0, 50) + "...");
      return data as PUSH_SUBSCRIPTION;
    } else {
      console.log("❌ No valid subscription data returned for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Exception in GET_USER_PUSH_SUBSCRIPTION:", error);
    return null;
  }
}

// Deactivate push subscription
export async function DEACTIVATE_PUSH_SUBSCRIPTION(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("push_subscriptions").update({ active: false }).eq("user_id", userId);

    if (error) {
      console.error("Error deactivating push subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception in DEACTIVATE_PUSH_SUBSCRIPTION:", error);
    return false;
  }
}

// Send push notification to specific user
export async function SEND_PUSH_NOTIFICATION_TO_USER(
  userId: string,
  payload: PUSH_NOTIFICATION_PAYLOAD
): Promise<boolean> {
  try {
    if (!INITIALIZE_WEB_PUSH()) {
      console.error("Web push not initialized");
      return false;
    }

    const subscription = await GET_USER_PUSH_SUBSCRIPTION(userId);
    if (!subscription) {
      console.log("No active push subscription for user:", userId);
      return false;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const payloadString = JSON.stringify(payload);
    console.log("📤 Sending push notification payload:", payload);
    console.log("📤 Payload string:", payloadString);
    
    await webpush.sendNotification(pushSubscription, payloadString);

    console.log("Push notification sent to user:", userId);
    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);

    // If subscription is invalid, deactivate it
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        console.log("Deactivating invalid subscription for user:", userId);
        await DEACTIVATE_PUSH_SUBSCRIPTION(userId);
      }
    }

    return false;
  }
}

// Send push notification to multiple users
export async function SEND_PUSH_NOTIFICATION_TO_USERS(
  userIds: string[],
  payload: PUSH_NOTIFICATION_PAYLOAD
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const promises = userIds.map(async (userId) => {
    try {
      const result = await SEND_PUSH_NOTIFICATION_TO_USER(userId, payload);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  });

  await Promise.all(promises);

  return { success, failed };
}

// Send push notification to all active subscriptions
export async function SEND_PUSH_NOTIFICATION_TO_ALL(
  payload: PUSH_NOTIFICATION_PAYLOAD
): Promise<{ success: number; failed: number }> {
  try {
    const supabase = await createClient();

    console.log("🔍 Querying for all active push subscriptions...");
    const { data, error } = await supabase.from("push_subscriptions").select("*").eq("active", true);

    if (error) {
      console.error("❌ Error fetching push subscriptions:", error);
      return { success: 0, failed: 0 };
    }

    if (!data || data.length === 0) {
      console.log("❌ No active push subscriptions found in database");
      return { success: 0, failed: 0 };
    }

    console.log("📊 Raw subscription data:", JSON.stringify(data, null, 2));

    const userIds = data.map((sub) => sub.user_id);
    console.log("🔔 Found", data.length, "active subscriptions for users:", userIds);
    return await SEND_PUSH_NOTIFICATION_TO_USERS(userIds, payload);
  } catch (error) {
    console.error("Exception in SEND_PUSH_NOTIFICATION_TO_ALL:", error);
    return { success: 0, failed: 0 };
  }
}
