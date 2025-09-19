"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Play, Clock, CheckCircle, Trophy, Users, Calendar, MapPin, Target } from "lucide-react";

interface Match {
  id: string;
  league_id: string;
  box_id: string;
  player1_id: string;
  player2_id: string;
  status: string;
  match_type: string;
  scheduled_at: string;
  court_number: number;
  player1_score: number;
  player2_score: number;
  sets_to_win: number;
  points_to_win: number;
  current_set: number;
  box: {
    id: string;
    box_number: number;
    box_level: number;
    box_name: string;
  };
}

export function MatchesList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoreForm, setScoreForm] = useState({
    player1_score: 0,
    player2_score: 0,
    sets_to_win: 3,
    points_to_win: 11,
  });

  useEffect(() => {
    fetchMatches();
  }, [statusFilter]);

  const fetchMatches = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/matches?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setMatches(data.matches || []);
      } else {
        console.error("Error fetching matches:", data.error);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches; // For now, show all matches since we don't have user context

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="w-4 h-4" />;
      case "in_progress": return <Play className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <Trophy className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const openScoreModal = (match: Match) => {
    setSelectedMatch(match);
    setScoreForm({
      player1_score: match.player1_score,
      player2_score: match.player2_score,
      sets_to_win: match.sets_to_win,
      points_to_win: match.points_to_win,
    });
  };

  const submitScore = async () => {
    if (!selectedMatch) return;

    try {
      const response = await fetch(`/api/leagues/${selectedMatch.league_id}/matches/${selectedMatch.id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreForm),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Score submitted successfully!');
        setSelectedMatch(null);
        fetchMatches(); // Refresh the list
      } else {
        alert(result.error || 'Failed to submit score');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Matches</h2>
        <p className="text-gray-600">View and manage your upcoming and completed matches</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter !== "all"
              ? "No matches with this status"
              : "You don't have any matches yet. Join a league to get started!"}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2">
            Browse Leagues
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🏸</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Player {match.player1_id.slice(0, 8)} vs Player {match.player2_id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">Box {match.box.box_number} - {match.box.box_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(match.status)}`}>
                    {getStatusIcon(match.status)}
                    <span>{match.status}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {match.scheduled_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(match.scheduled_at)}</span>
                  </div>
                )}
                {match.scheduled_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(match.scheduled_at)}</span>
                  </div>
                )}
                {match.court_number && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Court {match.court_number}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>Best of {match.sets_to_win} sets</span>
                </div>
              </div>

              {match.status === "completed" && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {match.player1_score} - {match.player2_score}
                    </div>
                    <div className="text-sm text-gray-600">Final Score</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {match.match_type === "round_robin" ? "Round Robin" : "Tournament"}
                </div>
                <div className="flex space-x-2">
                  {match.status === "scheduled" && (
                    <Button
                      onClick={() => openScoreModal(match)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm flex items-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Enter Score</span>
                    </Button>
                  )}
                  {match.status === "in_progress" && (
                    <Button
                      onClick={() => openScoreModal(match)}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Score</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Entry Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Match Score</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Match Details</div>
                <div className="font-medium">
                  Player {selectedMatch.player1_id.slice(0, 8)} vs Player {selectedMatch.player2_id.slice(0, 8)}
                </div>
                <div className="text-sm text-gray-600">Box {selectedMatch.box.box_number}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player {selectedMatch.player1_id.slice(0, 8)} Score
                  </label>
                  <Input
                    type="number"
                    value={scoreForm.player1_score}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, player1_score: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player {selectedMatch.player2_id.slice(0, 8)} Score
                  </label>
                  <Input
                    type="number"
                    value={scoreForm.player2_score}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, player2_score: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sets to Win
                  </label>
                  <Input
                    type="number"
                    value={scoreForm.sets_to_win}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, sets_to_win: parseInt(e.target.value) || 3 }))}
                    className="w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points to Win Set
                  </label>
                  <Input
                    type="number"
                    value={scoreForm.points_to_win}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, points_to_win: parseInt(e.target.value) || 11 }))}
                    className="w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="21"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setSelectedMatch(null)}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={submitScore}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
              >
                Submit Score
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
