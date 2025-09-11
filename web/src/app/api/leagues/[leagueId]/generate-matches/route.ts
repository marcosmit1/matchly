import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin of this league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('created_by, status')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.created_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (league.status !== 'started') {
      return NextResponse.json({ error: 'League must be started first' }, { status: 400 });
    }

    // Get all boxes for this league
    console.log('Fetching boxes for league:', leagueId);
    const { data: boxes, error: boxesError } = await supabase
      .from('league_boxes')
      .select('id, level, name, max_players, league_id')
      .eq('league_id', leagueId)
      .order('level', { ascending: true });

    console.log('Boxes query result:', { boxes, boxesError });

    if (boxesError) {
      console.error('Boxes query error:', boxesError);
      return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
    }

    if (!boxes || boxes.length === 0) {
      console.log('No boxes found for league:', leagueId);
      return NextResponse.json({ error: 'No boxes found for this league' }, { status: 400 });
    }

    // Get box assignments separately
    const { data: assignments, error: assignmentsError } = await supabase
      .from('league_box_assignments')
      .select('box_id, user_id')
      .in('box_id', boxes.map(box => box.id));

    console.log('Assignments query result:', { assignments, assignmentsError });

    if (assignmentsError) {
      console.error('Assignments query error:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch box assignments' }, { status: 500 });
    }

    // Get user details separately - use service role to bypass RLS
    const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    console.log('Users query result:', { users, usersError });

    if (usersError) {
      console.error('Users query error:', usersError);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }

    // Create a map of user_id to username
    const userMap = new Map(users?.map(user => [user.id, user.username]) || []);
    
    // If no users found, create fallback usernames
    if (users?.length === 0) {
      console.log('No users found, creating fallback usernames');
      userIds.forEach((userId, index) => {
        userMap.set(userId, `Player${index + 1}`);
      });
    }

    const matches = [];

    // Generate matches for each box
    for (const box of boxes) {
      // Get players assigned to this box
      const boxAssignments = assignments?.filter(a => a.box_id === box.id) || [];
      
      if (boxAssignments.length < 2) {
        console.log(`Skipping box ${box.id} - only ${boxAssignments.length} players`);
        continue; // Skip boxes with less than 2 players
      }

      console.log(`Generating matches for box ${box.id} with ${boxAssignments.length} players`);

      // Generate round-robin matches (everyone plays everyone once)
      for (let i = 0; i < boxAssignments.length; i++) {
        for (let j = i + 1; j < boxAssignments.length; j++) {
          const player1 = boxAssignments[i];
          const player2 = boxAssignments[j];

          const player1Username = userMap.get(player1.user_id) || 'Unknown';
          const player2Username = userMap.get(player2.user_id) || 'Unknown';

          matches.push({
            league_id: leagueId,
            box_id: box.id,
            player1_id: player1.user_id,
            player2_id: player2.user_id,
            player1_username: player1Username,
            player2_username: player2Username,
            status: 'scheduled',
            scheduled_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // Insert all matches
    const { data: insertedMatches, error: insertError } = await supabase
      .from('league_matches')
      .insert(matches)
      .select();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create matches' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Matches generated successfully',
      matches: insertedMatches,
      totalMatches: insertedMatches.length
    });

  } catch (error) {
    console.error('Error generating matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
