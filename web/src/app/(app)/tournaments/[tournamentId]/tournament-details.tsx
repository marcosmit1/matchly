"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/modal-context";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  MapPin, 
  Target, 
  Trophy,
  Clock,
  Play,
  Settings,
  Share2,
  Copy,
  Check,
  Hash
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import { createClient } from "@/supabase/client";

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
  invite_code?: string;
  invite_link?: string;
}

interface TournamentDetailsProps {
  tournament: Tournament;
}

export function TournamentDetails({ tournament }: TournamentDetailsProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [startingPlayoffs, setStartingPlayoffs] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [finalRankings, setFinalRankings] = useState<any[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [playoffsComplete, setPlayoffsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const { showConfirm, showSuccess, showError } = useModal();

  useEffect(() => {
    fetchCurrentUser();
    fetchRounds();
  }, [tournament.id]);

  useEffect(() => {
    if (currentUser) {
      fetchParticipants();
    }
  }, [currentUser, tournament.id]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players`);
      const data = await response.json();
      setParticipants(data.players || []);
      
      // Check if current user is a participant
      if (currentUser) {
        const userIsParticipant = data.players?.some((player: any) => player.created_by === currentUser.id);
        setIsParticipant(userIsParticipant);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRounds = async () => {
    try {
      const supabase = createClient();
      const { data: roundsData, error } = await supabase
        .from("tournament_rounds")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("round_number", { ascending: true });
      
      if (error) {
        console.error('Error fetching rounds:', error);
      } else {
        setRounds(roundsData || []);
        
        // Check if playoffs are complete
        if (tournament.status === 'playoffs' && roundsData && roundsData.length > 0) {
          await checkPlayoffsCompletion(roundsData);
        }
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    }
  };

  const checkPlayoffsCompletion = async (roundsData: any[]) => {
    try {
      // Get the latest round (should be playoffs)
      const latestRound = roundsData[roundsData.length - 1];
      
      // Check if all matches in the latest round are completed
      const supabase = createClient();
      const { data: matches, error } = await supabase
        .from("tournament_matches")
        .select("status")
        .eq("tournament_id", tournament.id)
        .eq("round_id", latestRound.id);
      
      if (error) {
        console.error('Error checking playoff matches:', error);
        return;
      }
      
      if (matches && matches.length > 0) {
        const allCompleted = matches.every(match => match.status === 'completed');
        setPlayoffsComplete(allCompleted);
        
        if (allCompleted) {
          await fetchFinalRankings();
        }
      }
    } catch (error) {
      console.error('Error checking playoffs completion:', error);
    }
  };

  const fetchFinalRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/standings`);
      const data = await response.json();
      if (data.success && data.rankings) {
        setFinalRankings(data.rankings);
      }
    } catch (error) {
      console.error('Error fetching final rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  const startPlayoffs = async () => {
    if (!confirm('Start playoffs? This will create a final round with ranking-based matchups (top players vs top players).')) {
      return;
    }

    setStartingPlayoffs(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/start-playoffs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Playoffs started successfully! Top players will now face each other in the final round.');
        // Refresh rounds data and reload page
        await fetchRounds();
        window.location.reload();
      } else {
        alert(`Failed to start playoffs: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting playoffs:', error);
      alert('Failed to start playoffs. Please try again.');
    } finally {
      setStartingPlayoffs(false);
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/tournaments/${tournament.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showSuccess('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('Failed to copy invite link');
    }
  };

  const joinTournament = async () => {
    if (!currentUser) {
      showError('Please log in to join the tournament');
      return;
    }

    setJoining(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        showSuccess('Successfully joined the tournament!');
        setIsParticipant(true);
        // Refresh participants list
        await fetchParticipants();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to join tournament');
      }
    } catch (error) {
      showError('Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching current user:', error);
        return;
      }
      
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email,
        };
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const startTournament = async () => {
    const confirmed = await showConfirm(
      'Are you sure you want to start this tournament? This action cannot be undone.',
      'Start Tournament'
    );
    
    if (!confirmed) {
      return;
    }

    setStarting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await showSuccess('Tournament started successfully!');
        // Refresh rounds data and reload page
        await fetchRounds();
        window.location.reload();
      } else {
        await showError(`Failed to start tournament: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      await showError('Failed to start tournament. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const generateMatches = async () => {
    const confirmed = await showConfirm(
      'Generate matches for the current round? This will create match pairings.',
      'Generate Matches'
    );
    
    if (!confirmed) {
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
        await showSuccess('Matches generated successfully!');
        // Refresh the page to show updated matches
        window.location.reload();
      } else {
        // Handle the case where matches already exist
        if (data.existingMatches) {
          await showError(`Matches already exist for this round (${data.existingMatches} matches found). Please go to "View Matches" to see them.`);
        } else {
          await showError(`Failed to generate matches: ${data.error || data.message}`);
        }
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      await showError('Failed to generate matches. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'started':
        return 'bg-blue-100 text-blue-800';
      case 'playoffs':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'padel':
        return '🏓';
      case 'squash':
        return '🏸';
      case 'tennis':
        return '🎾';
      case 'badminton':
        return '🏸';
      default:
        return '🏆';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/discover">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{tournament.name}</h1>
              <p className="text-sm text-gray-600 capitalize">{tournament.sport} Tournament</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(playoffsComplete ? 'completed' : tournament.status)}`}>
            {playoffsComplete ? '🏆 Completed' :
             tournament.status === 'open' ? 'Open' :
             tournament.status === 'started' ? 'Started' :
             tournament.status === 'playoffs' ? '🏆 Playoffs' :
             tournament.status === 'completed' ? 'Completed' :
             'Cancelled'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tournament Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getSportIcon(tournament.sport)}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{tournament.name}</h2>
                <p className="text-sm text-gray-600 capitalize">{tournament.tournament_type} Format</p>
              </div>
            </div>
          </div>

          {tournament.description && (
            <p className="text-gray-700 mb-4">{tournament.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{tournament.current_players}/{tournament.max_players} players</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Target className="w-5 h-5" />
              <span>{tournament.number_of_courts} courts</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>🎯</span>
              <span>{tournament.points_to_win} points</span>
            </div>
          </div>

          {tournament.location && (
            <div className="flex items-center space-x-2 text-gray-600 mt-4">
              <MapPin className="w-5 h-5" />
              <span>{tournament.location}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {tournament.status === 'open' && (
          <div className="space-y-3">
            {/* Creator Actions */}
            {currentUser && currentUser.id === tournament.created_by && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={startTournament}
                  disabled={starting || participants.length < 4}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
                >
                  {starting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>{starting ? 'Starting...' : 'Start Tournament'}</span>
                </Button>
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Manage</span>
                </Button>
              </div>
            )}
            
            {/* Invite Link Button - Show for all users when tournament is open */}
            <Button 
              onClick={copyInviteLink}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              <span>{copied ? 'Copied!' : 'Share Invite Link'}</span>
            </Button>

            {/* Invite Code Display */}
            {tournament.invite_code && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">Invite Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
                    <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                      {tournament.invite_code}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(tournament.invite_code!);
                      showSuccess('Invite code copied!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Share this 5-digit code for easy joining
                </p>
              </div>
            )}
            
            {/* Player Actions */}
            {(!currentUser || currentUser.id !== tournament.created_by) && (
              <div className="grid grid-cols-2 gap-3">
                {!isParticipant ? (
                  <Button 
                    onClick={joinTournament}
                    disabled={joining || tournament.current_players >= tournament.max_players}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
                  >
                    {joining ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    <span>
                      {joining ? 'Joining...' : 
                       tournament.current_players >= tournament.max_players ? 'Tournament Full' : 
                       'Join Tournament'}
                    </span>
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full bg-green-600 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span>Joined</span>
                  </Button>
                )}
                <Button 
                  onClick={copyInviteLink}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </Button>
              </div>
            )}
            
            {/* Tournament Requirements */}
            {currentUser && currentUser.id === tournament.created_by && participants.length < 4 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Tournament Requirements</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  You need at least 4 players to start the tournament. Currently have {participants.length} players.
                </p>
              </div>
            )}
          </div>
        )}

        {tournament.status === 'started' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/tournaments/${tournament.id}/matches`}>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>View Matches</span>
                </Button>
              </Link>
              <Link href={`/tournaments/${tournament.id}/standings`}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 flex items-center justify-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Standings</span>
                </Button>
              </Link>
            </div>
            
            {/* Tournament Management for Creator */}
            {currentUser && currentUser.id === tournament.created_by && tournament.status === 'started' && (
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={startPlayoffs}
                  disabled={startingPlayoffs}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-xl py-3 flex items-center justify-center space-x-2"
                >
                  {startingPlayoffs ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Trophy className="w-5 h-5" />
                  )}
                  <span>{startingPlayoffs ? 'Starting Playoffs...' : 'Start Playoffs'}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tournament Rounds or Final Rankings */}
        {(tournament.status === 'started' || tournament.status === 'playoffs') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {playoffsComplete ? (
              /* Final Tournament Rankings */
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🏆 Tournament Complete! 🏆
                  </h3>
                  <p className="text-gray-600">
                    Final tournament rankings based on wins and total points
                  </p>
                </div>
                
                {loadingRankings ? (
                  <div className="flex items-center justify-center space-x-2 py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                    <span className="text-gray-600">Loading final rankings...</span>
                  </div>
                ) : finalRankings.length > 0 ? (
                  <div className="space-y-3">
                    {finalRankings.map((player, index) => (
                      <div key={player.id} className={`p-4 rounded-xl border-2 ${
                        index === 0 ? 'bg-yellow-50 border-yellow-300' :
                        index === 1 ? 'bg-gray-50 border-gray-300' :
                        index === 2 ? 'bg-orange-50 border-orange-300' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              index === 2 ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{player.name}</h4>
                              <p className="text-sm text-gray-600">
                                {player.wins} wins • {player.total_points} total points
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {index === 0 && <span className="text-3xl">🥇</span>}
                            {index === 1 && <span className="text-3xl">🥈</span>}
                            {index === 2 && <span className="text-3xl">🥉</span>}
                            {index > 2 && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-600">#{index + 1}</div>
                                <div className="text-xs text-gray-500">Place</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No rankings available</p>
                  </div>
                )}
              </div>
            ) : (
              /* Tournament Rounds */
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Rounds</h3>
                <div className="space-y-3">
                  {rounds.length > 0 ? (
                    rounds.map((round) => (
                      <div key={round.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            round.status === 'active' ? 'bg-blue-600' : 
                            round.status === 'completed' ? 'bg-green-600' : 'bg-gray-400'
                          }`}>
                            <span className="text-white text-sm font-medium">{round.round_number}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {tournament.status === 'playoffs' && round.round_number === Math.max(...rounds.map(r => r.round_number)) 
                                ? `🏆 Playoffs - Round ${round.round_number}` 
                                : `Round ${round.round_number}`}
                            </p>
                            <p className={`text-sm ${
                              round.status === 'active' ? 'text-blue-600' : 
                              round.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {round.status === 'active' ? 'Active' : 
                               round.status === 'completed' ? 'Completed' : 'Pending'}
                            </p>
                          </div>
                        </div>
                        <Link href={`/tournaments/${tournament.id}/matches`}>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                            View Matches
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No rounds created yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <span>{participants.length} participants</span>
              <div className={`transform transition-transform duration-200 ${showParticipants ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>
          
          {showParticipants && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No participants yet</p>
                  <p className="text-sm text-gray-500 mt-1">Be the first to join this tournament!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{participant.name}</p>
                          <p className="text-sm text-gray-500">{participant.email}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        Joined {new Date(participant.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tournament Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Format</span>
              <span className="font-medium capitalize">{tournament.tournament_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Points to Win</span>
              <span className="font-medium">{tournament.points_to_win}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="font-medium">{new Date(tournament.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
