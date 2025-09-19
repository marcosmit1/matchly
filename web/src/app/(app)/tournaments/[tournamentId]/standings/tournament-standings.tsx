"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Trophy, 
  Medal,
  Target,
  Users,
  TrendingUp,
  Award
} from "lucide-react";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  sport: string;
  tournament_type: string;
  points_to_win: number;
}

interface Player {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  player1_score: number | null;
  player2_score: number | null;
  player3_score: number | null;
  player4_score: number | null;
  status: string;
}

interface PlayerStats {
  id: string;
  name: string;
  email: string;
  matchesPlayed: number;
  matchesWon: number;
  totalPoints: number;
  averagePoints: number;
  winRate: number;
  rank: number;
}

interface TournamentStandingsProps {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
}

export function TournamentStandings({ tournament, players, matches }: TournamentStandingsProps) {
  const [standings, setStandings] = useState<PlayerStats[]>([]);

  useEffect(() => {
    calculateStandings();
  }, [players, matches]);

  const calculateStandings = () => {
    const playerStats: {[key: string]: PlayerStats} = {};

    // Initialize player stats
    players.forEach(player => {
      playerStats[player.id] = {
        id: player.id,
        name: player.name,
        email: player.email,
        matchesPlayed: 0,
        matchesWon: 0,
        totalPoints: 0,
        averagePoints: 0,
        winRate: 0,
        rank: 0
      };
    });

    // Calculate stats from matches
    matches.forEach(match => {
      if (match.status === 'completed') {
        // Team 1: player1 + player2
        const team1Score = (match.player1_score || 0) + (match.player2_score || 0);
        // Team 2: player3 + player4
        const team2Score = (match.player3_score || 0) + (match.player4_score || 0);

        // Update player1 stats
        if (playerStats[match.player1_id]) {
          playerStats[match.player1_id].matchesPlayed++;
          playerStats[match.player1_id].totalPoints += match.player1_score || 0;
          if (team1Score > team2Score) {
            playerStats[match.player1_id].matchesWon++;
          }
        }

        // Update player2 stats
        if (playerStats[match.player2_id]) {
          playerStats[match.player2_id].matchesPlayed++;
          playerStats[match.player2_id].totalPoints += match.player2_score || 0;
          if (team1Score > team2Score) {
            playerStats[match.player2_id].matchesWon++;
          }
        }

        // Update player3 stats
        if (playerStats[match.player3_id]) {
          playerStats[match.player3_id].matchesPlayed++;
          playerStats[match.player3_id].totalPoints += match.player3_score || 0;
          if (team2Score > team1Score) {
            playerStats[match.player3_id].matchesWon++;
          }
        }

        // Update player4 stats
        if (playerStats[match.player4_id]) {
          playerStats[match.player4_id].matchesPlayed++;
          playerStats[match.player4_id].totalPoints += match.player4_score || 0;
          if (team2Score > team1Score) {
            playerStats[match.player4_id].matchesWon++;
          }
        }
      }
    });

    // Calculate averages and win rates
    Object.values(playerStats).forEach(player => {
      player.averagePoints = player.matchesPlayed > 0 ? player.totalPoints / player.matchesPlayed : 0;
      player.winRate = player.matchesPlayed > 0 ? (player.matchesWon / player.matchesPlayed) * 100 : 0;
    });

    // Sort by win rate, then by total points, then by average points
    const sortedStandings = Object.values(playerStats).sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.averagePoints - a.averagePoints;
    });

    // Assign ranks
    sortedStandings.forEach((player, index) => {
      player.rank = index + 1;
    });

    setStandings(sortedStandings);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/tournaments/${tournament.id}`}>
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tournament Standings</h1>
              <p className="text-sm text-gray-600">{tournament.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tournament Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{matches.length}</div>
              <div className="text-sm text-gray-600">Completed Matches</div>
            </div>
          </div>
        </div>

        {/* Standings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Standings</h3>
          
          {standings.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches completed yet</p>
              <p className="text-sm text-gray-500 mt-1">Complete some matches to see standings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {standings.map((player) => (
                <div key={player.id} className={`border rounded-lg p-4 ${getRankColor(player.rank)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{player.name}</p>
                        <p className="text-sm text-gray-600">{player.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{player.matchesWon}/{player.matchesPlayed}</div>
                        <div className="text-gray-600">W/L</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{player.winRate.toFixed(0)}%</div>
                        <div className="text-gray-600">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{player.totalPoints}</div>
                        <div className="text-gray-600">Total Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{player.averagePoints.toFixed(1)}</div>
                        <div className="text-gray-600">Avg Points</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Standings Legend</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>1st Place</span>
              </div>
              <div className="flex items-center space-x-2">
                <Medal className="w-4 h-4 text-gray-400" />
                <span>2nd Place</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Medal className="w-4 h-4 text-amber-600" />
                <span>3rd Place</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-600">#</span>
                <span>Other Ranks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
