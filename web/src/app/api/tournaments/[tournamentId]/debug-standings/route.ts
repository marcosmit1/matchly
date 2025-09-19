import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { tournamentId } = await params;

    console.log('Debug: Tournament ID:', tournamentId);

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('tournaments')
      .select('id, name, status')
      .eq('id', tournamentId)
      .single();

    console.log('Debug: Tournament data:', testData);
    console.log('Debug: Tournament error:', testError);

    // Get tournament players
    const { data: players, error: playersError } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', tournamentId);

    console.log('Debug: Players data:', players);
    console.log('Debug: Players error:', playersError);

    // Get all matches
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId);

    console.log('Debug: Matches data:', matches);
    console.log('Debug: Matches error:', matchesError);

    // Get completed matches only
    const { data: completedMatches, error: completedError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed');

    console.log('Debug: Completed matches data:', completedMatches);
    console.log('Debug: Completed matches error:', completedError);

    return NextResponse.json({
      success: true,
      debug: {
        tournament: testData,
        tournamentError: testError,
        players: players,
        playersError: playersError,
        allMatches: matches,
        allMatchesError: matchesError,
        completedMatches: completedMatches,
        completedMatchesError: completedError,
        playerCount: players?.length || 0,
        matchCount: matches?.length || 0,
        completedMatchCount: completedMatches?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in debug standings API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
