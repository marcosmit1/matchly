import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
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

    // Get matches for this league
    const { data: matches, error: matchesError } = await supabase
      .from('league_matches')
      .select(`
        id,
        box_id,
        player1_id,
        player2_id,
        player1_username,
        player2_username,
        player1_score,
        player2_score,
        status,
        scheduled_at,
        played_at,
        league_boxes (
          id,
          name,
          level
        )
      `)
      .eq('league_id', leagueId)
      .order('scheduled_at', { ascending: true });

    if (matchesError) {
      console.error('Matches query error:', matchesError);
      // If table doesn't exist or has issues, return empty array
      if (matchesError.code === '42P01' || matchesError.message.includes('does not exist')) {
        return NextResponse.json({
          matches: [],
          allMatches: [],
          message: 'Matches table not set up yet. Please run the database setup script.'
        });
      }
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    // Filter matches for current user
    const userMatches = matches.filter(match => 
      match.player1_id === user.id || match.player2_id === user.id
    );

    return NextResponse.json({
      matches: userMatches,
      allMatches: matches
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}