import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { invite_code } = await request.json();
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Joining league with invite code:', invite_code);

    // Find league by invite code
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('invite_code', invite_code)
      .eq('status', 'open')
      .single();

    if (leagueError || !league) {
      return NextResponse.json({ error: 'Invalid invite code or league is not open' }, { status: 400 });
    }

    console.log('Found league:', league.name);

    // Check if user is already a participant
    const { data: existingParticipant, error: participantError } = await supabase
      .from('league_participants')
      .select('*')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      return NextResponse.json({ error: 'You are already a participant in this league' }, { status: 400 });
    }

    // Check if league is full
    if (league.current_players >= league.max_players) {
      return NextResponse.json({ error: 'League is full' }, { status: 400 });
    }

    // Add user as participant
    const { error: insertError } = await supabase
      .from('league_participants')
      .insert({
        league_id: league.id,
        user_id: user.id,
        status: 'confirmed',
        joined_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting participant:', insertError);
      return NextResponse.json({ error: 'Failed to join league' }, { status: 500 });
    }

    // Update league player count
    const { error: updateError } = await supabase
      .from('leagues')
      .update({ current_players: league.current_players + 1 })
      .eq('id', league.id);

    if (updateError) {
      console.error('Error updating player count:', updateError);
      // Don't fail the request, just log the error
    }

    console.log('Successfully joined league:', league.name);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined league',
      league_id: league.id,
      league_name: league.name
    });

  } catch (error) {
    console.error('Error joining league:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}