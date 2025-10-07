import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const supabase = await createClient();
    const { tournamentId } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('golf_tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (tournament.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the tournament creator can restart the tournament' },
        { status: 403 }
      );
    }

    // Reset tournament status and clear fourball assignments
    const updates = await Promise.all([
      // Reset tournament status
      supabase
        .from('golf_tournaments')
        .update({ status: 'setup' })
        .eq('id', tournamentId),

      // Clear fourball assignments
      supabase
        .from('golf_tournament_participants')
        .update({
          fourball_number: null,
          position_in_fourball: null
        })
        .eq('tournament_id', tournamentId),

      // Clear any existing scores
      supabase
        .from('golf_scores')
        .delete()
        .eq('tournament_id', tournamentId)
    ]);

    const hasError = updates.some(result => result.error);
    if (hasError) {
      console.error('Error restarting tournament:', updates);
      return NextResponse.json(
        { error: 'Failed to restart tournament' },
        { status: 500 }
      );
    }

    // Add activity feed entry
    await supabase.from('golf_activity_feed').insert({
      tournament_id: tournamentId,
      activity_type: 'comment',
      message: `Tournament restarted by ${user.email}. All scores and assignments cleared.`,
    });

    return NextResponse.json({
      message: 'Tournament restarted successfully',
      tournament_id: tournamentId
    });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/restart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
