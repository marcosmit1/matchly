import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; matchId: string }> }
) {
  try {
    const { leagueId, matchId } = await params;
    const { player1_score, player2_score } = await request.json();
    
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('league_matches')
      .select('*')
      .eq('id', matchId)
      .eq('league_id', leagueId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is one of the players
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to update this match' }, { status: 403 });
    }

    // Validate scores
    if (player1_score < 0 || player2_score < 0) {
      return NextResponse.json({ error: 'Scores must be non-negative' }, { status: 400 });
    }

    // Update the match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('league_matches')
      .update({
        player1_score,
        player2_score,
        status: 'completed',
        played_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }

    // Update player stats in the box
    await updatePlayerStats(leagueId, match.box_id, match.player1_id, match.player2_id, player1_score, player2_score);

    return NextResponse.json({
      message: 'Match updated successfully',
      match: updatedMatch
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updatePlayerStats(leagueId: string, boxId: string, player1Id: string, player2Id: string, player1Score: number, player2Score: number) {
  const supabase = await createClient();

  // Determine winner
  const player1Won = player1Score > player2Score;
  const player2Won = player2Score > player1Score;

  // Update player 1 stats
  const { data: player1Stats } = await supabase
    .from('league_box_standings')
    .select('*')
    .eq('league_id', leagueId)
    .eq('box_id', boxId)
    .eq('user_id', player1Id)
    .single();

  if (player1Stats) {
    await supabase
      .from('league_box_standings')
      .update({
        matches_played: player1Stats.matches_played + 1,
        wins: player1Stats.wins + (player1Won ? 1 : 0),
        losses: player1Stats.losses + (player1Won ? 0 : 1),
        points_for: player1Stats.points_for + player1Score,
        points_against: player1Stats.points_against + player2Score,
        points: player1Stats.points + (player1Won ? 3 : (player1Score === player2Score ? 1 : 0)),
        updated_at: new Date().toISOString()
      })
      .eq('id', player1Stats.id);
  }

  // Update player 2 stats
  const { data: player2Stats } = await supabase
    .from('league_box_standings')
    .select('*')
    .eq('league_id', leagueId)
    .eq('box_id', boxId)
    .eq('user_id', player2Id)
    .single();

  if (player2Stats) {
    await supabase
      .from('league_box_standings')
      .update({
        matches_played: player2Stats.matches_played + 1,
        wins: player2Stats.wins + (player2Won ? 1 : 0),
        losses: player2Stats.losses + (player2Won ? 0 : 1),
        points_for: player2Stats.points_for + player2Score,
        points_against: player2Stats.points_against + player1Score,
        points: player2Stats.points + (player2Won ? 3 : (player1Score === player2Score ? 1 : 0)),
        updated_at: new Date().toISOString()
      })
      .eq('id', player2Stats.id);
  }
}
