import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin of this league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('created_by, status')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.created_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get all boxes ordered by level
    const { data: boxes, error: boxesError } = await supabase
      .from('league_boxes')
      .select(`
        id,
        level,
        name,
        league_box_standings (
          user_id,
          points,
          wins,
          losses,
          points_for,
          points_against,
          users (
            username
          )
        )
      `)
      .eq('league_id', leagueId)
      .order('level', { ascending: true });

    if (boxesError) {
      return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
    }

    const promotions = [];
    const relegations = [];

    // Process each box for promotions and relegations
    for (let i = 0; i < boxes.length; i++) {
      const currentBox = boxes[i];
      const standings = currentBox.league_box_standings || [];
      
      if (standings.length === 0) continue;

      // Sort standings by points (desc), then by wins (desc), then by point difference
      const sortedStandings = standings.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        if (a.wins !== b.wins) return b.wins - a.wins;
        return (b.points_for - b.points_against) - (a.points_for - a.points_against);
      });

      // Top 2 players promote (if higher box exists)
      if (i > 0 && sortedStandings.length >= 2) {
        const top2 = sortedStandings.slice(0, 2);
        const higherBox = boxes[i - 1];
        
        for (const player of top2) {
          promotions.push({
            user_id: player.user_id,
            username: player.users.username,
            from_box: currentBox.name,
            to_box: higherBox.name,
            from_level: currentBox.level,
            to_level: higherBox.level
          });
        }
      }

      // Bottom 2 players relegate (if lower box exists)
      if (i < boxes.length - 1 && sortedStandings.length >= 2) {
        const bottom2 = sortedStandings.slice(-2);
        const lowerBox = boxes[i + 1];
        
        for (const player of bottom2) {
          relegations.push({
            user_id: player.user_id,
            username: player.users.username,
            from_box: currentBox.name,
            to_box: lowerBox.name,
            from_level: currentBox.level,
            to_level: lowerBox.level
          });
        }
      }
    }

    // Execute promotions and relegations
    for (const promotion of promotions) {
      // Remove from current box
      await supabase
        .from('league_box_assignments')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', promotion.user_id)
        .eq('box_id', boxes.find(b => b.level === promotion.from_level)?.id);

      // Add to higher box
      const higherBox = boxes.find(b => b.level === promotion.to_level);
      if (higherBox) {
        await supabase
          .from('league_box_assignments')
          .insert({
            league_id: leagueId,
            box_id: higherBox.id,
            user_id: promotion.user_id,
            assigned_at: new Date().toISOString()
          });
      }

      // Record promotion history
      await supabase
        .from('league_promotion_history')
        .insert({
          league_id: leagueId,
          user_id: promotion.user_id,
          from_box_id: boxes.find(b => b.level === promotion.from_level)?.id,
          to_box_id: boxes.find(b => b.level === promotion.to_level)?.id,
          type: 'promotion',
          created_at: new Date().toISOString()
        });
    }

    for (const relegation of relegations) {
      // Remove from current box
      await supabase
        .from('league_box_assignments')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', relegation.user_id)
        .eq('box_id', boxes.find(b => b.level === relegation.from_level)?.id);

      // Add to lower box
      const lowerBox = boxes.find(b => b.level === relegation.to_level);
      if (lowerBox) {
        await supabase
          .from('league_box_assignments')
          .insert({
            league_id: leagueId,
            box_id: lowerBox.id,
            user_id: relegation.user_id,
            assigned_at: new Date().toISOString()
          });
      }

      // Record relegation history
      await supabase
        .from('league_promotion_history')
        .insert({
          league_id: leagueId,
          user_id: relegation.user_id,
          from_box_id: boxes.find(b => b.level === relegation.from_level)?.id,
          to_box_id: boxes.find(b => b.level === relegation.to_level)?.id,
          type: 'relegation',
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      message: 'Promotions and relegations processed successfully',
      promotions,
      relegations,
      totalPromotions: promotions.length,
      totalRelegations: relegations.length
    });

  } catch (error) {
    console.error('Error processing promotions/relegations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
