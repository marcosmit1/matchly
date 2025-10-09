"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Target,
  Flame,
  Star
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import type { GolfTournament, GolfLeaderboardEntry, GolfWallOfShame, GolfHeroBoard } from "@/types/golf";

interface GolfLeaderboardProps {
  tournament: GolfTournament;
  userId: string;
}

type LeaderboardView = 'overall' | 'shame' | 'hero' | 'fines';

export function GolfLeaderboard({ tournament, userId }: GolfLeaderboardProps) {
  const [view, setView] = useState<LeaderboardView>('overall');
  const [leaderboard, setLeaderboard] = useState<GolfLeaderboardEntry[]>([]);
  const [wallOfShame, setWallOfShame] = useState<GolfWallOfShame | null>(null);
  const [heroBoard, setHeroBoard] = useState<GolfHeroBoard | null>(null);
  const [fines, setFines] = useState<Array<{
    participant_id: string;
    player_name: string;
    total_fines: number;
    fines: Array<{
      fine_type: string;
      title: string;
      reason: string;
      stat_value: string;
      paid: boolean;
    }>;
  }>>([]);
  const [allFines, setAllFines] = useState<Array<{
    id: string;
    fine_type: string;
    title: string;
    reason: string;
    stat_value: string;
    participant: {
      player_name: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 30 seconds if tournament is active
    const interval = tournament.status === 'active' ? setInterval(fetchLeaderboard, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tournament.id, view]);

  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/leaderboard?view=${view}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      if (view === 'overall') {
        setLeaderboard(data.leaderboard || []);
      } else if (view === 'shame') {
        setWallOfShame(data.wall_of_shame || null);
      } else if (view === 'hero') {
        setHeroBoard(data.hero_board || null);
      } else if (view === 'fines') {
        setFines(data.fines || []);
        setAllFines(data.all_fines || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600';
    if (position === 2) return 'text-gray-500';
    if (position === 3) return 'text-amber-700';
    return 'text-gray-700';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}.`;
  };

  const getScoreColor = (vsPar: number) => {
    if (vsPar < 0) return 'text-green-600';
    if (vsPar === 0) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white px-4 py-4 sticky top-0 z-10">
        <Link href={`/golf/${tournament.id}`} className="inline-flex items-center text-white/90 hover:text-white mb-3">
          <ArrowLeft size={18} className="mr-2" />
          Back to Tournament
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">⛳ Leaderboard</h1>
            <div className="text-sm text-white/90">{tournament.name}</div>
          </div>
          <button
            onClick={() => fetchLeaderboard()}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setView('overall')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            view === 'overall'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trophy size={16} className="inline mr-1.5" />
          Overall
        </button>
        <button
          onClick={() => setView('shame')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            view === 'shame'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Flame size={16} className="inline mr-1.5" />
          Wall of Shame
        </button>
        <button
          onClick={() => setView('hero')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            view === 'hero'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star size={16} className="inline mr-1.5" />
          Hero Board
        </button>
        {tournament.status === 'completed' && (
          <button
            onClick={() => setView('fines')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              view === 'fines'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="inline-block mr-1.5 text-base">💰</div>
            Fines
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          {/* Overall Leaderboard */}
          {view === 'overall' && (
            <div className="p-4 space-y-3">
              {leaderboard.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No scores yet</p>
                  <p className="text-sm text-gray-400 mt-1">Scores will appear as players record them</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.participant_id}
                    className={`bg-white rounded-lg border p-4 ${
                      entry.participant_id === userId ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`text-2xl font-bold ${getPositionColor(entry.current_position)}`}>
                          {getPositionIcon(entry.current_position)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {entry.player_name}
                            {entry.participant_id === userId && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {entry.birdies > 0 && <span className="mr-2">🐦 {entry.birdies}</span>}
                            {entry.eagles > 0 && <span className="mr-2">🦅 {entry.eagles}</span>}
                            {entry.penalties > 0 && <span className="mr-2">⚠️ {entry.penalties}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{entry.total_strokes}</div>
                        <div className={`text-sm font-semibold ${getScoreColor(entry.total_vs_par)}`}>
                          {entry.total_vs_par > 0 ? '+' : ''}{entry.total_vs_par}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Wall of Shame */}
          {view === 'shame' && wallOfShame && (
            <div className="p-4 space-y-3">
              {wallOfShame.worst_score && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame size={20} className="text-red-600" />
                    <div className="font-semibold text-red-900">Worst Single Hole</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {wallOfShame.worst_score.participant.player_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Hole {wallOfShame.worst_score.hole_number}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {wallOfShame.worst_score.score}
                    </div>
                  </div>
                </div>
              )}

              {wallOfShame.most_penalties && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={20} className="text-orange-600" />
                    <div className="font-semibold text-orange-900">Most Penalties</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {wallOfShame.most_penalties.participant.player_name}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      ⚠️ {wallOfShame.most_penalties.count}
                    </div>
                  </div>
                </div>
              )}

              {wallOfShame.most_water && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-blue-600 text-lg">💦</div>
                    <div className="font-semibold text-blue-900">Most Water Hazards</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {wallOfShame.most_water.participant.player_name}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      💦 {wallOfShame.most_water.count}
                    </div>
                  </div>
                </div>
              )}

              {!wallOfShame.worst_score && !wallOfShame.most_penalties && !wallOfShame.most_water && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Flame size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No shame... yet! 😇</p>
                  <p className="text-sm text-gray-400 mt-1">Keep playing to see who earns their spot</p>
                </div>
              )}
            </div>
          )}

          {/* Hero Board */}
          {view === 'hero' && heroBoard && (
            <div className="p-4 space-y-3">
              {heroBoard.most_birdies && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-green-600 text-lg">🐦</div>
                    <div className="font-semibold text-green-900">Birdie King/Queen</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {heroBoard.most_birdies.participant.player_name}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      🐦 {heroBoard.most_birdies.count}
                    </div>
                  </div>
                </div>
              )}

              {heroBoard.most_eagles && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-purple-600 text-lg">🦅</div>
                    <div className="font-semibold text-purple-900">Eagle Master</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {heroBoard.most_eagles.participant.player_name}
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      🦅 {heroBoard.most_eagles.count}
                    </div>
                  </div>
                </div>
              )}

              {heroBoard.best_hole && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={20} className="text-yellow-600" />
                    <div className="font-semibold text-yellow-900">Best Single Hole</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {heroBoard.best_hole.participant.player_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Hole {heroBoard.best_hole.hole_number} (Par {heroBoard.best_hole.par})
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {heroBoard.best_hole.score}
                    </div>
                  </div>
                </div>
              )}

              {!heroBoard.most_birdies && !heroBoard.most_eagles && !heroBoard.best_hole && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Star size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No heroes yet! 🦸</p>
                  <p className="text-sm text-gray-400 mt-1">Play some rounds to see the highlights</p>
                </div>
              )}
            </div>
          )}

          {/* Fines View */}
          {view === 'fines' && (
            <div className="p-4 space-y-4">
              {allFines.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="text-gray-500">No fines yet!</p>
                  <p className="text-sm text-gray-400 mt-1">Fines are calculated when the tournament ends</p>
                </div>
              ) : (
                <>
                  {/* Wooden Spoon Highlight */}
                  {allFines.find(f => f.fine_type === 'wooden_spoon') && (
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl border-2 border-amber-400 p-6 shadow-lg">
                      <div className="text-center">
                        <div className="text-6xl mb-3">🥄</div>
                        <div className="text-2xl font-bold text-amber-900 mb-2">The Wooden Spoon</div>
                        <div className="text-lg font-semibold text-amber-800">
                          {allFines.find(f => f.fine_type === 'wooden_spoon')?.participant.player_name}
                        </div>
                        <div className="text-sm text-amber-700 mt-2">
                          {allFines.find(f => f.fine_type === 'wooden_spoon')?.stat_value}
                        </div>
                        <div className="text-xs text-amber-600 mt-1 italic">
                          Last place finisher - the ultimate &quot;honor&quot;!
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tournament Stats Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-900 mb-1">Tournament Fines Summary</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {allFines.filter(f => f.fine_type !== 'tournament_winner').length} fines awarded! 🍺
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        Based on 10 statistical categories
                      </div>
                    </div>
                  </div>

                  {/* All Fines as Cards */}
                  <div className="space-y-3">
                    <div className="text-lg font-bold text-gray-900 mb-2">🎯 Fine Breakdown</div>
                    {allFines
                      .filter(f => f.fine_type !== 'wooden_spoon') // Already shown above
                      .map((fine, idx) => (
                        <div
                          key={fine.id || idx}
                          className={`rounded-lg border-2 p-4 ${
                            fine.fine_type === 'tournament_winner'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-2xl">{fine.title.split(' ')[0]}</div>
                                <div className={`font-bold ${
                                  fine.fine_type === 'tournament_winner' ? 'text-green-700' : 'text-gray-900'
                                }`}>
                                  {fine.title.substring(fine.title.indexOf(' ') + 1)}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {fine.reason}
                              </div>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                fine.fine_type === 'tournament_winner'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                <span className="font-bold">{fine.participant.player_name}</span>
                                <span>•</span>
                                <span>{fine.stat_value}</span>
                              </div>
                            </div>
                            <div className={`text-3xl font-bold px-3 py-2 rounded-lg ${
                              fine.fine_type === 'tournament_winner'
                                ? 'bg-green-200 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {fine.fine_type === 'tournament_winner' ? '✨' : '🍺'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Player Totals */}
                  <div className="space-y-3 mt-6">
                    <div className="text-lg font-bold text-gray-900 mb-2">👥 Player Totals</div>
                    {fines
                      .sort((a, b) => b.total_fines - a.total_fines)
                      .map((participant) => (
                        <div
                          key={participant.participant_id}
                          className={`bg-white rounded-lg border-2 p-4 ${
                            participant.participant_id === userId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {participant.total_fines > 2 ? '😱' : participant.total_fines > 0 ? '🍺' : '🎉'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {participant.player_name}
                                  {participant.participant_id === userId && (
                                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {participant.fines.length} fine{participant.fines.length !== 1 ? 's' : ''} awarded
                                </div>
                              </div>
                            </div>
                            <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
                              participant.total_fines > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {participant.total_fines > 0 ? `${participant.total_fines}🍺` : '✨'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Action Button */}
      {tournament.status === 'active' && (
        <div className="p-4">
          <Link href={`/golf/${tournament.id}/play`}>
            <Button className="w-full" variant="default">
              <Target size={18} className="mr-2" />
              Record Scores
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
