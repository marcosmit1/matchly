"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  CHECK_PUSH_SUPPORT,
  SUBSCRIBE_TO_PUSH,
  UNSUBSCRIBE_FROM_PUSH,
  CHECK_PUSH_SUBSCRIPTION,
  REQUEST_NOTIFICATION_PERMISSION,
} from "@/lib/push-notifications-client";

interface PUSH_NOTIFICATION_SETTINGS_PROPS {
  user: any;
}

export function PUSH_NOTIFICATION_SETTINGS({ user }: PUSH_NOTIFICATION_SETTINGS_PROPS) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Check browser support and current subscription status
  useEffect(() => {
    checkInitialState();
  }, [user]);

  const checkInitialState = async () => {
    try {
      setIsLoading(true);

      // Check if push notifications are supported
      const supported = CHECK_PUSH_SUPPORT();
      setIsSupported(supported);

      if (!supported) {
        setHasChecked(true);
        return;
      }

      // Check current permission status
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionStatus(Notification.permission);
      }

      // Check current subscription status if user is logged in
      if (user?.id) {
        const subscribed = await CHECK_PUSH_SUBSCRIPTION(user.id);
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error("Error checking push notification state:", error);
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  };

  const handleSubscriptionToggle = async (enabled: boolean) => {
    if (!user?.id) {
      setMessage("Please log in to manage push notifications");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (enabled) {
        // Subscribe to push notifications
        const subscription = await SUBSCRIBE_TO_PUSH(user.id);

        if (subscription) {
          setIsSubscribed(true);
          setPermissionStatus("granted");
          setMessage("Push notifications enabled successfully! 🔔");
        } else {
          setMessage("Failed to enable push notifications");
        }
      } else {
        // Unsubscribe from push notifications
        const result = await UNSUBSCRIBE_FROM_PUSH(user.id);

        if (result) {
          setIsSubscribed(false);
          setMessage("Push notifications disabled successfully");
        } else {
          setMessage("Failed to disable push notifications");
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);

      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          setMessage("Please allow notifications in your browser settings");
        } else if (error.message.includes("not supported")) {
          setMessage("Push notifications are not supported in this browser");
        } else {
          setMessage("Failed to update push notification settings");
        }
      } else {
        setMessage("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5" style={{ backdropFilter: "blur(8px)" as any }}>
        <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking notification settings...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5" style={{ backdropFilter: "blur(8px)" as any }}>
      <div className="text-white/70 text-sm mb-3">Push Notifications</div>

      {/* Browser Support Check */}
      {!isSupported && (
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 text-sm font-medium">Not Supported</div>
            <div className="text-white/60 text-xs mt-1">
              Push notifications are not supported in this browser. Please use Chrome, Firefox, or Safari.
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      {isSupported && permissionStatus && (
        <div className="flex items-start gap-3 mb-4">
          {permissionStatus === "granted" ? (
            <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-white text-sm font-medium">Browser Permission</div>
            <div className="text-white/60 text-xs mt-1">
              {permissionStatus === "granted"
                ? "Browser notifications are allowed"
                : permissionStatus === "denied"
                ? "Notifications are blocked. Please enable them in browser settings."
                : "Browser permission required for push notifications"}
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Toggle */}
      {isSupported && user?.id && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isSubscribed ? <Bell className="h-4 w-4 text-green-400" /> : <BellOff className="h-4 w-4 text-white/40" />}
            <div>
              <div className="text-white text-sm font-medium">
                {isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
              </div>
              <div className="text-white/60 text-xs mt-1">
                {isSubscribed
                  ? "You will receive push notifications when the app is closed"
                  : "Enable to receive push notifications when the app is closed"}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSubscriptionToggle(!isSubscribed)}
            disabled={isLoading || permissionStatus === "denied"}
            className={`
              h-9 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 transition-all
              ${
                isSubscribed
                  ? "bg-white/10 border border-white/10 text-white hover:bg-white/20"
                  : "bg-[#FAD659] text-black hover:bg-[#FAD659]/90"
              }
            `}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubscribed ? "Disable" : "Enable"}
          </button>
        </div>
      )}

      {/* Not Logged In */}
      {!user?.id && (
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-white/40 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-white/60 text-sm font-medium">Account Required</div>
            <div className="text-white/40 text-xs mt-1">Please log in to manage push notification settings.</div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/80 text-sm">{message}</div>
        </div>
      )}
    </div>
  );
}
