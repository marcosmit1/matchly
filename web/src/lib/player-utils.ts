/**
 * Utility functions for formatting player names and display
 */

import { PLAYER, USER } from "@/types/game";

/**
 * Formats a player's name for display, preferring username over email
 * @param player - The player object
 * @param user - Optional user object with username data
 * @returns Formatted display name
 */
export function formatPlayerName(player: PLAYER | null | undefined, user?: USER | null): string {
  if (!player || !player.name) {
    return "Player";
  }

  // If we have user data and a username, use it
  if (user?.username && user.username.trim()) {
    return user.username.trim();
  }

  const name = player.name.trim();
  
  // If the name contains @ (likely an email), extract the username part
  if (name.includes("@")) {
    const username = name.split("@")[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return username
      .replace(/[._]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Return the name as-is if it's not an email
  return name;
}

/**
 * Formats a string (like drinking player name) for display, using the part before @ if it's an email
 * @param name - The name string
 * @returns Formatted display name
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name) {
    return "Player";
  }

  const nameStr = name.trim();
  
  // If the name contains @ (likely an email), extract the username part
  if (nameStr.includes("@")) {
    const username = nameStr.split("@")[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return username
      .replace(/[._]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Return the name as-is if it's not an email
  return nameStr;
}

/**
 * Formats a user's name for display, preferring username over first/last name over email
 * @param user - The user object
 * @returns Formatted display name
 */
export function formatUserDisplayName(user: USER | null | undefined): string {
  if (!user) {
    return "Player";
  }

  // Prefer username if available
  if (user.username && user.username.trim()) {
    return user.username.trim();
  }

  // Fall back to first/last name if available
  const hasName = (user.first_name ?? "").trim() || (user.last_name ?? "").trim();
  if (hasName) {
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  }

  // Final fallback to formatted email
  return formatDisplayName(user.email);
}
