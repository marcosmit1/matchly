import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { SubmitGolfScoreRequest } from '@/types/golf';

// Helper to determine score type (eagle, birdie, par, bogey, etc.)
function determineScoreType(strokes: number, par: number) {
  const vsPar = strokes - par;
  return {
    is_eagle: vsPar <= -2,
    is_birdie: vsPar === -1,
    is_par: vsPar === 0,
    is_bogey: vsPar === 1,
    is_double_bogey_plus: vsPar >= 2,
  };
}

// POST /api/golf-tournaments/[tournamentId]/scores - Submit score for a hole
export async function POST(
  request: Request,
  context: { params: Promise<{ tournamentId: string }> }
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

    const body: SubmitGolfScoreRequest = await request.json();

    // Validate required fields
    if (!body.hole_number || !body.strokes) {
      return NextResponse.json(
        { error: 'Hole number and strokes are required' },
        { status: 400 }
      );
    }

    if (body.strokes < 1 || body.strokes > 15) {
      return NextResponse.json(
        { error: 'Strokes must be between 1 and 15' },
        { status: 400 }
      );
    }

    // Get participant for this user or guest in this tournament
    const { data: participant, error: participantError } = await supabase
      .from('golf_tournament_participants')
      .select('id, player_name, tournament_id, is_guest')
      .eq('tournament_id', tournamentId)
      .eq('id', body.participant_id)  // Use the participant_id from the request instead of user_id
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found in this tournament' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this participant's score
    // Allow if: user is tournament creator OR user is a participant in the tournament
    const { data: tournament } = await supabase
      .from('golf_tournaments')
      .select('created_by')
      .eq('id', tournamentId)
      .single();

    // Check if user is a participant in this tournament
    const { data: userParticipant } = await supabase
      .from('golf_tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single();

    const hasPermission = tournament?.created_by === user.id || userParticipant !== null;
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to update this score' },
        { status: 403 }
      );
    }

    // Get hole information
    const { data: hole, error: holeError } = await supabase
      .from('golf_holes')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('hole_number', body.hole_number)
      .single();

    if (holeError || !hole) {
      return NextResponse.json(
        { error: 'Invalid hole number for this tournament' },
        { status: 404 }
      );
    }

    // Determine score type
    const scoreType = determineScoreType(body.strokes, hole.par);

    // Insert or update score
    const scoreData = {
      tournament_id: tournamentId,
      participant_id: participant.id,
      hole_number: body.hole_number,
      strokes: body.strokes,
      putts: body.putts,
      fairway_hit: body.fairway_hit,
      green_in_regulation: body.green_in_regulation,
      ...scoreType,
    };

    const { data: score, error: scoreError } = await supabase
      .from('golf_scores')
      .upsert(scoreData, {
        onConflict: 'tournament_id,participant_id,hole_number',
      })
      .select()
      .single();

    if (scoreError) {
      console.error('Error submitting score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to submit score', details: scoreError.message },
        { status: 500 }
      );
    }

    // Process penalties if provided
    if (body.penalties && body.penalties.length > 0) {
      const penaltiesToInsert = body.penalties.map(penalty => ({
        tournament_id: tournamentId,
        participant_id: participant.id,
        hole_number: body.hole_number,
        penalty_type: penalty.penalty_type,
        strokes_added: 1, // Standard penalty is 1 stroke
        reported_by_user_id: user.id,
        note: penalty.note,
      }));

      const { error: penaltiesError } = await supabase
        .from('golf_penalties')
        .insert(penaltiesToInsert);

      if (penaltiesError) {
        console.error('Error inserting penalties:', penaltiesError);
        // Don't fail the whole request, penalties are supplementary
      }
    }

    // Create activity feed entries for notable scores
    const vsPar = body.strokes - hole.par;
    let activityMessage = null;

    if (scoreType.is_eagle) {
      activityMessage = `${participant.player_name} just eagled hole ${body.hole_number}! 🦅`;
    } else if (scoreType.is_birdie) {
      activityMessage = `${participant.player_name} birdied hole ${body.hole_number}! 🐦`;
    } else if (vsPar >= 3) {
      // Triple bogey or worse
      activityMessage = `${participant.player_name} had a rough time on hole ${body.hole_number} (+${vsPar}) 😅`;
    }

    if (activityMessage) {
      await supabase.from('golf_activity_feed').insert({
        tournament_id: tournamentId,
        participant_id: participant.id,
        activity_type: 'score',
        hole_number: body.hole_number,
        message: activityMessage,
        metadata: { strokes: body.strokes, par: hole.par, vs_par: vsPar },
      });
    }

    // Also create activity for penalties
    if (body.penalties && body.penalties.length > 0) {
      const penaltyMessages = body.penalties.map(p => {
        const emoji = {
          water: '💦',
          ob: '🌲',
          bunker: '🏖️',
          '3_putt': '⛳',
          lost_ball: '🔍',
          other: '⚠️',
        }[p.penalty_type];

        const label = {
          water: 'water',
          ob: 'OB',
          bunker: 'bunker',
          '3_putt': '3-putt',
          lost_ball: 'lost ball',
          other: 'penalty',
        }[p.penalty_type];

        return `${participant.player_name} hit ${label} on hole ${body.hole_number} ${emoji}`;
      });

      for (const message of penaltyMessages) {
        await supabase.from('golf_activity_feed').insert({
          tournament_id: tournamentId,
          participant_id: participant.id,
          activity_type: 'penalty',
          hole_number: body.hole_number,
          message,
        });
      }
    }

    return NextResponse.json({
      message: 'Score submitted successfully',
      score,
      vs_par: vsPar,
      score_label: vsPar <= -2 ? 'Eagle' : vsPar === -1 ? 'Birdie' : vsPar === 0 ? 'Par' : vsPar === 1 ? 'Bogey' : `+${vsPar}`,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/golf-tournaments/[tournamentId]/scores - Get all scores for tournament
export async function GET(
  request: Request,
  context: { params: Promise<{ tournamentId: string }> }
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

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const holeNumber = searchParams.get('hole_number');

    let query = supabase
      .from('golf_scores')
      .select(`
        *,
        participant:golf_tournament_participants(
          id,
          player_name,
          fourball_number,
          user:users(id, email, raw_user_meta_data)
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('hole_number', { ascending: true });

    // Filter by participant if specified
    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    // Filter by hole if specified
    if (holeNumber) {
      query = query.eq('hole_number', parseInt(holeNumber));
    }

    const { data: scores, error } = await query;

    if (error) {
      console.error('Error fetching scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    return NextResponse.json({ scores });

  } catch (error) {
    console.error('Error in GET /api/golf-tournaments/[tournamentId]/scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
