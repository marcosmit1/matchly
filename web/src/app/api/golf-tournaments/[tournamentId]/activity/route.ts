import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: { tournamentId: string } }
) {
  try {
    const supabase = await createClient();
    const params = await context.params;
    const { tournamentId } = params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all scores for stats calculation
    const { data: scores } = await supabase
      .from('golf_scores')
      .select(`
        participant_id,
        hole_number,
        strokes,
        putts,
        fairway_hit,
        bunker,
        green_in_regulation,
        created_at
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });

    // Calculate streaks and stats
    const playerStats = new Map();
    scores?.forEach(score => {
      if (!playerStats.has(score.participant_id)) {
        playerStats.set(score.participant_id, {
          fairwayStreak: 0,
          bunkerCount: 0,
          totalHoles: 0,
          consecutivePars: 0,
          lastThreeHoles: []
        });
      }
      
      const stats = playerStats.get(score.participant_id);
      stats.totalHoles++;
      
      // Update fairway streak
      if (score.fairway_hit) {
        stats.fairwayStreak++;
      } else {
        stats.fairwayStreak = 0;
      }
      
      // Update bunker count
      if (score.bunker) {
        stats.bunkerCount++;
      }
      
      // Track last three holes for patterns
      stats.lastThreeHoles.push(score);
      if (stats.lastThreeHoles.length > 3) {
        stats.lastThreeHoles.shift();
      }
    });

    // Get activity feed entries
    const { data: activities, error } = await supabase
      .from('golf_activity_feed')
      .select(`
        id,
        tournament_id,
        participant_id,
        activity_type,
        hole_number,
        message,
        metadata,
        created_at,
        participant:golf_tournament_participants(
          id,
          player_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activity feed:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity feed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activities: activities.map(activity => ({
        ...activity,
        created_at: new Date(activity.created_at).toISOString(),
      })),
    });

  } catch (error) {
    console.error('Error in GET /api/golf-tournaments/[tournamentId]/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
