import { createClient } from "@/supabase/client";

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

// Get VAPID public key for client-side subscription
export function GET_VAPID_PUBLIC_KEY(): string | null {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_VAPID_KEY || null;
}

// Check if push notifications are supported
export function CHECK_PUSH_SUPPORT(): boolean {
  if (typeof window === "undefined") return false;

  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Request notification permission
export async function REQUEST_NOTIFICATION_PERMISSION(): Promise<NotificationPermission> {
  if (!CHECK_PUSH_SUPPORT()) {
    throw new Error("Push notifications are not supported");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission denied");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Register service worker
export async function REGISTER_SERVICE_WORKER(): Promise<ServiceWorkerRegistration | null> {
  if (!CHECK_PUSH_SUPPORT()) {
    console.error("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    console.log("Service Worker registered:", registration);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("Service Worker is ready");

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

// Subscribe to push notifications
export async function SUBSCRIBE_TO_PUSH(userId: string): Promise<PUSH_SUBSCRIPTION | null> {
  try {
    // Check support and permissions
    if (!CHECK_PUSH_SUPPORT()) {
      throw new Error("Push notifications not supported");
    }

    const permission = await REQUEST_NOTIFICATION_PERMISSION();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    // Register service worker
    const registration = await REGISTER_SERVICE_WORKER();
    if (!registration) {
      throw new Error("Failed to register service worker");
    }

    // Double-check the service worker is active
    if (!registration.active && !registration.installing && !registration.waiting) {
      throw new Error("Service worker is not in a usable state");
    }

    // Get VAPID public key
    const vapidPublicKey = GET_VAPID_PUBLIC_KEY();
    if (!vapidPublicKey) {
      throw new Error("VAPID public key not configured");
    }

    console.log("🔔 Attempting to subscribe to push manager...");

    // Subscribe to push manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: URL_BASE_64_TO_UINT8_ARRAY(vapidPublicKey),
    });

    console.log("🔔 Push subscription successful!");

    // Extract subscription details
    const p256dhKey = subscription.getKey("p256dh");
    const authKey = subscription.getKey("auth");

    if (!p256dhKey || !authKey) {
      throw new Error("Failed to get subscription keys");
    }

    const subscriptionData: PUSH_SUBSCRIPTION = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: ARRAY_BUFFER_TO_BASE64(p256dhKey),
      auth: ARRAY_BUFFER_TO_BASE64(authKey),
      user_agent: navigator.userAgent,
      active: true,
    };

    // Save subscription via API
    const response = await fetch("/api/push-subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }

    const result = await response.json();
    return result.subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function UNSUBSCRIBE_FROM_PUSH(userId: string): Promise<boolean> {
  try {
    // Unsubscribe from push manager
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    // Deactivate subscription via API
    const response = await fetch("/api/push-subscriptions", {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

// Check if user is subscribed
export async function CHECK_PUSH_SUBSCRIPTION(userId: string): Promise<boolean> {
  try {
    if (!CHECK_PUSH_SUPPORT()) return false;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    // Check via API
    const response = await fetch("/api/push-subscriptions");
    if (!response.ok) return false;

    const result = await response.json();
    return result.subscribed;
  } catch (error) {
    console.error("Failed to check push subscription:", error);
    return false;
  }
}

// Get user's push subscription from database (client-side version)
export async function GET_USER_PUSH_SUBSCRIPTION(userId: string): Promise<PUSH_SUBSCRIPTION | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching push subscription:", error);
      return null;
    }

    return data as PUSH_SUBSCRIPTION;
  } catch (error) {
    console.error("Exception in GET_USER_PUSH_SUBSCRIPTION:", error);
    return null;
  }
}

// Utility functions
function URL_BASE_64_TO_UINT8_ARRAY(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function ARRAY_BUFFER_TO_BASE64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return window.btoa(result);
}
