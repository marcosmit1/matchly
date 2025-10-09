"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/modal-context";
import { GolfTournamentGuestPlayerManager } from "@/components/golf-tournament-guest-player-manager";
import { ManualFourballAssignment } from "@/components/golf-manual-fourball-assignment";
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
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showCourseOverview, setShowCourseOverview] = useState(false);
  const [selectedHole, setSelectedHole] = useState<any>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const { showConfirm, showSuccess, showError, showModal, hideModal } = useModal();

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

  const fetchParticipants = useCallback(async () => {
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
  }, [tournament.id, userId]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(tournament.status);

  const refreshTournament = async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();
      // Fetch latest tournament status
      const { data: latestTournament, error } = await supabase
        .from("golf_tournaments")
        .select("status")
        .eq("id", tournament.id)
        .single();

      if (error) {
        console.error('Error fetching tournament:', error);
        return;
      }

      if (latestTournament.status !== currentStatus) {
        setCurrentStatus(latestTournament.status);
        // Refetch participants and holes
        await Promise.all([fetchParticipants(), fetchHoles()]);
        if (latestTournament.status === 'active') {
          showSuccess("Tournament has started! You can now record scores.");
        }
      }
    } catch (error) {
      console.error('Error refreshing tournament:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchHoles = useCallback(async () => {
    try {
      const supabase = createClient();
      console.log('🔎 [Lobby] Fetching tournament holes for', tournament.id);
      const { data: holesData, error } = await supabase
        .from("golf_holes")
        .select("*")
        .eq("tournament_id", tournament.id)
        .order("hole_number", { ascending: true });

      if (error) {
        console.error('Error fetching holes:', error);
        return;
      }

      let enriched = holesData || [];
      console.log('📦 [Lobby] Holes from tournament:', enriched);

      // If any par/handicap is missing, enrich from cached course holes
      const needsEnrichment = !enriched || enriched.length === 0 || enriched.some((h: any) => !h.handicap || !h.par);
      if (needsEnrichment) {
        try {
          // Prefer exact course match stored in tournament.course_name; fallback to tournament.name
          console.log('🔎 [Lobby] Enrichment needed. Looking up cached course for', tournament.course_name, 'or', tournament.name);
          // Use cached_course_id directly from tournament
          let course: { id: string } | null = null;
          if (tournament.cached_course_id) {
            course = { id: tournament.cached_course_id };
          }

          if (!course) {
            const res2 = await supabase
              .from("golf_courses")
              .select("id")
              .ilike("name", tournament.name)
              .maybeSingle();
            course = res2.data as typeof course;
          }

          console.log('🧭 [Lobby] Cached course:', course);
          if (course?.id) {
            const { data: courseHoles } = await supabase
              .from("golf_course_holes")
              .select("hole_number, par, handicap")
              .eq("course_id", course.id);
            console.log('🗂️ [Lobby] Cached course holes:', courseHoles);
            if (courseHoles && courseHoles.length > 0) {
              const bestByHole = new Map<number, { par: number | null; handicap: number | null }>();
              for (const ch of courseHoles) {
                const existing = bestByHole.get(ch.hole_number);
                const take = !existing || existing.handicap == null || existing.par == null;
                if (take) bestByHole.set(ch.hole_number, { par: ch.par ?? null, handicap: ch.handicap ?? null });
              }

              // Always overlay par/handicap from bestByHole (authoritative source)
              enriched = (enriched || []).map((h: any) => {
                const best = bestByHole.get(h.hole_number);
                if (!best) return h;
                return {
                  ...h,
                  par: best.par ?? h.par,
                  handicap: best.handicap ?? h.handicap,
                };
              });
              console.log('✅ [Lobby] Enriched holes:', enriched);
            }
          }
        } catch (e) {
          console.warn('Hole enrichment skipped:', e);
        }
      }

      setHoles(enriched);
    } catch (error) {
      console.error('Error fetching holes:', error);
    }
  }, [tournament.id, tournament.cached_course_id, tournament.course_name, tournament.name]);

  useEffect(() => {
    if (!currentUser) return;
    fetchParticipants();
    fetchHoles();
  }, [currentUser, fetchParticipants, fetchHoles]);

  const handleCopyInviteCode = async () => {
    if (tournament.invite_code) {
      await navigator.clipboard.writeText(tournament.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess("Invite code copied to clipboard!");
    }
  };

  const handleStartTournament = async () => {
    if (assignmentMode === 'manual') {
      // Show manual assignment modal instead of confirmation
      setShowManualAssignment(true);
      return;
    }

    const confirmed = await showConfirm(
      `This will assign players to fourballs automatically and begin the tournament. Players will be able to start recording their scores.`,
      "Start Golf Tournament?"
    );

    if (!confirmed) return;

    await startTournamentWithAssignments([]);
  };

  const handleManualAssignmentComplete = async (assignments: Array<{ participant_id: string; fourball_number: number; position_in_fourball: number }>) => {
    console.log('🎯 Manual assignment completed, assignments:', assignments);
    try {
      await startTournamentWithAssignments(assignments);
      setShowManualAssignment(false); // Close modal only on success
    } catch (error) {
      // Modal stays open on error so user can retry
      console.error('Error starting tournament after manual assignment:', error);
    }
  };

  const startTournamentWithAssignments = async (assignments: Array<{ participant_id: string; fourball_number: number; position_in_fourball: number }>) => {
    setStarting(true);
    try {
      const requestBody: any = { assignment_mode: assignmentMode };
      if (assignments.length > 0) {
        requestBody.manual_assignments = assignments;
      }

      console.log('🚀 Starting tournament with request:', requestBody);
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error:', error);
        throw new Error(error.error || 'Failed to start tournament');
      }

      const result = await response.json();
      console.log('✅ Tournament started successfully:', result);
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

  const handleHoleLongPress = (hole: any) => {
    const timer = setTimeout(() => {
      setSelectedHole(hole);
      showModal({
        title: `Hole ${hole.hole_number}`,
        content: (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1">Par</div>
                <div className="text-2xl font-bold text-blue-900">{hole.par}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">Handicap</div>
                <div className="text-2xl font-bold text-green-900">{hole.handicap || 'N/A'}</div>
              </div>
            </div>
            {hole.yardage && hole.yardage > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg mb-3">
                <div className="text-xs text-purple-600 font-medium mb-1">Distance</div>
                <div className="text-lg font-bold text-purple-900">{hole.yardage} yards</div>
              </div>
            )}
            <div className="text-xs text-gray-500 text-center">
              Press outside to close
            </div>
          </div>
        ),
        type: 'info',
        confirmText: 'Close'
      });
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleHolePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const canStartTournament = tournament.status === 'setup' && participants.length >= 4;
  const isCreator = tournament.created_by === userId;

  return (
    <div className="min-h-screen w-screen bg-gray-50 fixed inset-0 overflow-y-auto pb-24">
      {/* Header - Green Gradient like Scorecard */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-4 py-4 sticky top-0 z-10">
        <Link href="/" className="inline-flex items-center text-white/90 hover:text-white mb-3">
          <ArrowLeft size={18} className="mr-2" />
          Back to Home
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">⛳ {tournament.name}</h1>
            {tournament.description && (
              <p className="text-sm text-white/90 mt-1">{tournament.description}</p>
            )}
          </div>

          <div className="ml-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentStatus === 'setup' ? 'bg-white/20 text-white' :
              currentStatus === 'active' ? 'bg-white/30 text-white' :
              'bg-white/20 text-white'
            }`}>
              {currentStatus === 'setup' ? '🔧 Setup' :
               currentStatus === 'active' ? '⛳ Playing' :
               '✅ Completed'}
            </div>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="flex flex-wrap gap-3 text-xs text-white/90 mt-3">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{tournament.location || tournament.course_name}</span>
          </div>
          {tournament.start_date && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
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
      {currentStatus === 'setup' && (
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
              Players ({participants.length}/{tournament.max_players || 'Unlimited'})
            </span>
          </div>
          <span className="text-gray-400">{showParticipants ? '−' : '+'}</span>
        </button>

        {showParticipants && (
          <div className="mt-4">
            {/* Guest Player Manager */}
            {currentStatus === 'setup' && isCreator && (
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
        {currentStatus === 'setup' && isCreator && (
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

        {currentStatus === 'setup' && isParticipant && !isCreator && (
          <Button
            onClick={refreshTournament}
            disabled={refreshing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium"
          >
            <div className="flex items-center justify-center">
              {refreshing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Check Tournament Status
                </>
              )}
            </div>
          </Button>
        )}

        {currentStatus === 'active' && isParticipant && (
          <div className="space-y-3">
            <Link href={`/golf/${tournament.id}/play`}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-medium">
                <Target size={18} className="mr-2" />
                Record Scores
              </Button>
            </Link>

            <Link href={`/golf/${tournament.id}/leaderboard`}>
              <Button className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-12 rounded-xl font-medium">
                <BarChart3 size={18} className="mr-2" />
                View Leaderboard
              </Button>
            </Link>
          </div>
        )}

        {currentStatus === 'completed' && (
          <Link href={`/golf/${tournament.id}/leaderboard`}>
            <Button className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-12 rounded-xl font-medium">
              <BarChart3 size={18} className="mr-2" />
              View Leaderboard
            </Button>
          </Link>
        )}

        {/* Restart Button - Only show for creator when tournament is active */}
        {isCreator && currentStatus === 'active' && (
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
      <div className="px-4 pb-4">
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

      {/* Course Overview */}
      {holes.length > 0 && (
        <div className="px-4 pb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <button
              onClick={() => setShowCourseOverview(!showCourseOverview)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <Target size={18} className="text-green-600" />
                Course Overview
              </div>
              <span className="text-gray-400">{showCourseOverview ? '−' : '+'}</span>
            </button>

            {showCourseOverview && (
              <>
                <p className="text-xs text-gray-500 mb-3">Long press any hole to view details</p>

                {/* Front 9 */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Front 9</div>
                  <div className="grid grid-cols-9 gap-1">
                    {holes.slice(0, 9).map((hole) => (
                      <button
                        key={hole.hole_number}
                        onMouseDown={() => handleHoleLongPress(hole)}
                        onMouseUp={handleHolePressEnd}
                        onMouseLeave={handleHolePressEnd}
                        onTouchStart={() => handleHoleLongPress(hole)}
                        onTouchEnd={handleHolePressEnd}
                        className="aspect-square flex flex-col items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        <div className="text-xs font-semibold text-green-900">{hole.hole_number}</div>
                        <div className="text-[10px] text-green-700">Par {hole.par}</div>
                        <div className="text-[10px] text-green-700/80">HCP {hole.handicap ?? '—'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Back 9 */}
                {holes.length > 9 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Back 9</div>
                    <div className="grid grid-cols-9 gap-1">
                      {holes.slice(9, 18).map((hole) => (
                        <button
                          key={hole.hole_number}
                          onMouseDown={() => handleHoleLongPress(hole)}
                          onMouseUp={handleHolePressEnd}
                          onMouseLeave={handleHolePressEnd}
                          onTouchStart={() => handleHoleLongPress(hole)}
                          onTouchEnd={handleHolePressEnd}
                          className="aspect-square flex flex-col items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <div className="text-xs font-semibold text-blue-900">{hole.hole_number}</div>
                          <div className="text-[10px] text-blue-700">Par {hole.par}</div>
                          <div className="text-[10px] text-blue-700/80">HCP {hole.handicap ?? '—'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual Fourball Assignment Modal */}
      {showManualAssignment && (
        <ManualFourballAssignment
          tournamentId={tournament.id}
          players={participants}
          onAssignmentComplete={handleManualAssignmentComplete}
          onCancel={() => setShowManualAssignment(false)}
        />
      )}
    </div>
  );
}
