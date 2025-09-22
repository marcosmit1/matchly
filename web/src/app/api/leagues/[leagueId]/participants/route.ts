import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = await params;

    // Check if league exists and user can access it (simple check)
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, created_by, status')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      console.error("League access error:", leagueError);
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    console.log(`User ${user.id} accessing league ${leagueId}, creator: ${league.created_by}`);

    // For now, allow any authenticated user to view participants of any league
    // This matches the behavior of public leagues in the discover page

    // Use service client to fetch all participants (bypasses RLS)
    const serviceSupabase = await createServiceClient();
    const { data: participants, error: participantsError } = await serviceSupabase
      .from('league_participants')
      .select('id, user_id, guest_player_id, status, joined_at')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    console.log(`Found ${participants?.length || 0} participants for league ${leagueId}:`, participants);

    // Get user and guest player details separately
    const userIds = participants?.filter(p => p.user_id).map(p => p.user_id) || [];
    const guestPlayerIds = participants?.filter(p => p.guest_player_id).map(p => p.guest_player_id) || [];

    // Fetch user details using service client
    const { data: users, error: usersError } = await serviceSupabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      // Continue without usernames if users fetch fails
    }

    // Fetch guest player details
    const { data: guestPlayers } = guestPlayerIds.length > 0
      ? await supabase.from("guest_players").select("id, name").in("id", guestPlayerIds)
      : { data: [] };

    // Create lookup maps
    const userMap = new Map(users?.map(user => [user.id, user.username]) || []);
    const guestMap = new Map(guestPlayers?.map(guest => [guest.id, guest.name]) || []);

    // Transform the data to include username
    const transformedParticipants = participants?.map(participant => {
      const isGuest = !!participant.guest_player_id;
      const username = isGuest
        ? (guestMap.get(participant.guest_player_id)?.charAt(0).toUpperCase() + guestMap.get(participant.guest_player_id)?.slice(1) || 'Guest Player')
        : (userMap.get(participant.user_id)?.charAt(0).toUpperCase() + userMap.get(participant.user_id)?.slice(1) || `Player ${participant.user_id.slice(0, 8)}`);

      return {
        id: participant.id,
        user_id: participant.user_id,
        guest_player_id: participant.guest_player_id,
        status: participant.status,
        joined_at: participant.joined_at,
        username,
        is_guest: isGuest
      };
    }) || [];

    return NextResponse.json({
      participants: transformedParticipants,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
