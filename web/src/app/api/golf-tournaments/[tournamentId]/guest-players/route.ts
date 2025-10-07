import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/golf-tournaments/[tournamentId]/guest-players - Add guest player
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

    const body = await request.json();

    // Validate name
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Guest player name is required' },
        { status: 400 }
      );
    }

    // Verify tournament exists and user is the creator
    const { data: tournament, error: tournamentError } = await supabase
      .from('golf_tournaments')
      .select('id, created_by, max_players')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only tournament creator can add guest players' },
        { status: 403 }
      );
    }

    // Check if max players reached
    const { count } = await supabase
      .from('golf_tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (count !== null && tournament.max_players && count >= tournament.max_players) {
      return NextResponse.json(
        { error: 'Maximum number of players reached' },
        { status: 400 }
      );
    }

    // Add guest player
    const { data: participant, error: participantError } = await supabase
      .from('golf_tournament_participants')
      .insert({
        tournament_id: tournamentId,
        player_name: body.name.trim(),
        is_guest: true,
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error adding guest player:', participantError);
      return NextResponse.json(
        { error: 'Failed to add guest player' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Guest player added successfully',
      participant,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/golf-tournaments/[tournamentId]/guest-players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/golf-tournaments/[tournamentId]/guest-players/[participantId] would go in a separate file
