import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { SEND_GAME_INVITE_NOTIFICATIONS } from "@/lib/game-notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name: string = (body?.name || "Tournament").toString();
    const teamsPayload = Array.isArray(body?.teams)
      ? body.teams
      : [];

    // Prefer v2 (teams with players) if payload has players
    const useV2 = teamsPayload.some((t: any) => t && (t.players?.length || 0) > 0);
    let data: any = null;
    let error: any = null;
    if (useV2) {
      ({ data, error } = await supabase.rpc("create_tournament_v2", { p_name: name, p_teams: teamsPayload }));
      // Fallback if v2 is missing (schema not deployed yet)
      if (error && /Could not find the function .*create_tournament_v2/i.test(error.message || "")) {
        const teamNames: string[] = teamsPayload
          .map((t: any) => (typeof t === "string" ? t : t?.name || ""))
          .filter(Boolean);
        const fallback = await supabase.rpc("create_tournament", { p_name: name, p_team_names: teamNames });
        data = fallback.data;
        error = fallback.error;
      }
    } else {
      const teamNames: string[] = teamsPayload.map((t: any) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean);
      ({ data, error } = await supabase.rpc("create_tournament", { p_name: name, p_team_names: teamNames }));
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const tournamentId = data;

    // Send tournament invite notifications
    try {
      // Get user's display name for the notification
      const { data: userProfile } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const creatorName = userProfile?.first_name && userProfile?.last_name
        ? `${userProfile.first_name} ${userProfile.last_name}`
        : userProfile?.email?.split('@')[0] || "Someone";

      // Extract all players from teams and convert to PLAYER objects
      const allPlayers: any[] = [];
      if (useV2 && teamsPayload) {
        for (const team of teamsPayload) {
          if (team?.players?.length) {
            for (const player of team.players) {
              // Check if player has userId (registered user)
              if (player?.userId && player.userId !== user.id) {
                allPlayers.push({
                  id: player.id || player.userId,
                  name: player.name || player.email?.split('@')[0] || "Player",
                  isRegisteredUser: true,
                  userId: player.userId
                });
              } else if (player?.email && player.email !== user.email) {
                // Try to look up user by email
                const { data: foundUser } = await supabase
                  .from("users")
                  .select("id, email")
                  .eq("email", player.email)
                  .single();
                
                if (foundUser && foundUser.id !== user.id) {
                  allPlayers.push({
                    id: foundUser.id,
                    name: player.name || player.email.split('@')[0],
                    isRegisteredUser: true,
                    userId: foundUser.id
                  });
                }
              }
            }
          }
        }
      }

      if (allPlayers.length > 0) {
        console.log("🏆 Sending tournament invite notifications to players:", allPlayers.map(p => ({ userId: p.userId, name: p.name })));
        const notificationResult = await SEND_GAME_INVITE_NOTIFICATIONS(
          allPlayers,
          tournamentId,
          creatorName,
          { 
            isTournament: true, 
            tournamentName: name 
          }
        );
        console.log("🏆 Tournament notification result:", notificationResult);
      } else {
        console.log("🏆 No registered players to notify for tournament");
      }
    } catch (notificationError) {
      console.error("❌ Failed to send tournament notifications:", notificationError);
      // Don't fail the tournament creation if notifications fail
    }

    return NextResponse.json({ id: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


