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

    // Get league participants first
    const { data: participants, error: participantsError } = await supabase
      .from('league_participants')
      .select('id, user_id, status, joined_at')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    // Get user details separately using service role to bypass RLS
    const userIds = participants?.map(p => p.user_id) || [];
    console.log("API Debug - Service role fetching user IDs:", userIds);
    
    const serviceSupabase = await createServiceClient();
    
    const { data: users, error: usersError } = await serviceSupabase
      .from('users')
      .select('id, username')
      .in('id', userIds);
    
    console.log("API Debug - Service role users found:", users);
    console.log("API Debug - Service role users error:", usersError);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      // Continue without usernames if users fetch fails
    }

    // Create a map of user_id to username
    const userMap = new Map(users?.map(user => [user.id, user.username]) || []);
    
    // Debug logging
    console.log("API Debug - User IDs:", userIds);
    console.log("API Debug - Users found:", users);
    console.log("API Debug - User map:", Object.fromEntries(userMap));

    // Transform the data to include username
    const transformedParticipants = participants?.map(participant => ({
      id: participant.id,
      user_id: participant.user_id,
      status: participant.status,
      joined_at: participant.joined_at,
      username: userMap.get(participant.user_id) || `Player ${participant.user_id.slice(0, 8)}`
    })) || [];

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
