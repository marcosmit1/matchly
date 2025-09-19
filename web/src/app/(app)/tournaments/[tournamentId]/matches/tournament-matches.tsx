"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  CheckCircle,
  Target,
  Users,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import "./score-input.css";

interface Tournament {
  id: string;
  name: string;
  sport: string;
  tournament_type: string;
  number_of_courts: number;
  points_to_win: number;
  status: string;
}

interface Round {
  id: string;
  round_number: number;
  status: string;
  created_at: string;
}

interface Match {
  id: string;
  round_id: string;
  court_number: number;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  status: string;
  player1_score: number | null;
  player2_score: number | null;
  player3_score: number | null;
  player4_score: number | null;
  created_at: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  player3?: { id: string; name: string };
  player4?: { id: string; name: string };
}

interface PlayerRanking {
  id: string;
  name: string;
  wins: number;
  total_points: number;
  rank: number;
}

interface TournamentMatchesProps {
  tournament: Tournament;
  rounds: Round[];
  matches: Match[];
}

export function TournamentMatches({ tournament, rounds, matches }: TournamentMatchesProps) {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{[key: string]: {p1: number | string, p2: number | string, p3: number | string, p4: number | string}}>({});
  const [matchesData, setMatchesData] = useState<Match[]>(matches);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [roundCompletion, setRoundCompletion] = useState<any>(null);
  const [advancingRound, setAdvancingRound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [finalRankings, setFinalRankings] = useState<PlayerRanking[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  useEffect(() => {
    checkRoundCompletion(selectedRound);
  }, [selectedRound, matchesData]);

  // Refresh rounds data when component mounts
  useEffect(() => {
    const refreshRounds = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournament.id}/rounds`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rounds) {
            // Update the rounds data if needed
            // This ensures we have the latest round information
          }
        }
      } catch (error) {
        console.error('Error refreshing rounds:', error);
      }
    };
    
    refreshRounds();
  }, [tournament.id]);

  // Check if playoffs are complete when component mounts
  useEffect(() => {
    if (tournament.status === 'playoffs') {
      // Check if the current round (playoffs) is complete
      const currentRound = rounds.find(r => r.round_number === selectedRound);
      if (currentRound) {
        checkRoundCompletion(selectedRound);
      }
    }
  }, [tournament.status, selectedRound, rounds]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredMatches = matchesData.filter(match => {
    const round = rounds.find(r => r.id === match.round_id);
    return round?.round_number === selectedRound;
  });

  const checkRoundCompletion = async (roundNumber: number) => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/advance-round?round=${roundNumber}`);
      const data = await response.json();
      if (data.success) {
        setRoundCompletion(data.data);
        
        // If this is a playoffs round and it's complete, fetch final rankings
        if (tournament.status === 'playoffs' && data.data.is_complete) {
          await fetchFinalRankings();
        }
      }
    } catch (error) {
      console.error('Error checking round completion:', error);
    }
  };

  const fetchFinalRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/standings`);
      const data = await response.json();
      if (data.success && data.rankings) {
        // Get top 3 players
        const top3 = data.rankings.slice(0, 3).map((player: any, index: number) => ({
          id: player.id,
          name: player.name,
          wins: player.wins || 0,
          total_points: player.total_points || 0,
          rank: index + 1
        }));
        setFinalRankings(top3);
      }
    } catch (error) {
      console.error('Error fetching final rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  const advanceToNextRound = async () => {
    setAdvancingRound(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/advance-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        // Automatically switch to the new round
        const newRoundNumber = data.data.new_round_number;
        setSelectedRound(newRoundNumber);
        
        // Show success message
        alert(`Successfully advanced to Round ${newRoundNumber}!`);
        
        // Refresh the page to show the new round data
        window.location.reload();
      } else {
        alert(`Failed to advance round: ${data.error}`);
      }
    } catch (error) {
      console.error('Error advancing round:', error);
      alert('Failed to advance round. Please try again.');
    } finally {
      setAdvancingRound(false);
    }
  };

  const generateMatches = async () => {
    if (!confirm('Generate matches for the current round? This will create match pairings.')) {
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/generate-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Matches generated successfully!');
        // Refresh the page to show updated matches
        window.location.reload();
      } else {
        // Handle the case where matches already exist
        if (data.existingMatches) {
          alert(`Matches already exist for this round (${data.existingMatches} matches found).`);
        } else {
          alert(`Failed to generate matches: ${data.error || data.message}`);
        }
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Failed to generate matches. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleScoreChange = (matchId: string, player: string, value: string) => {
    // Allow empty string for proper deletion
    const numValue = value === '' ? '' : parseInt(value) || 0;
    const pointsToWin = tournament.points_to_win || 21;
    
    setScores(prev => {
      const currentScores = {
        ...prev[matchId],
        [player]: numValue
      };
      
      // Auto-calculate the other team's score
      if (player === 'p1' && numValue !== '') {
        // If Team 1 score is entered, calculate Team 2 score
        const team1Score = typeof numValue === 'number' ? numValue : parseInt(numValue) || 0;
        const team2Score = Math.max(0, pointsToWin - team1Score);
        currentScores.p3 = team2Score;
      } else if (player === 'p3' && numValue !== '') {
        // If Team 2 score is entered, calculate Team 1 score
        const team2Score = typeof numValue === 'number' ? numValue : parseInt(numValue) || 0;
        const team1Score = Math.max(0, pointsToWin - team2Score);
        currentScores.p1 = team1Score;
      }
      
      return {
        ...prev,
        [matchId]: currentScores
      };
    });
  };

  const saveScores = async (matchId: string) => {
    const matchScores = scores[matchId];
    if (!matchScores) return;

    // Validate that Team 1 score is provided (Team 2 is auto-calculated)
    if (matchScores.p1 === '' || matchScores.p1 === null || matchScores.p1 === undefined) {
      alert('Please enter Team 1\'s score');
      return;
    }

    const pointsToWin = tournament.points_to_win || 21;
    const team1Score = typeof matchScores.p1 === 'number' ? matchScores.p1 : parseInt(matchScores.p1) || 0;
    const team2Score = pointsToWin - team1Score;

    // Validate that the score is within valid range
    if (team1Score < 0 || team1Score > pointsToWin) {
      alert(`Score must be between 0 and ${pointsToWin}`);
      return;
    }

    setSavingMatch(matchId);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/matches/${matchId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1_score: team1Score,
          player2_score: team1Score, // Same as player1 for team scoring
          player3_score: team2Score,
          player4_score: team2Score, // Same as player3 for team scoring
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update the local matches data instead of refreshing
        setMatchesData(prevMatches =>
          prevMatches.map(match =>
            match.id === matchId
              ? {
                  ...match,
                  player1_score: team1Score,
                  player2_score: team1Score,
                  player3_score: team2Score,
                  player4_score: team2Score,
                  status: 'completed'
                }
              : match
          )
        );
        
        // Clear the editing state and scores
        setEditingMatch(null);
        setScores(prev => {
          const newScores = { ...prev };
          delete newScores[matchId];
          return newScores;
        });
        
        // Show success toast
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(`Failed to save scores: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores. Please try again.');
    } finally {
      setSavingMatch(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Scores saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/tournaments/${tournament.id}`}>
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tournament Matches</h1>
              <p className="text-sm text-gray-600">{tournament.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Round Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Round</h3>
            {filteredMatches.length === 0 && (
              <Button
                onClick={generateMatches}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span>{generating ? 'Generating...' : 'Generate Matches'}</span>
              </Button>
            )}
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {rounds.map((round) => (
              <button
                key={round.id}
                onClick={() => setSelectedRound(round.round_number)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedRound === round.round_number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Round {round.round_number}
              </button>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Round {selectedRound} Matches
            </h3>
            <span className="text-sm text-gray-600">
              {filteredMatches.length} matches
            </span>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches found for this round</p>
              <p className="text-sm text-gray-500 mt-1">Generate matches to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredMatches.map((match) => (
                <div key={match.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Court {match.court_number}</h4>
                        <p className="text-sm text-gray-600">Match #{match.court_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(match.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                        {match.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Team 1 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Team 1</span>
                      </div>
                      <div className="space-y-2 pl-8">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm font-medium text-gray-700">{match.player1?.name || 'Player 1'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm font-medium text-gray-700">{match.player2?.name || 'Player 2'}</p>
                        </div>
                      </div>
                      <div className="pl-8">
                        <p className="text-xs text-gray-500">Enter score (auto-calculates other team)</p>
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">2</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Team 2</span>
                      </div>
                      <div className="space-y-2 pl-8">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <p className="text-sm font-medium text-gray-700">{match.player3?.name || 'Player 3'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <p className="text-sm font-medium text-gray-700">{match.player4?.name || 'Player 4'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  {match.status === 'completed' ? (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center justify-center space-x-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl font-bold text-white">
                              {match.player1_score || 0}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-green-800">Team 1</p>
                        </div>
                        <div className="text-2xl font-bold text-green-600">-</div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl font-bold text-white">
                              {match.player3_score || 0}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-green-800">Team 2</p>
                        </div>
                      </div>
                    </div>
                  ) : editingMatch === match.id ? (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600">
                          Enter Team 1&apos;s score - Team 2&apos;s score will be automatically calculated
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Total points: {tournament.points_to_win || 21}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-6">
                        {/* Team 1 Score */}
                        <div className="text-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={tournament.points_to_win}
                              value={scores[match.id]?.p1 || ''}
                              onChange={(e) => handleScoreChange(match.id, 'p1', e.target.value)}
                              placeholder="0"
                              className="score-input w-20 h-20 bg-black text-white text-2xl font-bold text-center rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">1</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mt-2">Team 1</p>
                          <p className="text-xs text-gray-500 mt-1">Enter score</p>
                        </div>

                        {/* VS Divider */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-sm">VS</span>
                          </div>
                        </div>

                        {/* Team 2 Score */}
                        <div className="text-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={tournament.points_to_win}
                              value={scores[match.id]?.p3 || ''}
                              placeholder="0"
                              className="score-input w-20 h-20 bg-gray-600 text-white text-2xl font-bold text-center rounded-xl border-2 border-gray-400"
                              readOnly
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">2</span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mt-2">Team 2</p>
                          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 mt-6">
                        <Button
                          onClick={() => saveScores(match.id)}
                          disabled={savingMatch === match.id}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-xl font-medium shadow-lg"
                        >
                          {savingMatch === match.id ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </div>
                          ) : (
                            "✓ Save Scores"
                          )}
                        </Button>
                        <Button
                          onClick={() => setEditingMatch(null)}
                          disabled={savingMatch === match.id}
                          className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 rounded-xl font-medium shadow-lg"
                        >
                          ✕ Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Button
                        onClick={() => setEditingMatch(match.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium shadow-lg"
                      >
                        <Target className="w-5 h-5 mr-2" />
                        Enter Scores
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Round Advancement or Final Standings */}
        {roundCompletion && roundCompletion.is_complete && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-200">
            {tournament.status === 'playoffs' ? (
              /* Final Tournament Results */
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  🏆 Tournament Complete! 🏆
                </h3>
                <p className="text-gray-600 mb-6">
                  All playoff matches have been completed. Here are the final results:
                </p>
                
                {loadingRankings ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                    <span className="text-gray-600">Loading final rankings...</span>
                  </div>
                ) : finalRankings.length > 0 ? (
                  <div className="space-y-4">
                    {finalRankings.map((player, index) => (
                      <div key={player.id} className={`p-4 rounded-xl border-2 ${
                        index === 0 ? 'bg-yellow-50 border-yellow-300' :
                        index === 1 ? 'bg-gray-50 border-gray-300' :
                        'bg-orange-50 border-orange-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              'bg-orange-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{player.name}</h4>
                              <p className="text-sm text-gray-600">
                                {player.wins} wins • {player.total_points} total points
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No rankings available</p>
                )}
              </div>
            ) : (
              /* Regular Round Completion */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Round {selectedRound} Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  All {roundCompletion.total_matches} matches have been completed.
                </p>
                <Button
                  onClick={advanceToNextRound}
                  disabled={advancingRound}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
                >
                  {advancingRound ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Advancing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5" />
                      <span>Advance to Round {selectedRound + 1}</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Round Progress */}
        {roundCompletion && !roundCompletion.is_complete && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Round {selectedRound} Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Matches Completed</span>
              <span className="text-sm font-medium text-gray-900">
                {roundCompletion.completed_matches} / {roundCompletion.total_matches}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(roundCompletion.completed_matches / roundCompletion.total_matches) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {roundCompletion.incomplete_matches} matches remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
