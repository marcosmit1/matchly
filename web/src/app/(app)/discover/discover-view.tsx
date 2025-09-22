'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Users, Calendar, Trophy, Plus, Target, Hash, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/blocks/button';
import { Input } from '@/blocks/input';
import { showToast } from '@/components/toast';
import { useModal } from '@/contexts/modal-context';

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
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    type?: 'tournament' | 'league';
    data?: any;
    error?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showModal, hideModal } = useModal();

  useEffect(() => {
    fetchPublicData();
  }, []);

  // Debug effect to track codeValidation state changes
  useEffect(() => {
    console.log('🔄 useEffect - codeValidation state changed:', codeValidation);
    console.log('🔄 useEffect - inviteCode state:', inviteCode);
    console.log('🔄 useEffect - joining state:', joining);
  }, [codeValidation, inviteCode, joining]);

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
      case 'pickleball': return '🏓';
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

  const validateInviteCode = async (code: string) => {
    console.log('🔍 validateInviteCode called with:', code);
    if (code.length !== 5) {
      console.log('❌ Code length not 5, setting validation to null');
      setCodeValidation(null);
      return;
    }

    console.log('⏳ Starting validation...');
    setValidatingCode(true);
    try {
      const response = await fetch('/api/validate-invite-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();
      console.log('✅ Validation response:', data);
      console.log('📝 Setting codeValidation to:', data);
      setCodeValidation(data);
      console.log('📋 After setCodeValidation call, local data:', data);

      // Add a small delay to see if state updates
      setTimeout(() => {
        console.log('🕐 After timeout - current codeValidation state should be updated');
      }, 100);
    } catch (error) {
      console.error('❌ Error validating invite code:', error);
      setCodeValidation({ valid: false, error: 'Failed to validate code' });
    } finally {
      setValidatingCode(false);
    }
  };

  // Create a component for the modal content so it can re-render
  const JoinCodeModalContent = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/80 mb-6">
            Enter the 5-digit invite code to join a tournament or league
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              placeholder="Enter 5-digit code"
              value={inviteCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                console.log('🎯 Input onChange - Setting inviteCode to:', value);
                setInviteCode(value);
              }}
              className="w-full px-4 py-3 text-center font-mono text-lg tracking-wider rounded-xl text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 bg-white/20 border-2 border-white/40"
              maxLength={5}
              autoFocus
              style={{
                color: 'white',
              }}
            />

          </div>

          <button
            onClick={() => {
              console.log('🔥 Join button clicked!');
              handleJoinWithCode();
            }}
            disabled={joining || inviteCode.length !== 5}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-xl font-medium"
          >
            {joining ? 'Joining...' : 'Join'}
          </button>

        </div>
      </div>
    );
  };

  const showJoinCodeModal = () => {
    // Reset invite code when opening modal
    setInviteCode('');
    setCodeValidation(null);
    setIsModalOpen(true);
  };

  const handleJoinWithCode = async () => {
    console.log('🚀 handleJoinWithCode called');

    if (!inviteCode.trim()) {
      showToast({ type: "error", title: "Please enter an invite code" });
      return;
    }

    if (inviteCode.length !== 5) {
      showToast({ type: "error", title: "Please enter a 5-digit invite code" });
      return;
    }

    setJoining(true);
    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast({
          type: "success",
          title: data.message || "Successfully joined!"
        });

        // Redirect to the appropriate page
        if (data.type === 'tournament') {
          window.location.href = `/tournaments/${data.data.tournament_id}`;
        } else if (data.type === 'league') {
          window.location.href = `/leagues/${data.data.league_id}`;
        }
      } else {
        showToast({
          type: "error",
          title: data.error || "Invalid invite code"
        });
      }
    } catch (error) {
      console.error('❌ Error joining with code:', error);
      showToast({
        type: "error",
        title: "An unexpected error occurred"
      });
    } finally {
      setJoining(false);
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
    <div className="space-y-6 pb-6">
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


        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {['all', 'squash', 'padel', 'pickleball', 'tennis', 'badminton'].map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                sportFilter === sport
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {[
            { key: 'all', label: 'All', icon: '🏆' },
            { key: 'leagues', label: 'Leagues', icon: '🏆' },
            { key: 'tournaments', label: 'Tournaments', icon: '🎯' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setTypeFilter(type.key as 'all' | 'leagues' | 'tournaments')}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center space-x-1 transition-all duration-300 flex-shrink-0 ${
                typeFilter === type.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/create-league">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl p-4 flex items-center justify-center space-x-2 hover:shadow-md transition-all">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Create League</span>
          </div>
        </Link>
        <Link href="/create-tournament">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl p-4 flex items-center justify-center space-x-2 hover:shadow-md transition-all">
            <Target className="w-5 h-5" />
            <span className="font-medium">Create Tournament</span>
          </div>
        </Link>
        <button
          onClick={() => showJoinCodeModal()}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl p-4 flex items-center justify-center space-x-2 hover:shadow-md transition-all"
        >
          <Hash className="w-5 h-5" />
          <span className="font-medium">Join with Code</span>
        </button>
      </div>


      {/* Custom Join Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>

            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                    <Hash className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Join with Invite Code</h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <JoinCodeModalContent />
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="grid gap-4">
          {filteredLeagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.id}`}>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
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
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{league.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
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
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{league.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
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
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
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
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
