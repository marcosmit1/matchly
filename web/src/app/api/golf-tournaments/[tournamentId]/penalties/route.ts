import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { GolfPenaltyType } from '@/types/golf';

// POST /api/golf-tournaments/[tournamentId]/penalties - Report a penalty
export async function POST(
  request: Request,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const supabase = await createClient();
    const tournamentId = params.tournamentId;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.participant_id || !body.hole_number || !body.penalty_type) {
      return NextResponse.json(
        { error: 'Participant ID, hole number, and penalty type are required' },
        { status: 400 }
      );
    }

    // Verify participant exists in tournament
    const { data: participant, error: participantError } = await supabase
      .from('golf_tournament_participants')
      .select('id, player_name')
      .eq('id', body.participant_id)
      .eq('tournament_id', tournamentId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found in this tournament' },
        { status: 404 }
      );
    }

    // Insert penalty
    const { data: penalty, error: penaltyError } = await supabase
      .from('golf_penalties')
      .insert({
        tournament_id: tournamentId,
        participant_id: body.participant_id,
        hole_number: body.hole_number,
        penalty_type: body.penalty_type,
        strokes_added: body.strokes_added || 1,
        reported_by_user_id: user.id,
        note: body.note,
      })
      .select()
      .single();

    if (penaltyError) {
      console.error('Error reporting penalty:', penaltyError);
      return NextResponse.json(
        { error: 'Failed to report penalty' },
        { status: 500 }
      );
    }

    // Create activity feed entry
    const penaltyEmojis: Record<GolfPenaltyType, string> = {
      water: '💦',
      ob: '🌲',
      bunker: '🏖️',
      '3_putt': '⛳',
      lost_ball: '🔍',
      other: '⚠️',
    };

    const penaltyLabels: Record<GolfPenaltyType, string> = {
      water: 'water hazard',
      ob: 'out of bounds',
      bunker: 'bunker',
      '3_putt': '3-putt',
      lost_ball: 'lost ball',
      other: 'penalty',
    };

    const emoji = penaltyEmojis[body.penalty_type as GolfPenaltyType] || '⚠️';
    const label = penaltyLabels[body.penalty_type as GolfPenaltyType] || 'penalty';

    await supabase.from('golf_activity_feed').insert({
      tournament_id: tournamentId,
      participant_id: body.participant_id,
      activity_type: 'penalty',
      hole_number: body.hole_number,
      message: `${participant.player_name} hit ${label} on hole ${body.hole_number} ${emoji}`,
      metadata: { penalty_type: body.penalty_type, reported_by: user.id },
    });

    return NextResponse.json({
      message: 'Penalty reported successfully',
      penalty,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/penalties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/golf-tournaments/[tournamentId]/penalties - Get all penalties
export async function GET(
  request: Request,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const supabase = await createClient();
    const tournamentId = params.tournamentId;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('golf_penalties')
      .select(`
        *,
        participant:golf_tournament_participants(
          id,
          player_name,
          user:users(id, email, raw_user_meta_data)
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data: penalties, error } = await query;

    if (error) {
      console.error('Error fetching penalties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch penalties' },
        { status: 500 }
      );
    }

    return NextResponse.json({ penalties });

  } catch (error) {
    console.error('Error in GET /api/golf-tournaments/[tournamentId]/penalties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
