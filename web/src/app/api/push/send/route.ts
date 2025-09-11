import { NextResponse } from "next/server";
import {
  SEND_PUSH_NOTIFICATION_TO_USERS,
  SEND_PUSH_NOTIFICATION_TO_ALL,
  type PUSH_NOTIFICATION_PAYLOAD,
} from "@/lib/push-notifications-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const bodyPayload = await request.json();
    console.log("📨 Received push notification request with body:", JSON.stringify(bodyPayload, null, 2));

    const { audience_user_ids, title, body, url, image, tag } = bodyPayload;

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    // Create push notification payload
    const payload: PUSH_NOTIFICATION_PAYLOAD = {
      title,
      body,
      url,
      image,
      tag,
    };

    let result;

    if (audience_user_ids && audience_user_ids.length > 0) {
      // Send to specific users
      console.log("➡️ Sending to specific user IDs:", audience_user_ids);
      result = await SEND_PUSH_NOTIFICATION_TO_USERS(audience_user_ids, payload);
      return NextResponse.json({
        success: result.success > 0,
        sent: result.success,
        failed: result.failed,
        message: `Push notifications sent to ${result.success} users, ${result.failed} failed`,
      });
    } else {
      // Send to all users
      console.log("➡️ Sending to ALL users");
      result = await SEND_PUSH_NOTIFICATION_TO_ALL(payload);
      return NextResponse.json({
        success: result.success > 0,
        sent: result.success,
        failed: result.failed,
        message: `Push notifications sent to ${result.success} users, ${result.failed} failed`,
      });
    }
  } catch (e: any) {
    console.error("Error sending push notifications:", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
