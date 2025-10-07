import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { AssignFourballsRequest } from '@/types/golf';

// Helper function to auto-assign participants to fourballs
function autoAssignFourballs(participantIds: string[]): Array<{ participant_id: string; fourball_number: number; position_in_fourball: number }> {
  const assignments = [];
  const shuffled = [...participantIds].sort(() => Math.random() - 0.5); // Shuffle for randomness

  let fourballNumber = 1;
  let position = 1;

  for (let i = 0; i < shuffled.length; i++) {
    assignments.push({
      participant_id: shuffled[i],
      fourball_number: fourballNumber,
      position_in_fourball: position,
    });

    position++;

    // Move to next fourball after 4 players (allow smaller groups for last fourball)
    if (position > 4 && i < shuffled.length - 1) {
      fourballNumber++;
      position = 1;
    }
  }

  return assignments;
}

// POST /api/golf-tournaments/[tournamentId]/start - Start tournament and assign fourballs
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
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
        { error: 'Only the tournament creator can start the tournament' },
        { status: 403 }
      );
    }

    // Check tournament status
    if (tournament.status !== 'setup') {
      return NextResponse.json(
        { error: 'Tournament has already started or is completed' },
        { status: 400 }
      );
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('golf_tournament_participants')
      .select('id, player_name, fourball_number, position_in_fourball')
      .eq('tournament_id', tournamentId)
      .eq('status', 'active');

    console.log('👥 Current participants:', participants);

    if (participantsError) {
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    if (!participants || participants.length < 1) {
      return NextResponse.json(
        { error: 'At least 1 player is required to start the tournament' },
        { status: 400 }
      );
    }

    const body: AssignFourballsRequest = await request.json().catch(() => ({}));

    let assignments;

    if (body.manual_assignments && body.manual_assignments.length > 0) {
      // Use manual assignments
      assignments = body.manual_assignments;

      // Validate manual assignments
      const assignedIds = new Set(assignments.map(a => a.participant_id));
      const participantIds = new Set(participants.map(p => p.id));

      if (assignedIds.size !== participantIds.size) {
        return NextResponse.json(
          { error: 'Manual assignments must include all participants' },
          { status: 400 }
        );
      }
    } else {
      // Auto-assign fourballs
      assignments = autoAssignFourballs(participants.map(p => p.id));
    }

    // Update participants with fourball assignments
    console.log('🎯 Assignments to process:', assignments);

    const updatePromises = assignments.map(async (assignment) => {
      console.log('📝 Processing assignment:', assignment);
      try {
        const result = await supabase
          .from('golf_tournament_participants')
          .update({
            fourball_number: assignment.fourball_number,
            position_in_fourball: assignment.position_in_fourball,
          })
          .eq('id', assignment.participant_id);

        console.log('✅ Update result for participant', assignment.participant_id, ':', result);
        return result;
      } catch (error: unknown) {
        console.error('❌ Update error for participant', assignment.participant_id, ':', error);
        throw error;
      }
    });

    console.log('⏳ Executing all updates...');
    const results = await Promise.all(updatePromises);
    console.log('📊 All update results:', results);
    const hasError = results.some((result: { error: unknown }) => result.error);

    if (hasError) {
      console.error('Error assigning fourballs:', results);
      return NextResponse.json(
        { error: 'Failed to assign fourballs' },
        { status: 500 }
      );
    }

    // Verify the assignments were saved
    const { data: verifyParticipants, error: verifyError } = await supabase
      .from('golf_tournament_participants')
      .select('id, player_name, fourball_number, position_in_fourball')
      .eq('tournament_id', tournamentId)
      .eq('status', 'active');

    console.log('🔍 Verifying final participant state:', verifyParticipants);

    // Update tournament status to active
    const { error: updateError } = await supabase
      .from('golf_tournaments')
      .update({ status: 'active' })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Error updating tournament status:', updateError);
      return NextResponse.json(
        { error: 'Failed to start tournament' },
        { status: 500 }
      );
    }

    // Get number of fourballs created
    const fourballCount = Math.max(...assignments.map(a => a.fourball_number));

    // Create activity feed entry
    await supabase.from('golf_activity_feed').insert({
      tournament_id: tournamentId,
      activity_type: 'comment',
      message: `Tournament started! ${participants.length} players in ${fourballCount} fourball${fourballCount > 1 ? 's' : ''}. Let's play! 🏌️⛳`,
      metadata: { fourball_count: fourballCount, player_count: participants.length },
    });

    return NextResponse.json({
      message: 'Tournament started successfully',
      tournament_id: tournamentId,
      participants_count: participants.length,
      fourballs_count: fourballCount,
      assignments,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
