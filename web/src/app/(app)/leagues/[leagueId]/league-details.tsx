"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Trophy, Users, Calendar, MapPin, Copy, Share, Play, Settings, Target, Clock } from "lucide-react";
import { showToast } from "@/components/toast";
import { GuestPlayerManager } from "@/components/guest-player-manager";
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
  invite_link: string;
  created_at: string;
  created_by: string;
  is_creator?: boolean;
  is_participant?: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  confirmed_at?: string;
  username?: string;
}

export function LeagueDetails({ leagueId }: { leagueId: string }) {
  const [league, setLeague] = useState<League | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showConfirm, showSuccess, showError } = useModal();
  const [showSettings, setShowSettings] = useState(false);
  const [generatingMatches, setGeneratingMatches] = useState(false);

  useEffect(() => {
    fetchLeagueDetails();
    fetchParticipants();
  }, [leagueId]);

  const fetchLeagueDetails = async () => {
    try {
      // Validate leagueId
      if (!leagueId || typeof leagueId !== 'string') {
        console.error("Invalid leagueId:", leagueId);
        return;
      }

      console.log("Fetching league with ID:", leagueId);
      const response = await fetch(`/api/leagues/${leagueId}`);
      const data = await response.json();

      if (response.ok) {
        setLeague(data.league);
      } else {
        console.error("Error fetching league:", data.error);
      }
    } catch (error) {
      console.error("Error fetching league:", error);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Validate leagueId
      if (!leagueId || typeof leagueId !== 'string') {
        console.error("Invalid leagueId for participants:", leagueId);
        return;
      }

      const response = await fetch(`/api/leagues/${leagueId}/participants`);
      const data = await response.json();

      if (response.ok) {
        setParticipants(data.participants || []);
      } else {
        console.error("Error fetching participants:", data.error);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (league?.invite_code) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(league.invite_code);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = league.invite_code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedCode(true);
        showToast({
          type: 'success',
          title: 'Copied!',
          message: 'Invite code copied to clipboard',
          duration: 2000
        });
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        // Still show feedback even if copy fails
        setCopiedCode(true);
        showToast({
          type: 'error',
          title: 'Copy failed',
          message: 'Please try again',
          duration: 2000
        });
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const copyInviteLink = async () => {
    if (league?.invite_link) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(league.invite_link);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = league.invite_link;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedLink(true);
        showToast({
          type: 'success',
          title: 'Copied!',
          message: 'Invite link copied to clipboard',
          duration: 2000
        });
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        // Still show feedback even if copy fails
        setCopiedLink(true);
        showToast({
          type: 'error',
          title: 'Copy failed',
          message: 'Please try again',
          duration: 2000
        });
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const startLeague = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to start this league? This will create boxes and matches.",
      "Start League"
    );
    
    if (!confirmed) {
      return;
    }

    try {
      // Check if league has enough participants
      if (participants.length < 4) {
        await showError('You need at least 4 participants to start a league');
        return;
      }

      const response = await fetch(`/api/leagues/${leagueId}/start`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        await showSuccess('League started successfully! Boxes and matches have been created.');
        fetchLeagueDetails(); // Refresh league data
      } else {
        await showError(result.error || 'Failed to start league');
      }
    } catch (error) {
      console.error('Error starting league:', error);
      await showError('Failed to start league');
    }
  };

  const generateMatches = async () => {
    setGeneratingMatches(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/generate-matches`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || `Generated ${data.totalMatches} matches successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate matches');
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Failed to generate matches');
    } finally {
      setGeneratingMatches(false);
    }
  };


  const joinLeague = async () => {
    if (!league?.invite_code) {
      alert("No invite code available");
      return;
    }

    try {
      const response = await fetch("/api/leagues/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invite_code: league.invite_code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Successfully joined!',
          message: `You've joined ${league?.name}`,
          duration: 3000
        });
        // Update local league state with new player count
        if (league) {
          setLeague(prev => prev ? { ...prev, current_players: prev.current_players + 1 } : null);
        }
        // Refresh the league details and participants
        fetchLeagueDetails();
        fetchParticipants();
      } else {
        showToast({
          type: 'error',
          title: 'Failed to join league',
          message: data.error || "Unknown error",
          duration: 4000
        });
      }
    } catch (error) {
      console.error("Error joining league:", error);
      showToast({
        type: 'error',
        title: 'Failed to join league',
        message: 'Please try again',
        duration: 4000
      });
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
      case "pickleball": return "🏓";
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

  if (!league) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">League not found</h3>
        <p className="text-gray-600">The league you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getSportIcon(league.sport)}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{league.name}</h2>
              <p className="text-gray-600 capitalize">{league.sport} League</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(league.status)}`}>
            {league.status}
          </span>
        </div>

        {league.description && (
          <p className="text-gray-700 mb-4">{league.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
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
              <span>{league.location}</span>
            </div>
          )}
          {league.entry_fee > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">€{league.entry_fee} entry</span>
            </div>
          )}
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share League</h3>
        
        <div className="space-y-4">
          {/* Invite Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-lg">
                {league.invite_code}
              </div>
              <Button
                onClick={copyInviteCode}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCode ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Link
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 truncate">
                {league.invite_link}
              </div>
              <Button
                onClick={copyInviteLink}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 flex items-center space-x-2"
              >
                <Share className="w-4 h-4" />
                <span>{copiedLink ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <GuestPlayerManager 
          leagueId={leagueId} 
          maxPlayers={league?.max_players || 8}
          currentPlayers={league?.current_players || 0}
        />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">League Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Show Join League button for non-participants */}
          {!league.is_participant && !league.is_creator && league.status === "open" && (
            <Button
              onClick={joinLeague}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2 col-span-2"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Join League</span>
            </Button>
          )}

          {/* Show admin controls only for creators */}
          {league.is_creator && (
            <>
              {league.status === "open" && (
                <>
                  <Button
                    onClick={startLeague}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-medium">Start League</span>
                  </Button>
                </>
              )}
              
              {league.status === "started" && (
                <>
                  <Button 
                    onClick={generateMatches}
                    disabled={generatingMatches}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-medium">{generatingMatches ? "Generating..." : "Generate Matches"}</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = `/leagues/${leagueId}/boxes`}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">View Boxes</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = `/leagues/${leagueId}/matches`}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Target className="w-5 h-5" />
                    <span className="font-medium">View Matches</span>
                  </Button>
                </>
              )}
              
              <Button 
                onClick={() => setShowSettings(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-4 flex items-center justify-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Button>
            </>
          )}

          {/* Show participant actions for non-creators */}
          {!league.is_creator && league.is_participant && (
            <>
              {league.status === "started" && (
                <>
                  <Button 
                    onClick={() => window.location.href = `/leagues/${leagueId}/boxes`}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">View Boxes</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = `/leagues/${leagueId}/matches`}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2"
                  >
                    <Target className="w-5 h-5" />
                    <span className="font-medium">View Matches</span>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">League Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Name
                </label>
                <input
                  type="text"
                  value={league?.name || ''}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Players
                </label>
                <input
                  type="number"
                  value={league?.max_players || 8}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  League settings are currently read-only. More options coming soon!
                </p>
                <Button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
