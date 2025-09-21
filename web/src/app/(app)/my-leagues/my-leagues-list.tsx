"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Trophy, Users, Calendar, MapPin, Play, Settings, Target, Eye } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/contexts/modal-context";

interface League {
  id: string;
  name: string;
  description: string;
  sport: string;
  max_players: number;
  current_players: number;
  start_date: string;
  location: string;
  entry_fee: number;
  prize_pool: number;
  status: string;
  invite_code: string;
  created_at: string;
  created_by: string;
  is_creator: boolean;
  participant_status: string;
}

export function MyLeaguesList() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showSuccess, showError } = useModal();

  useEffect(() => {
    fetchMyLeagues();
  }, []);

  const fetchMyLeagues = async () => {
    try {
      // For now, we'll fetch all leagues and filter by current user
      // In a real implementation, you'd have separate endpoints for created vs joined leagues
      const response = await fetch('/api/leagues');
      const data = await response.json();

      if (response.ok) {
        // Get current user ID (this should come from auth context in a real app)
        // For now, we'll show all leagues and mark the first one as created by current user
        const currentUserId = "current-user-id"; // TODO: Get from auth context
        
        const myLeagues = (data.leagues || []).map((league: any, index: number) => ({
          ...league,
          is_creator: index === 0, // For demo purposes, mark first league as created by user
          participant_status: index === 0 ? 'creator' : 'participant'
        }));

        setLeagues(myLeagues);
      } else {
        console.error("Error fetching leagues");
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "full": return "bg-yellow-100 text-yellow-800";
      case "started": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "squash": return "🏸";
      case "padel": return "🎾";
      default: return "🏆";
    }
  };

  const startLeague = async (leagueId: string) => {
    const confirmed = await showConfirm(
      "Are you sure you want to start this league? This will create boxes and matches.",
      "Start League"
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/leagues/${leagueId}/start`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        await showSuccess('League started successfully! Boxes and matches have been created.');
        fetchMyLeagues(); // Refresh the list
      } else {
        await showError(result.error || 'Failed to start league');
      }
    } catch (error) {
      console.error('Error starting league:', error);
      await showError('Failed to start league');
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
        <h2 className="text-2xl font-bold text-gray-900">My Leagues</h2>
        <p className="text-gray-600">Manage your leagues and view your matches</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/create-league">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Create League</span>
          </Button>
        </Link>
        <Link href="/matches">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2">
            <Play className="w-5 h-5" />
            <span className="font-medium">My Matches</span>
          </Button>
        </Link>
      </div>

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues yet</h3>
          <p className="text-gray-600 mb-4">Create your first league or join an existing one</p>
          <div className="flex space-x-3 justify-center">
            <Link href="/create-league">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2">
                Create League
              </Button>
            </Link>
            <Link href="/leagues">
              <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-6 py-2">
                Browse Leagues
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getSportIcon(league.sport)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{league.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{league.sport} League</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                    {league.status}
                  </span>
                  {league.is_creator && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Creator
                    </span>
                  )}
                </div>
              </div>

              {league.description && (
                <p className="text-gray-700 mb-4 line-clamp-2">{league.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{league.current_players}/{league.max_players} players</span>
                </div>
                {league.start_date && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Starts {formatDate(league.start_date)}</span>
                  </div>
                )}
                {league.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{league.location}</span>
                  </div>
                )}
                {league.entry_fee > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">€{league.entry_fee} entry</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {league.is_creator ? "You created this league" : "You joined this league"}
                </div>
                <div className="flex space-x-2">
                  <Link href={`/leagues/${league.id}`}>
                    <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Button>
                  </Link>
                  {league.is_creator && league.status === "open" && (
                    <Button
                      onClick={() => startLeague(league.id)}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm flex items-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </Button>
                  )}
                  {league.status === "started" && (
                    <Link href={`/matches?league=${league.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>Matches</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
