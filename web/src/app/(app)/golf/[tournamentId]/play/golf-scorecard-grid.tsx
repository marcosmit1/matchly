"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/modal-context";
import { createClient } from "@/supabase/client";
import { ArrowLeft, X, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import styles from "./golf-scorecard.module.css";
import type { GolfTournament } from "@/types/golf";

interface GolfScorecardGridProps {
  tournament: GolfTournament;
  participants: any[];
  holes: any[];
  existingScores: any[];
  currentUserId: string;
}

interface ScoreData {
  participantId: string;
  holeNumber: number;
  strokes: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  bunker?: boolean;
  waterHazard?: boolean;
  penalties?: number;
}

export function GolfScorecardGrid({
  tournament,
  participants,
  holes,
  existingScores,
  currentUserId
}: GolfScorecardGridProps) {
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [selectedCell, setSelectedCell] = useState<{ participantId: string; holeNumber: number } | null>(null);
  const [editingScore, setEditingScore] = useState<Partial<ScoreData>>({});
  const [showingNine, setShowingNine] = useState<'front' | 'back'>('front');
  const [selectedFourball, setSelectedFourball] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const { showSuccess, showError } = useModal();

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/leaderboard?view=overall`);
      const data = await response.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchActivityFeed = async () => {
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/activity`);
      const data = await response.json();
      if (data.activities) {
        setActivityFeed(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    console.log('🏌️ Initial Props:', {
      tournament,
      participants,
      holes,
      existingScores,
      currentUserId
    });

    // Load existing scores into state
    const scoreMap: Record<string, ScoreData> = {};
    existingScores.forEach(score => {
      const key = `${score.participant_id}-${score.hole_number}`;
      scoreMap[key] = {
        participantId: score.participant_id,
        holeNumber: score.hole_number,
        strokes: score.strokes,
        putts: score.putts,
        fairwayHit: score.fairway_hit,
        greenInRegulation: score.green_in_regulation,
        bunker: score.bunker,
        penalties: score.penalties
      };
    });
    console.log('📊 Score Map:', scoreMap);
    setScores(scoreMap);
  }, [existingScores]);

  // Subscribe to real-time score updates
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to score changes for this tournament
    const subscription = supabase
      .channel(`golf-scores-${tournament.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'golf_scores',
          filter: `tournament_id=eq.${tournament.id}`
        },
        (payload: { 
          eventType: 'INSERT' | 'UPDATE' | 'DELETE';
          new: {
            participant_id: string;
            hole_number: number;
            strokes: number;
            putts?: number;
            fairway_hit?: boolean;
            green_in_regulation?: boolean;
            bunker?: boolean;
            penalties?: number;
          };
          old: {
            participant_id: string;
            hole_number: number;
          };
        }) => {
          console.log('🎯 Score update received:', payload);
          
          if (payload.eventType === 'DELETE') {
            // Remove score from state
            const key = `${payload.old.participant_id}-${payload.old.hole_number}`;
            setScores(prev => {
              const newScores = { ...prev };
              delete newScores[key];
              return newScores;
            });
          } else {
            // Insert or Update
            const newScore = payload.new;
            const key = `${newScore.participant_id}-${newScore.hole_number}`;
            setScores(prev => ({
              ...prev,
              [key]: {
                participantId: newScore.participant_id,
                holeNumber: newScore.hole_number,
                strokes: newScore.strokes,
                putts: newScore.putts,
                fairwayHit: newScore.fairway_hit,
                greenInRegulation: newScore.green_in_regulation,
                bunker: newScore.bunker,
                penalties: newScore.penalties
              }
            }));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from score updates');
      subscription.unsubscribe();
    };
  }, [tournament.id]);

  // Set initial fourball selection
  useEffect(() => {
    if (participants.length > 0) {
      // Find current user's fourball
      const currentUserParticipant = participants.find(p => p.user_id === currentUserId);
      if (currentUserParticipant?.fourball_number) {
        console.log("🎯 Setting fourball to user's fourball:", currentUserParticipant.fourball_number);
        setSelectedFourball(currentUserParticipant.fourball_number);
      } else if (tournament.created_by === currentUserId) {
        // Creator defaults to first fourball
        const firstFourball = Math.min(...participants.map(p => p.fourball_number || Infinity));
        console.log("🎯 Setting fourball to first fourball:", firstFourball);
        setSelectedFourball(firstFourball);
      }
    }
  }, [participants, currentUserId, tournament.created_by]);

  const visibleHoles = showingNine === 'front' ? holes.slice(0, 9) : holes.slice(9, 18);
  
  // Filter participants by selected fourball
  const visibleParticipants = participants.filter(p => p.fourball_number === selectedFourball);
  
  console.log('👥 Filtered Participants:', {
    selectedFourball,
    allParticipants: participants,
    visibleParticipants,
    visibleHoles
  });

  const getScoreKey = (participantId: string, holeNumber: number) => `${participantId}-${holeNumber}`;

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'; // Eagle or better
    if (diff === -1) return 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30'; // Birdie
    if (diff === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-400/30'; // Par
    if (diff === 1) return 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'; // Bogey
    return 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'; // Double bogey or worse
  };

  const calculateTotal = (participantId: string, upToHole?: number, fromHole?: number) => {
    const maxHole = upToHole || 18;
    const minHole = fromHole || 1;
    let total = 0;
    let holesPlayed = 0;

    for (let i = minHole; i <= maxHole; i++) {
      const score = scores[getScoreKey(participantId, i)];
      if (score) {
        total += score.strokes;
        holesPlayed++;
      }
    }

    return { total, holesPlayed };
  };

  const calculateTotalPutts = (participantId: string) => {
    let total = 0;
    for (let i = 1; i <= 18; i++) {
      const score = scores[getScoreKey(participantId, i)];
      if (score?.putts) {
        total += score.putts;
      }
    }
    return total;
  };

  const handleCellClick = (participantId: string, holeNumber: number) => {
    setSelectedCell({ participantId, holeNumber });
    const existing = scores[getScoreKey(participantId, holeNumber)];
    setEditingScore({
      participantId,
      holeNumber,
      strokes: existing?.strokes || 0,
      putts: existing?.putts || 0,
      fairwayHit: existing?.fairwayHit || false,
      greenInRegulation: existing?.greenInRegulation || false,
      bunker: existing?.bunker || false,
      penalties: existing?.penalties || 0
    });
  };

  const calculateScoreType = (strokes: number, par: number) => {
    const diff = strokes - par;
    return {
      is_eagle: diff <= -2,
      is_birdie: diff === -1,
      is_par: diff === 0,
      is_bogey: diff === 1,
      is_double_bogey_plus: diff >= 2
    };
  };

  const handleSaveScore = async () => {
    console.log('🎯 Starting score save:', {
      editingScore,
      currentUserId,
      tournament,
      participants,
      selectedFourball
    });

    if (!editingScore.strokes || editingScore.strokes === 0) {
      showError("Please enter a score");
      return;
    }

    // Get the hole's par
    const hole = holes.find(h => h.hole_number === editingScore.holeNumber);
    if (!hole) {
      showError("Could not find hole information");
      return;
    }

    // Get participant info
    const participant = participants.find(p => p.id === editingScore.participantId);
    console.log('🏌️ Participant info:', {
      participant,
      isCreator: tournament.created_by === currentUserId,
      currentUserParticipant: participants.find(p => p.user_id === currentUserId)
    });

    const scoreTypes = calculateScoreType(editingScore.strokes, hole.par);

    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: editingScore.participantId,
          hole_number: editingScore.holeNumber,
          strokes: editingScore.strokes,
          putts: editingScore.putts,
          fairway_hit: editingScore.fairwayHit,
          green_in_regulation: editingScore.greenInRegulation,
          bunker: editingScore.bunker,
          penalties: editingScore.penalties,
          ...scoreTypes,
          updated_at: new Date().toISOString()
        })
      });

      const responseData = await response.json();
      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save score');
      }

      // Update local state
      const key = getScoreKey(editingScore.participantId!, editingScore.holeNumber!);
      setScores(prev => ({
        ...prev,
        [key]: editingScore as ScoreData
      }));

      setSelectedCell(null);
    } catch (error: any) {
      showError(error.message || "Failed to save score");
    }
  };

  return (
    <div className={`${styles.scorecardContainer} text-white`}>
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-lg flex-shrink-0 border-b border-white/10 w-full">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href={`/golf/${tournament.id}`} className="text-gray-300 hover:text-white p-2">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-lg font-bold">Scorecard</h1>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  fetchLeaderboard();
                  setShowLeaderboard(true);
                }}
                className="text-gray-300 hover:text-white p-2 flex items-center"
              >
                <Trophy size={20} />
              </button>
              <button 
                onClick={() => {
                  fetchActivityFeed();
                  setShowActivityFeed(true);
                }}
                className="text-gray-300 hover:text-white p-2 flex items-center"
              >
                <Activity size={20} />
              </button>
            </div>
          </div>

          {/* Fourball Selector */}
          <div className="flex justify-center gap-2 px-4 pb-3">
            {Array.from(new Set(participants.map(p => p.fourball_number))).sort().map((fourballNum) => (
              <button
                key={fourballNum}
                onClick={() => setSelectedFourball(fourballNum)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedFourball === fourballNum
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Slot {fourballNum}
              </button>
            ))}
          </div>

          {/* Front 9 / Back 9 Toggle */}
          <div className="flex justify-center gap-3 px-4 pb-3">
            <button
              onClick={() => setShowingNine('front')}
              className={`w-32 py-3 rounded-xl font-medium transition-all ${
                showingNine === 'front'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Front 9
            </button>
            <button
              onClick={() => setShowingNine('back')}
              className={`w-32 py-3 rounded-xl font-medium transition-all ${
                showingNine === 'back'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Back 9
            </button>
          </div>
        </div>
      </div>

      {/* Player Headers */}
      <div className="bg-gray-800/50 backdrop-blur-sm flex-shrink-0 border-b border-white/10 overflow-x-auto w-full">
        <div className="container mx-auto max-w-2xl">
          <div className="flex min-w-max px-4 justify-center">
            <div className="w-14 flex-shrink-0" /> {/* Hole number column */}
            {visibleParticipants.map((participant, idx) => (
              <div key={participant.id} className="w-20 flex-shrink-0 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-gray-700/80 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto text-xs font-bold shadow-lg">
                  {participant.player_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">{participant.player_name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Grid */}
      <div className={`${styles.scorecardContent} flex flex-col h-full`}>
          <div className="container mx-auto max-w-2xl flex-1">
            <div className="px-4 py-1">
              {/* Holes and Scores */}
              {visibleHoles.map((hole) => (
                <div key={hole.hole_number} className="flex items-center mb-2 min-w-max justify-center">
                  {/* Hole Info */}
                  <div className="w-14 flex-shrink-0 text-center">
                    <div className="text-xl font-bold bg-gradient-to-br from-green-400 to-green-500 bg-clip-text text-transparent">{hole.hole_number}</div>
                    <div className="text-[10px] text-gray-400 font-medium">PAR {hole.par}</div>
                  </div>

                  {/* Player Scores */}
                  {visibleParticipants.map((participant) => {
                    const scoreKey = getScoreKey(participant.id, hole.hole_number);
                    const score = scores[scoreKey];
                  const hasScore = !!score;
                  const bgColor = hasScore ? getScoreColor(score.strokes, hole.par) : 'bg-gray-800/50 backdrop-blur-sm border border-white/10';

                  return (
                    <div key={`${participant.id}-${hole.hole_number}`} className="w-20 flex-shrink-0 px-1">
                      <button
                        onClick={() => handleCellClick(participant.id, hole.hole_number)}
                        className={`w-full h-16 rounded-xl ${bgColor} flex flex-col items-center justify-center relative transition-all active:scale-95 shadow-lg`}
                      >
                        {hasScore ? (
                          <>
                            {score.greenInRegulation && (
                              <div className="absolute top-0.5 left-0.5 text-[9px] sm:text-[10px] font-bold text-white/70">G</div>
                            )}
                            <div className="text-xl sm:text-2xl font-bold text-white">{score.strokes}</div>
                            {score.putts && score.putts > 0 && (
                              <div className="text-[10px] sm:text-xs text-white/70">{score.putts}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500 text-lg sm:text-xl">-</div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Totals Row */}
          <div className="sticky bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 py-3">
            <div className="container mx-auto max-w-2xl">
              <div className="flex items-center justify-center px-4 min-w-max">
                <div className="w-14 flex-shrink-0 text-center">
                  <div className="text-sm font-bold text-white/90">TOTAL</div>
                  <div className="text-[10px] text-green-400">PAR {visibleHoles.reduce((sum, h) => sum + h.par, 0)}</div>
                </div>

                {visibleParticipants.map((participant) => {
                  const maxHole = showingNine === 'front' ? 9 : 18;
                  const minHole = showingNine === 'front' ? 1 : 10;
                  const { total, holesPlayed } = calculateTotal(participant.id, maxHole, minHole);
                  const totalPutts = calculateTotalPutts(participant.id);

                  return (
                    <div key={participant.id} className="w-20 flex-shrink-0 px-1 text-center">
                      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl py-2 border border-white/10">
                        <div className="text-2xl font-bold">{total || '-'}</div>
                        {holesPlayed > 0 && (
                          <>
                            <div className="text-[10px] text-gray-400">{holesPlayed} holes</div>
                            <div className="text-[10px] text-gray-400">{totalPutts} putts</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Bottom Sheet */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowLeaderboard(false)}>
          <div
            className="bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-yellow-500" />
                <h3 className="text-xl font-bold">Leaderboard</h3>
              </div>
              <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.participant_id}
                    className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold w-8">{index + 1}</div>
                        <div>
                          <div className="font-semibold">{entry.player_name}</div>
                          <div className="text-sm text-gray-400">
                            {entry.holes_completed} holes • {entry.total_strokes} strokes
                          </div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        entry.total_vs_par === 0 ? 'text-white' :
                        entry.total_vs_par < 0 ? 'text-green-500' :
                        'text-red-500'
                      }`}>
                        {entry.total_vs_par === 0 ? 'E' :
                         entry.total_vs_par > 0 ? `+${entry.total_vs_par}` :
                         entry.total_vs_par}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-3 text-sm text-center">
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg py-2">
                        <div className="font-semibold text-blue-400">{entry.eagles}</div>
                        <div className="text-xs text-gray-400">Eagles</div>
                      </div>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg py-2">
                        <div className="font-semibold text-green-400">{entry.birdies}</div>
                        <div className="text-xs text-gray-400">Birdies</div>
                      </div>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg py-2">
                        <div className="font-semibold text-yellow-400">{entry.pars}</div>
                        <div className="text-xs text-gray-400">Pars</div>
                      </div>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg py-2">
                        <div className="font-semibold text-red-400">{entry.bogeys}</div>
                        <div className="text-xs text-gray-400">Bogeys+</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Feed Bottom Sheet */}
      {showActivityFeed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowActivityFeed(false)}>
          <div
            className="bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-blue-400" />
                <h3 className="text-xl font-bold">Live Feed</h3>
              </div>
              <button onClick={() => setShowActivityFeed(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {loadingActivity ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {activityFeed.map((activity) => (
                  <div 
                    key={activity.id}
                    className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'eagle' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'birdie' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'bogey' ? 'bg-orange-500/20 text-orange-400' :
                        activity.type === 'double_plus' ? 'bg-red-500/20 text-red-400' :
                        activity.type === 'water' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'bunker_streak' ? 'bg-yellow-500/20 text-yellow-400' :
                        activity.type === 'fairway_streak' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'putting_streak' ? 'bg-purple-500/20 text-purple-400' :
                        activity.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {activity.type === 'eagle' && '🦅'}
                        {activity.type === 'birdie' && '🐦'}
                        {activity.type === 'bogey' && '😅'}
                        {activity.type === 'double_plus' && '💀'}
                        {activity.type === 'water' && '💦'}
                        {activity.type === 'bunker' && '🏖️'}
                        {activity.type === 'bunker_streak' && '⛳'}
                        {activity.type === 'fairway_streak' && '🎯'}
                        {activity.type === 'putting_streak' && '🎳'}
                        {activity.type === 'achievement' && '🏆'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.message}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Hole {activity.hole_number} • {new Date(activity.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Entry Bottom Sheet */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSelectedCell(null)}>
          <div
            className="bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                Hole {selectedCell.holeNumber} - {participants.find(p => p.id === selectedCell.participantId)?.player_name}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Score Entry Tabs */}
            <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400 mb-2">Score</div>
                <input
                  type="number"
                  value={editingScore.strokes || ''}
                  onChange={(e) => setEditingScore({ ...editingScore, strokes: parseInt(e.target.value) || 0 })}
                  className="w-full h-[52px] bg-gray-700 text-white text-2xl text-center rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  min="1"
                  max="15"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-400 mb-2">Putts</div>
                <input
                  type="number"
                  value={editingScore.putts || ''}
                  onChange={(e) => setEditingScore({ ...editingScore, putts: parseInt(e.target.value) || 0 })}
                  className="w-full h-[52px] bg-gray-700 text-white text-2xl text-center rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                  min="0"
                  max="10"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-400 mb-2">Fairway</div>
                <button
                  onClick={() => setEditingScore({ ...editingScore, fairwayHit: !editingScore.fairwayHit })}
                  className={`w-full h-[52px] text-2xl text-center rounded-lg border ${
                    editingScore.fairwayHit
                      ? 'bg-green-500 border-green-400 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  }`}
                >
                  {editingScore.fairwayHit ? '✓' : '-'}
                </button>
              </div>
              <div className="text-center">
                <div className="text-gray-400 mb-2">Bunker</div>
                <button
                  onClick={() => setEditingScore({ ...editingScore, bunker: !editingScore.bunker })}
                  className={`w-full h-[52px] text-2xl text-center rounded-lg border ${
                    editingScore.bunker
                      ? 'bg-yellow-600 border-yellow-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  }`}
                >
                  {editingScore.bunker ? '✓' : '-'}
                </button>
              </div>
              <div className="text-center">
                <div className="text-gray-400 mb-2">Water</div>
                <button
                  onClick={() => setEditingScore({ ...editingScore, waterHazard: !editingScore.waterHazard })}
                  className={`w-full h-[52px] text-2xl text-center rounded-lg border ${
                    editingScore.waterHazard
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  }`}
                >
                  {editingScore.waterHazard ? '✓' : '-'}
                </button>
              </div>
            </div>

            {/* GIR Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setEditingScore({ ...editingScore, greenInRegulation: !editingScore.greenInRegulation })}
                className={`w-full py-3 rounded-lg font-medium ${
                  editingScore.greenInRegulation
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {editingScore.greenInRegulation ? '✓ ' : ''}Green in Regulation
              </button>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveScore}
              disabled={!editingScore.strokes || editingScore.strokes === 0}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-14 rounded-xl font-bold text-lg"
            >
              Save Score
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}