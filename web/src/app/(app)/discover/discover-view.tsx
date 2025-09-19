'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, Trophy, Plus, Target } from 'lucide-react';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  description: string;
  sport: string;
  max_players: number;
  current_players: number;
  start_date: string;
  location: string;
  status: string;
  created_by: string;
  created_at: string;
  users: {
    username: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  max_players: number;
  current_players: number;
  start_date: string;
  location: string;
  status: string;
  created_by: string;
  created_at: string;
  tournament_type: string;
  number_of_courts: number;
  points_to_win: number;
  users: {
    username: string;
  };
}

export function DiscoverView() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'leagues' | 'tournaments'>('all');

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      // Fetch leagues
      const leaguesResponse = await fetch('/api/leagues?public=true');
      const leaguesData = await leaguesResponse.json();
      setLeagues(leaguesData.leagues || []);

      // Fetch tournaments
      const tournamentsResponse = await fetch('/api/tournaments?public=true');
      const tournamentsData = await tournamentsResponse.json();
      setTournaments(tournamentsData.tournaments || []);
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         league.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === 'all' || league.sport === sportFilter;
    const matchesType = typeFilter === 'all' || typeFilter === 'leagues';
    return matchesSearch && matchesSport && matchesType && league.status === 'open';
  });

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === 'all' || tournament.sport === sportFilter;
    const matchesType = typeFilter === 'all' || typeFilter === 'tournaments';
    return matchesSearch && matchesSport && matchesType && tournament.status === 'open';
  });

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'squash': return '🏸';
      case 'padel': return '🎾';
      case 'tennis': return '🎾';
      case 'badminton': return '🏸';
      default: return '🏆';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'started': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search leagues and tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['all', 'squash', 'padel', 'tennis', 'badminton'].map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                sportFilter === sport
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: '🏆' },
            { key: 'leagues', label: 'Leagues', icon: '🏆' },
            { key: 'tournaments', label: 'Tournaments', icon: '🎯' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setTypeFilter(type.key as 'all' | 'leagues' | 'tournaments')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                typeFilter === type.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/create-league">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Create League</span>
          </div>
        </Link>
        <Link href="/create-tournament">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 hover:from-purple-700 hover:to-pink-700 transition-all">
            <Target className="w-5 h-5" />
            <span className="font-medium">Create Tournament</span>
          </div>
        </Link>
      </div>

      {/* Content List */}
      {(filteredLeagues.length === 0 && filteredTournaments.length === 0) ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-500">
            {searchTerm || sportFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a league or tournament!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.id}`}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getSportIcon(league.sport)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{league.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{league.sport} League</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                    {league.status}
                  </span>
                </div>

                {league.description && (
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{league.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{league.current_players}/{league.max_players} players</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(league.start_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {league.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{league.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Created by {league.users?.username || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(league.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Tournaments */}
          {filteredTournaments.map((tournament) => (
            <Link key={`tournament-${tournament.id}`} href={`/tournaments/${tournament.id}`}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getSportIcon(tournament.sport)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{tournament.sport} Tournament</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Tournament
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {tournament.tournament_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </span>
                  </div>
                </div>

                {tournament.description && (
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{tournament.current_players}/{tournament.max_players} players</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>{tournament.number_of_courts} courts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🎯</span>
                    <span>{tournament.points_to_win} points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {tournament.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Created by Tournament Creator
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(tournament.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
