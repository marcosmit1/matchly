import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { SendGolfFineRequest } from '@/types/golf';

// POST /api/golf-tournaments/[tournamentId]/fines - Send a fine to another player
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

    const body: SendGolfFineRequest = await request.json();

    // Validate required fields
    if (!body.to_participant_id || !body.reason || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Recipient, reason, and amount are required' },
        { status: 400 }
      );
    }

    // Verify recipient participant exists
    const { data: toParticipant, error: toParticipantError } = await supabase
      .from('golf_tournament_participants')
      .select('id, player_name, user_id')
      .eq('id', body.to_participant_id)
      .eq('tournament_id', tournamentId)
      .single();

    if (toParticipantError || !toParticipant) {
      return NextResponse.json(
        { error: 'Recipient participant not found' },
        { status: 404 }
      );
    }

    // Can't fine yourself
    if (toParticipant.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot fine yourself!' },
        { status: 400 }
      );
    }

    // Get sender info
    const { data: userData } = await supabase.auth.getUser();
    const senderName = userData.user?.user_metadata?.name ||
                       userData.user?.email?.split('@')[0] ||
                       'Someone';

    // Insert fine
    const { data: fine, error: fineError } = await supabase
      .from('golf_fines')
      .insert({
        tournament_id: tournamentId,
        from_user_id: user.id,
        to_participant_id: body.to_participant_id,
        amount: body.amount,
        reason: body.reason,
        hole_number: body.hole_number,
        status: 'pending',
      })
      .select()
      .single();

    if (fineError) {
      console.error('Error sending fine:', fineError);
      return NextResponse.json(
        { error: 'Failed to send fine' },
        { status: 500 }
      );
    }

    // Create activity feed entry
    const amountStr = body.amount.toFixed(2);
    const message = body.hole_number
      ? `${senderName} fined ${toParticipant.player_name} $${amountStr} on hole ${body.hole_number}: "${body.reason}" 😂`
      : `${senderName} fined ${toParticipant.player_name} $${amountStr}: "${body.reason}" 😂`;

    await supabase.from('golf_activity_feed').insert({
      tournament_id: tournamentId,
      participant_id: body.to_participant_id,
      activity_type: 'fine',
      hole_number: body.hole_number,
      message,
      metadata: { fine_id: fine.id, amount: body.amount, from_user_id: user.id },
    });

    return NextResponse.json({
      message: 'Fine sent successfully',
      fine,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/fines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/golf-tournaments/[tournamentId]/fines - Get all fines
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

    const { data: fines, error } = await supabase
      .from('golf_fines')
      .select(`
        *,
        to_participant:golf_tournament_participants!to_participant_id(
          id,
          player_name,
          user:users(id, email, raw_user_meta_data)
        ),
        from_user:users!from_user_id(id, email, raw_user_meta_data)
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fines:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fines' },
        { status: 500 }
      );
    }

    return NextResponse.json({ fines });

  } catch (error) {
    console.error('Error in GET /api/golf-tournaments/[tournamentId]/fines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
