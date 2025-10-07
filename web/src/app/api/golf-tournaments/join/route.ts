import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { JoinGolfTournamentRequest } from '@/types/golf';

// POST /api/golf-tournaments/join - Join golf tournament via invite code
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: JoinGolfTournamentRequest = await request.json();

    // Validate invite code
    if (!body.invite_code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find tournament by invite code
    const { data: tournament, error: tournamentError } = await supabase
      .from('golf_tournaments')
      .select('*')
      .eq('invite_code', body.invite_code.toUpperCase())
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if tournament is joinable
    if (tournament.status !== 'setup' && tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Tournament is not accepting new players' },
        { status: 400 }
      );
    }

    // Check if max players reached
    if (tournament.current_players >= tournament.max_players) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const { data: existingParticipant } = await supabase
      .from('golf_tournament_participants')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this tournament', tournament },
        { status: 400 }
      );
    }

    // Get user name
    const { data: userData } = await supabase.auth.getUser();
    const defaultName = userData.user?.user_metadata?.name ||
                        userData.user?.email?.split('@')[0] ||
                        'Player';

    const playerName = body.player_name || defaultName;
    const handicap = body.handicap || 0;

    // Add participant
    const { data: participant, error: participantError } = await supabase
      .from('golf_tournament_participants')
      .insert({
        tournament_id: tournament.id,
        user_id: user.id,
        player_name: playerName,
        handicap: handicap,
        status: 'active',
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error adding participant:', participantError);
      return NextResponse.json(
        { error: 'Failed to join tournament', details: participantError.message },
        { status: 500 }
      );
    }

    // Update tournament player count
    const { error: updateError } = await supabase
      .from('golf_tournaments')
      .update({
        current_players: tournament.current_players + 1
      })
      .eq('id', tournament.id);

    if (updateError) {
      console.error('Error updating player count:', updateError);
      // Don't fail the request, count will be recalculated later
    }

    // Create activity feed entry
    await supabase.from('golf_activity_feed').insert({
      tournament_id: tournament.id,
      participant_id: participant.id,
      activity_type: 'comment',
      message: `${playerName} joined the tournament! 🏌️`,
      metadata: { user_id: user.id },
    });

    return NextResponse.json({
      message: 'Successfully joined tournament',
      tournament,
      participant,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
