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
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No matches yet</h3>
        <p className="text-gray-500 mb-4">Matches will appear here once the league starts and they are generated.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
          className={`border rounded-xl p-4 ${getStatusColor(match.status)}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(match.status)}
              <span className="font-medium text-gray-900">
                {match.league_boxes.name} - Level {match.league_boxes.level}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(match.scheduled_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{match.player1_username}</span>
                {match.status === 'completed' && (
                  <span className="text-lg font-bold text-gray-900">
                    {match.player1_score}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{match.player2_username}</span>
                {match.status === 'completed' && (
                  <span className="text-lg font-bold text-gray-900">
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
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Enter Score</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Score Entry Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Match Score</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{selectedMatch.league_boxes.name}</p>
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedMatch.player1_username}</span>
                <span className="text-gray-400">vs</span>
                <span className="font-medium">{selectedMatch.player2_username}</span>
              </div>
            </div>

            <form onSubmit={handleScoreSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedMatch.player1_username} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedMatch.player2_username} Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
