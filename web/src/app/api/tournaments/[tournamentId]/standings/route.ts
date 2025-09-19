import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { tournamentId } = await params;

    // Get tournament players with their match statistics
    const { data: players, error: playersError } = await supabase
      .from('tournament_players')
      .select(`
        id,
        name,
        tournament_id
      `)
      .eq('tournament_id', tournamentId);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch players' 
      }, { status: 500 });
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ 
        success: true, 
        rankings: [] 
      });
    }

    // Get all completed matches for this tournament
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_matches')
      .select(`
        id,
        player1_id,
        player2_id,
        player3_id,
        player4_id,
        player1_score,
        player2_score,
        player3_score,
        player4_score,
        status
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed');

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch matches' 
      }, { status: 500 });
    }

    // Calculate player statistics
    const playerStats = new Map();

    // Initialize all players
    players.forEach(player => {
      playerStats.set(player.id, {
        id: player.id,
        name: player.name,
        wins: 0,
        total_points: 0,
        matches_played: 0
      });
    });

    // Process matches to calculate stats
    matches?.forEach(match => {
      const team1Score = (match.player1_score || 0) + (match.player2_score || 0);
      const team2Score = (match.player3_score || 0) + (match.player4_score || 0);

      // Update player 1 stats
      if (match.player1_id) {
        const player1Stats = playerStats.get(match.player1_id);
        if (player1Stats) {
          player1Stats.total_points += match.player1_score || 0;
          player1Stats.matches_played += 1;
          if (team1Score > team2Score) {
            player1Stats.wins += 1;
          }
        }
      }

      // Update player 2 stats
      if (match.player2_id) {
        const player2Stats = playerStats.get(match.player2_id);
        if (player2Stats) {
          player2Stats.total_points += match.player2_score || 0;
          player2Stats.matches_played += 1;
          if (team1Score > team2Score) {
            player2Stats.wins += 1;
          }
        }
      }

      // Update player 3 stats
      if (match.player3_id) {
        const player3Stats = playerStats.get(match.player3_id);
        if (player3Stats) {
          player3Stats.total_points += match.player3_score || 0;
          player3Stats.matches_played += 1;
          if (team2Score > team1Score) {
            player3Stats.wins += 1;
          }
        }
      }

      // Update player 4 stats
      if (match.player4_id) {
        const player4Stats = playerStats.get(match.player4_id);
        if (player4Stats) {
          player4Stats.total_points += match.player4_score || 0;
          player4Stats.matches_played += 1;
          if (team2Score > team1Score) {
            player4Stats.wins += 1;
          }
        }
      }
    });

    // Convert to array and sort by wins (descending), then by total points (descending)
    const rankings = Array.from(playerStats.values())
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        return b.total_points - a.total_points;
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    return NextResponse.json({
      success: true,
      rankings
    });

  } catch (error) {
    console.error('Error in standings API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
