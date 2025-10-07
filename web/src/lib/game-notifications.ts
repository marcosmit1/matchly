/**
 * Game-specific push notification functions
 */

import { PLAYER } from "@/types/game";
import { SEND_PUSH_NOTIFICATION_TO_USERS, type PUSH_NOTIFICATION_PAYLOAD } from "@/lib/push-notifications-server";

/**
 * Send push notifications to all players in a game or tournament
 */
export async function SEND_GAME_INVITE_NOTIFICATIONS(
  players: PLAYER[], 
  gameId: string,
  creatorName: string,
  options?: { 
    isTournament?: boolean; 
    tournamentName?: string; 
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get all registered user IDs from the players
    const registeredUserIds = players
      .filter(player => player.isRegisteredUser && player.userId)
      .map(player => player.userId!);

    if (registeredUserIds.length === 0) {
      console.log("🔕 No registered users to notify");
      return { success: true, sent: 0, failed: 0 };
    }

    // Create notification payload - different for tournaments vs games
    const payload: PUSH_NOTIFICATION_PAYLOAD = options?.isTournament ? {
      title: "🏆 Tournament Invite!",
      body: `${creatorName} invited you to join the "${options.tournamentName || 'Tournament'}"! Ready to compete?`,
      url: `/game/tournament/view?id=${gameId}`,
    } : {
      title: "🏓 Game Invite!",
      body: `${creatorName} invited you to play! Ready to compete?`,
      url: `/game/${gameId}`,
    };

    console.log("📨 Sending game invite notifications:", {
      gameId,
      creatorName,
      playerCount: registeredUserIds.length,
      userIds: registeredUserIds,
      isTournament: options?.isTournament,
      notificationUrl: payload.url,
      payload
    });

    // Send the push notification directly using the server function
    const result = await SEND_PUSH_NOTIFICATION_TO_USERS(registeredUserIds, payload);
    
    console.log("✅ Game invite notifications sent:", result);

    return {
      success: result.success > 0,
      sent: result.success,
      failed: result.failed,
    };

  } catch (error) {
    console.error("❌ Error sending game invite notifications:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}
