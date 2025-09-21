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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 w-5 h-5 drop-shadow-lg" />
          <input
            type="text"
            placeholder="Search leagues and tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/80 shadow-inner"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['all', 'squash', 'padel', 'tennis', 'badminton'].map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                sportFilter === sport
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20'
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
              className={`px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap flex items-center space-x-2 transition-all duration-300 ${
                typeFilter === type.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/create-league">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
            <div className="relative z-10 flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="font-semibold text-white text-lg">Create League</span>
            </div>
          </div>
        </Link>
        <Link href="/create-tournament">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
            <div className="relative z-10 flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="font-semibold text-white text-lg">Create Tournament</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Content List */}
      {(filteredLeagues.length === 0 && filteredTournaments.length === 0) ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <Trophy className="w-8 h-8 text-white/80" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
          <p className="text-white/70">
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
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">{getSportIcon(league.sport)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{league.name}</h3>
                        <p className="text-sm text-white/70 capitalize">{league.sport} League</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                      {league.status}
                    </span>
                  </div>

                  {league.description && (
                    <p className="text-white/80 text-sm mb-4 line-clamp-2">{league.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-white/70 mb-4">
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
                    <div className="flex items-center space-x-2 text-sm text-white/70 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{league.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-xs text-white/60">
                      Created by {league.users?.username || 'Unknown User'}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(league.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Tournaments */}
          {filteredTournaments.map((tournament) => (
            <Link key={`tournament-${tournament.id}`} href={`/tournaments/${tournament.id}`}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">{getSportIcon(tournament.sport)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{tournament.name}</h3>
                        <p className="text-sm text-white/70 capitalize">{tournament.sport} Tournament</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-400/30">
                        Tournament
                      </span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium border border-orange-400/30">
                        {tournament.tournament_type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </div>
                  </div>

                  {tournament.description && (
                    <p className="text-white/80 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-white/70 mb-4">
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
                    <div className="flex items-center space-x-2 text-sm text-white/70 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{tournament.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-xs text-white/60">
                      Created by Tournament Creator
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(tournament.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
