"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, Calendar, MapPin, Search, Plus, Target } from "lucide-react";
import Link from "next/link";

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
  is_participant: boolean;
}

export function LeaguesList() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("all"); // all, created, joined

  useEffect(() => {
    fetchLeagues();
  }, [statusFilter, sportFilter]);

  const fetchLeagues = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sportFilter !== "all") params.append("sport", sportFilter);

      console.log("Fetching leagues with params:", params.toString());
      const response = await fetch(`/api/leagues?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        console.log("Leagues fetched successfully:", data.leagues);
        setLeagues(data.leagues || []);
      } else {
        console.error("Error fetching leagues:", data.error);
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         league.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesView = viewFilter === "all" || 
                       (viewFilter === "created" && league.is_creator) ||
                       (viewFilter === "joined" && league.is_participant && !league.is_creator);
    return matchesSearch && matchesView;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leagues</h2>
          <p className="text-gray-600">Manage your created and joined leagues</p>
        </div>
        <Link href="/create-league">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create League</span>
          </Button>
        </Link>
      </div>

      {/* View Filter Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "all", label: "All Leagues" },
          { key: "created", label: "Created" },
          { key: "joined", label: "Joined" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewFilter(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              viewFilter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sports</option>
            <option value="squash">Squash</option>
            <option value="padel">Padel</option>
          </select>
        </div>
      </div>

      {/* Leagues Grid */}
      {filteredLeagues.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== "all" || sportFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Be the first to create a league!"}
          </p>
          <Link href="/create-league">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2">
              Create League
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLeagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.id}`}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getSportIcon(league.sport)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{league.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{league.sport} League</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                      {league.status}
                    </span>
                    {league.is_creator && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Created by you
                      </span>
                    )}
                    {league.is_participant && !league.is_creator && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Joined
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
                    League ID: {league.id.slice(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(league.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  async function joinLeague(inviteCode: string) {
    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Successfully joined the league!');
        fetchLeagues(); // Refresh the list
      } else {
        alert(result.error || 'Failed to join league');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      alert('Failed to join league');
    }
  }
}
