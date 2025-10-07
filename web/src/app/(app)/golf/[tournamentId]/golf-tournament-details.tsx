"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/modal-context";
import { GolfTournamentGuestPlayerManager } from "@/components/golf-tournament-guest-player-manager";
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Trophy,
  Play,
  Share2,
  Copy,
  Check,
  Hash,
  BarChart3,
  Target,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import { createClient } from "@/supabase/client";
import type { GolfTournament } from "@/types/golf";

interface GolfTournamentDetailsProps {
  tournament: GolfTournament;
  userId: string;
}

export function GolfTournamentDetails({ tournament, userId }: GolfTournamentDetailsProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');
  const { showConfirm, showSuccess, showError } = useModal();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchParticipants();

      // Subscribe to tournament status changes
      const supabase = createClient();
      const subscription = supabase
        .channel(`tournament-${tournament.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'golf_tournaments',
            filter: `id=eq.${tournament.id}`
          },
          (payload: { new: { status: string } }) => {
            console.log('🔄 Tournament updated:', payload);
            // Refresh the page when tournament status changes
            if (payload.new.status !== tournament.status) {
              console.log('📢 Tournament status changed, reloading...');
              window.location.reload();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser, tournament.id, tournament.status]);

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
          username: user.user_metadata?.name || user.email,
        };
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const supabase = createClient();
      const { data: participantsData, error } = await supabase
        .from("golf_tournament_participants")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      setParticipants(participantsData || []);

      // Check if current user is a participant
      const userIsParticipant = participantsData?.some((p: any) => p.user_id === userId);
      setIsParticipant(userIsParticipant);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (tournament.invite_code) {
      await navigator.clipboard.writeText(tournament.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess("Invite code copied to clipboard!");
    }
  };

  const handleStartTournament = async () => {
    const confirmed = await showConfirm(
      `This will assign players to fourballs ${assignmentMode === 'auto' ? 'automatically' : 'manually'} and begin the tournament. Players will be able to start recording their scores.`,
      "Start Golf Tournament?"
    );

    if (!confirmed) return;

    setStarting(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_mode: assignmentMode })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start tournament');
      }

      showSuccess("Tournament started! Players can now begin scoring.");
      window.location.reload();
    } catch (error: any) {
      showError(error.message || "Failed to start tournament");
    } finally {
      setStarting(false);
    }
  };

  const handleRestartTournament = async () => {
    const confirmed = await showConfirm(
      "This will reset the tournament to setup state, clear all scores and fourball assignments. Are you sure?",
      "Restart Tournament?"
    );

    if (!confirmed) return;

    setRestarting(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restart tournament');
      }

      showSuccess("Tournament restarted successfully!");
      window.location.reload();
    } catch (error: any) {
      showError(error.message || "Failed to restart tournament");
    } finally {
      setRestarting(false);
    }
  };

  const canStartTournament = tournament.status === 'setup' && participants.length >= 4;
  const isCreator = tournament.created_by === userId;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2 text-sm">
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">⛳ {tournament.name}</h1>
            {tournament.description && (
              <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
            )}
          </div>

          <div className="ml-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tournament.status === 'setup' ? 'bg-gray-100 text-gray-700' :
              tournament.status === 'active' ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {tournament.status === 'setup' ? '🔧 Setup' :
               tournament.status === 'active' ? '⛳ Playing' :
               '✅ Completed'}
            </div>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-3">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{tournament.course_name}</span>
          </div>
          {tournament.location && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{tournament.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Target size={14} />
            <span>Par {tournament.course_par}</span>
          </div>
          <div className="flex items-center gap-1">
            <Hash size={14} />
            <span>{tournament.holes_count} holes</span>
          </div>
        </div>
      </div>

      {/* Invite Code Section (only during setup) */}
      {tournament.status === 'setup' && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Invite Code</div>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-blue-600">
                  {tournament.invite_code}
                </code>
                <button
                  onClick={handleCopyInviteCode}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                </button>
              </div>
            </div>
            <Share2 size={20} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this code with players to join the tournament
          </p>
        </div>
      )}

      {/* Participants Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-900">
              Players ({participants.length}{tournament.max_players ? `/${tournament.max_players}` : ''})
            </span>
          </div>
          <span className="text-gray-400">{showParticipants ? '−' : '+'}</span>
        </button>

        {showParticipants && (
          <div className="mt-4">
            {/* Guest Player Manager */}
            {tournament.status === 'setup' && isCreator && (
              <div className="mb-4">
                <GolfTournamentGuestPlayerManager
                  tournamentId={tournament.id}
                  maxPlayers={tournament.max_players || 100}
                  currentPlayers={participants.length}
                  onUpdate={fetchParticipants}
                />
              </div>
            )}

            {/* Participants List */}
            <div className="space-y-2">
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No players yet</p>
                  <p className="text-gray-400 text-xs mt-1">Add guest players or share the invite code</p>
                </div>
              ) : (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{participant.player_name}</div>
                      {participant.fourball_number && (
                        <div className="text-xs text-gray-500">
                          Fourball #{participant.fourball_number} - Position {participant.fourball_position}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.is_guest && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Guest</span>
                      )}
                      {participant.user_id === userId && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        {tournament.status === 'setup' && isCreator && (
          <>
            {canStartTournament ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900 mb-2">Fourball Assignment</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssignmentMode('auto')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        assignmentMode === 'auto'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      Auto Assign
                    </button>
                    <button
                      onClick={() => setAssignmentMode('manual')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        assignmentMode === 'manual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    {assignmentMode === 'auto'
                      ? 'Players will be randomly grouped into fourballs'
                      : 'You can manually assign players to fourballs'}
                  </p>
                </div>

                <Button
                  onClick={handleStartTournament}
                  disabled={starting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium"
                >
                  <Play size={18} className="mr-2" />
                  {starting ? 'Starting Tournament...' : 'Start Tournament'}
                </Button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-800 font-medium">
                  Need at least 4 players to start
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Currently: {participants.length} player{participants.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </>
        )}

        {tournament.status === 'active' && isParticipant && (
          <Link href={`/golf/${tournament.id}/play`}>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-medium">
              <Target size={18} className="mr-2" />
              Record Scores
            </Button>
          </Link>
        )}

        {(tournament.status === 'active' || tournament.status === 'completed') && (
          <Link href={`/golf/${tournament.id}/leaderboard`}>
            <Button className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-12 rounded-xl font-medium">
              <BarChart3 size={18} className="mr-2" />
              View Leaderboard
            </Button>
          </Link>
        )}

        {/* Restart Button - Only show for creator when tournament is active */}
        {isCreator && tournament.status === 'active' && (
          <Button
            onClick={handleRestartTournament}
            disabled={restarting}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium"
          >
            {restarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Restarting...</span>
              </>
            ) : (
              <>
                <Play size={18} className="mr-2 rotate-180" />
                <span>Restart Tournament</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Card */}
      <div className="px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Trophy size={18} className="text-amber-600" />
            Tournament Format
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• {tournament.format === 'stroke_play' ? 'Stroke Play' : tournament.format === 'best_ball' ? 'Best Ball' : 'Scramble'}</p>
            <p>• Players grouped into fourballs (4-person groups)</p>
            <p>• Track penalties, birdies, eagles in real-time</p>
            <p>• Fun features: fines, wall of shame, hero board</p>
          </div>
        </div>
      </div>
    </div>
  );
}
