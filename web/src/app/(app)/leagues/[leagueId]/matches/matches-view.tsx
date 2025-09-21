'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Users, Play, CheckCircle, XCircle } from 'lucide-react';

interface Match {
  id: string;
  box_id: string;
  player1_id: string;
  player2_id: string;
  player1_username: string;
  player2_username: string;
  player1_score: number | null;
  player2_score: number | null;
  status: 'scheduled' | 'completed';
  scheduled_at: string;
  played_at: string | null;
  league_boxes: {
    id: string;
    name: string;
    level: number;
  };
}

interface MatchesViewProps {
  leagueId: string;
}

export function MatchesView({ leagueId }: MatchesViewProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [leagueId]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/matches`);
      const data = await response.json();
      
      if (response.ok) {
        setMatches(data.matches || []);
      } else {
        console.error('Error fetching matches:', data.error);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/matches/${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1_score: parseInt(score1),
          player2_score: parseInt(score2),
        }),
      });

      if (response.ok) {
        await fetchMatches(); // Refresh matches
        setSelectedMatch(null);
        setScore1('');
        setScore2('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'scheduled':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
          <Trophy className="w-8 h-8 text-white/80" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No matches yet</h3>
        <p className="text-white/70 mb-6">Matches will appear here once the league starts and they are generated.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
        >
          Go Back to League
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {getStatusIcon(match.status)}
                </div>
                <div>
                  <span className="font-semibold text-white text-lg">
                    {match.league_boxes.name}
                  </span>
                  <p className="text-sm text-white/70">Level {match.league_boxes.level}</p>
                </div>
              </div>
              <span className="text-sm text-white/60">
                {new Date(match.scheduled_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white text-lg">{match.player1_username}</span>
                  {match.status === 'completed' && (
                    <span className="text-2xl font-bold text-white">
                      {match.player1_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-lg">{match.player2_username}</span>
                  {match.status === 'completed' && (
                    <span className="text-2xl font-bold text-white">
                      {match.player2_score}
                    </span>
                  )}
                </div>
              </div>

              {match.status === 'scheduled' && (
                <button
                  onClick={() => {
                    setSelectedMatch(match);
                    setScore1('');
                    setScore2('');
                  }}
                  className="ml-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  <span>Enter Score</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Score Entry Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-6">Enter Match Score</h3>
              
              <div className="mb-6">
                <p className="text-sm text-white/70 mb-3">{selectedMatch.league_boxes.name}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{selectedMatch.player1_username}</span>
                  <span className="text-white/60">vs</span>
                  <span className="font-semibold text-white">{selectedMatch.player2_username}</span>
                </div>
              </div>

              <form onSubmit={handleScoreSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      {selectedMatch.player1_username} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      className="w-full px-4 py-3 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      {selectedMatch.player2_username} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      className="w-full px-4 py-3 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/60"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(null)}
                    className="flex-1 px-4 py-3 border border-white/30 text-white/80 rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none transition-all duration-300"
                  >
                    {submitting ? 'Submitting...' : 'Submit Score'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
