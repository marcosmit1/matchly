/**
 * Tournament-specific push notification functions
 */

import { SEND_PUSH_NOTIFICATION_TO_USERS, type PUSH_NOTIFICATION_PAYLOAD } from "@/lib/push-notifications-server";

/**
 * Send push notifications to all registered players in a tournament
 */
export async function SEND_TOURNAMENT_INVITE_NOTIFICATIONS(
  playerEmails: string[],
  tournamentId: string,
  tournamentName: string,
  creatorName: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    console.log("🏆 Starting tournament invite notifications:", {
      tournamentId,
      tournamentName,
      creatorName,
      playerEmails
    });

    // We need to get user IDs from emails using Supabase
    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    // Get users by their email addresses
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email")
      .in("email", playerEmails);

    if (error) {
      console.error("❌ Error fetching users for tournament invites:", error);
      return { success: false, sent: 0, failed: playerEmails.length };
    }

    if (!users || users.length === 0) {
      console.log("🔕 No registered users found for tournament invites");
      return { success: true, sent: 0, failed: 0 };
    }

    const registeredUserIds = users.map(user => user.id);
    const foundEmails = users.map(user => user.email);
    const notFoundCount = playerEmails.filter(email => !foundEmails.includes(email)).length;

    console.log("📧 Tournament invite recipients:", {
      totalEmails: playerEmails.length,
      foundUsers: users.length,
      notRegistered: notFoundCount,
      userIds: registeredUserIds
    });

    // Create notification payload
    const payload: PUSH_NOTIFICATION_PAYLOAD = {
      title: "🏆 Tournament Invite!",
      body: `${creatorName} invited you to join the "${tournamentName}" tournament! Ready to compete?`,
      url: `/game/tournament/view?id=${tournamentId}`,
    };

    console.log("📨 Sending tournament invite notifications:", payload);

    // Send the push notification directly using the server function
    const result = await SEND_PUSH_NOTIFICATION_TO_USERS(registeredUserIds, payload);

    console.log("✅ Tournament invite notifications sent:", result);

    return {
      success: result.success > 0,
      sent: result.success,
      failed: result.failed + notFoundCount,
    };

  } catch (error) {
    console.error("❌ Error sending tournament invite notifications:", error);
    return { success: false, sent: 0, failed: playerEmails.length };
  }
}
