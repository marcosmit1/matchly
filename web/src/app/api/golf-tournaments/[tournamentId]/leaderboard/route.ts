import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import type { GolfLeaderboardEntry, GolfWallOfShame, GolfHeroBoard } from '@/types/golf';

// GET /api/golf-tournaments/[tournamentId]/leaderboard - Get tournament leaderboard
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
    const view = searchParams.get('view') || 'overall'; // overall, fourball, shame, hero

    // Get all participants with their scores
    const { data: participants, error: participantsError } = await supabase
      .from('golf_tournament_participants')
      .select(`
        id,
        player_name,
        fourball_number,
        user_id,
        user:users(id, email)
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'active');

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    console.log('🏌️ Participants found:', participants?.length || 0);
    console.log('🏌️ Participants data:', participants);

    // Get all scores for the tournament
    const { data: scores, error: scoresError } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    console.log('🏌️ Scores found:', scores?.length || 0);
    console.log('🏌️ Scores data:', scores);

    // Get all holes for par calculation
    const { data: holes, error: holesError } = await supabase
      .from('golf_holes')
      .select('hole_number, par')
      .eq('tournament_id', tournamentId);

    if (holesError) {
      console.error('Error fetching holes:', holesError);
      return NextResponse.json(
        { error: 'Failed to fetch holes' },
        { status: 500 }
      );
    }

    const holesMap = new Map(holes.map(h => [h.hole_number, h.par]));

    // Get penalties
    const { data: penalties, error: penaltiesError } = await supabase
      .from('golf_penalties')
      .select('participant_id, penalty_type')
      .eq('tournament_id', tournamentId);

    if (penaltiesError) {
      console.error('Error fetching penalties:', penaltiesError);
    }

    const penaltiesMap = new Map<string, any[]>();
    penalties?.forEach(p => {
      if (!penaltiesMap.has(p.participant_id)) {
        penaltiesMap.set(p.participant_id, []);
      }
      penaltiesMap.get(p.participant_id)!.push(p);
    });

    // Calculate leaderboard entries
    const leaderboard: GolfLeaderboardEntry[] = participants.map(participant => {
      const participantScores = scores.filter(s => s.participant_id === participant.id);
      const participantPenalties = penaltiesMap.get(participant.id) || [];

      const totalStrokes = participantScores.reduce((sum, s) => sum + s.strokes, 0);
      const totalPar = participantScores.reduce((sum, s) => {
        const par = holesMap.get(s.hole_number) || 4;
        return sum + par;
      }, 0);

      return {
        participant_id: participant.id,
        player_name: participant.player_name,
        fourball_number: participant.fourball_number,
        total_strokes: totalStrokes,
        total_vs_par: totalStrokes - totalPar,
        holes_completed: participantScores.length,
        birdies: participantScores.filter(s => s.is_birdie).length,
        eagles: participantScores.filter(s => s.is_eagle).length,
        pars: participantScores.filter(s => s.is_par).length,
        bogeys: participantScores.filter(s => s.is_bogey || s.is_double_bogey_plus).length,
        penalties: participantPenalties.length,
        current_position: 0, // Will be set after sorting
        user_id: participant.user_id,
        user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
          id: participant.user[0].id,
          email: participant.user[0].email
        } : undefined,
      };
    });

    // Sort by total vs par (lower is better), then by holes completed
    leaderboard.sort((a, b) => {
      if (a.holes_completed === 0 && b.holes_completed === 0) return 0;
      if (a.holes_completed === 0) return 1;
      if (b.holes_completed === 0) return -1;

      if (a.total_vs_par !== b.total_vs_par) {
        return a.total_vs_par - b.total_vs_par;
      }
      return b.holes_completed - a.holes_completed;
    });

    // Assign positions
    leaderboard.forEach((entry, index) => {
      entry.current_position = index + 1;
    });

    console.log('🏌️ Final leaderboard:', leaderboard);

    if (view === 'overall') {
      return NextResponse.json({ leaderboard });
    }

    // WALL OF SHAME View
    if (view === 'shame') {
      const wallOfShame: GolfWallOfShame = {
        worst_score: null,
        most_penalties: null,
        most_water: null,
        most_3_putts: null,
      };

      // Find worst single hole score
      let worstScore = { participant: null as any, score: 0, hole_number: 0 };
      scores.forEach(score => {
        const par = holesMap.get(score.hole_number) || 4;
        const vsPar = score.strokes - par;
        if (vsPar > worstScore.score - (holesMap.get(worstScore.hole_number) || 4)) {
          const participant = participants.find(p => p.id === score.participant_id);
          if (participant) {
            worstScore = {
              participant,
              score: score.strokes,
              hole_number: score.hole_number,
            };
          }
        }
      });
      if (worstScore.participant) {
        wallOfShame.worst_score = {
          participant: {
            id: worstScore.participant.id,
            tournament_id: tournamentId,
            user_id: worstScore.participant.user_id,
            player_name: worstScore.participant.player_name,
            handicap: 0, // Default handicap
            fourball_number: worstScore.participant.fourball_number,
            status: 'active' as const,
            joined_at: new Date().toISOString(),
            user: worstScore.participant.user && Array.isArray(worstScore.participant.user) && worstScore.participant.user.length > 0 ? {
              id: worstScore.participant.user[0].id,
              email: worstScore.participant.user[0].email
            } : undefined
          },
          score: worstScore.score,
          hole_number: worstScore.hole_number
        };
      }

      // Most penalties overall
      if (penalties && penalties.length > 0) {
        const penaltyCounts = new Map<string, number>();
        penalties.forEach(p => {
          penaltyCounts.set(p.participant_id, (penaltyCounts.get(p.participant_id) || 0) + 1);
        });

        let maxPenalties = 0;
        let worstParticipantId = '';
        penaltyCounts.forEach((count, participantId) => {
          if (count > maxPenalties) {
            maxPenalties = count;
            worstParticipantId = participantId;
          }
        });

        if (worstParticipantId) {
          const participant = participants.find(p => p.id === worstParticipantId);
          if (participant) {
            wallOfShame.most_penalties = { 
              participant: {
                id: participant.id,
                tournament_id: tournamentId,
                user_id: participant.user_id,
                player_name: participant.player_name,
                handicap: 0, // Default handicap
                fourball_number: participant.fourball_number,
                status: 'active' as const,
                joined_at: new Date().toISOString(),
                user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
                  id: participant.user[0].id,
                  email: participant.user[0].email
                } : undefined
              }, 
              count: maxPenalties 
            };
          }
        }

        // Most water hazards
        const waterCounts = new Map<string, number>();
        penalties.filter(p => p.penalty_type === 'water').forEach(p => {
          waterCounts.set(p.participant_id, (waterCounts.get(p.participant_id) || 0) + 1);
        });

        let maxWater = 0;
        let waterParticipantId = '';
        waterCounts.forEach((count, participantId) => {
          if (count > maxWater) {
            maxWater = count;
            waterParticipantId = participantId;
          }
        });

        if (waterParticipantId && maxWater > 0) {
          const participant = participants.find(p => p.id === waterParticipantId);
          if (participant) {
            wallOfShame.most_water = { 
              participant: {
                id: participant.id,
                tournament_id: tournamentId,
                user_id: participant.user_id,
                player_name: participant.player_name,
                handicap: 0, // Default handicap
                fourball_number: participant.fourball_number,
                status: 'active' as const,
                joined_at: new Date().toISOString(),
                user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
                  id: participant.user[0].id,
                  email: participant.user[0].email
                } : undefined
              }, 
              count: maxWater 
            };
          }
        }

        // Most 3-putts
        const threePuttCounts = new Map<string, number>();
        penalties.filter(p => p.penalty_type === '3_putt').forEach(p => {
          threePuttCounts.set(p.participant_id, (threePuttCounts.get(p.participant_id) || 0) + 1);
        });

        let maxThreePutts = 0;
        let threePuttParticipantId = '';
        threePuttCounts.forEach((count, participantId) => {
          if (count > maxThreePutts) {
            maxThreePutts = count;
            threePuttParticipantId = participantId;
          }
        });

        if (threePuttParticipantId && maxThreePutts > 0) {
          const participant = participants.find(p => p.id === threePuttParticipantId);
          if (participant) {
            wallOfShame.most_3_putts = { 
              participant: {
                id: participant.id,
                tournament_id: tournamentId,
                user_id: participant.user_id,
                player_name: participant.player_name,
                handicap: 0, // Default handicap
                fourball_number: participant.fourball_number,
                status: 'active' as const,
                joined_at: new Date().toISOString(),
                user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
                  id: participant.user[0].id,
                  email: participant.user[0].email
                } : undefined
              }, 
              count: maxThreePutts 
            };
          }
        }
      }

      return NextResponse.json({ wall_of_shame: wallOfShame });
    }

    // HERO BOARD View
    if (view === 'hero') {
      const heroBoard: GolfHeroBoard = {
        most_birdies: null,
        most_eagles: null,
        best_hole: null,
        longest_drive_winners: [],
        closest_to_pin_winners: [],
      };

      // Most birdies
      const birdieLeader = leaderboard.reduce((max, entry) =>
        entry.birdies > (max?.birdies || 0) ? entry : max
      , leaderboard[0]);

      if (birdieLeader && birdieLeader.birdies > 0) {
        const participant = participants.find(p => p.id === birdieLeader.participant_id);
        if (participant) {
          heroBoard.most_birdies = { 
            participant: {
              id: participant.id,
              tournament_id: tournamentId,
              user_id: participant.user_id,
              player_name: participant.player_name,
              handicap: 0, // Default handicap
              fourball_number: participant.fourball_number,
              status: 'active' as const,
              joined_at: new Date().toISOString(),
                user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
                  id: participant.user[0].id,
                  email: participant.user[0].email
                } : undefined
            }, 
            count: birdieLeader.birdies 
          };
        }
      }

      // Most eagles
      const eagleLeader = leaderboard.reduce((max, entry) =>
        entry.eagles > (max?.eagles || 0) ? entry : max
      , leaderboard[0]);

      if (eagleLeader && eagleLeader.eagles > 0) {
        const participant = participants.find(p => p.id === eagleLeader.participant_id);
        if (participant) {
          heroBoard.most_eagles = { 
            participant: {
              id: participant.id,
              tournament_id: tournamentId,
              user_id: participant.user_id,
              player_name: participant.player_name,
              handicap: 0, // Default handicap
              fourball_number: participant.fourball_number,
              status: 'active' as const,
              joined_at: new Date().toISOString(),
                user: participant.user && Array.isArray(participant.user) && participant.user.length > 0 ? {
                  id: participant.user[0].id,
                  email: participant.user[0].email
                } : undefined
            }, 
            count: eagleLeader.eagles 
          };
        }
      }

      // Get challenge winners
      const { data: challenges } = await supabase
        .from('golf_hole_challenges')
        .select('*')
        .eq('tournament_id', tournamentId)
        .not('winner_participant_id', 'is', null);

      if (challenges) {
        heroBoard.longest_drive_winners = challenges.filter(c => c.challenge_type === 'longest_drive');
        heroBoard.closest_to_pin_winners = challenges.filter(c => c.challenge_type === 'closest_to_pin');
      }

      return NextResponse.json({ hero_board: heroBoard });
    }

    // Default: return overall leaderboard
    return NextResponse.json({ leaderboard });

  } catch (error) {
    console.error('Error in GET /api/golf-tournaments/[tournamentId]/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
