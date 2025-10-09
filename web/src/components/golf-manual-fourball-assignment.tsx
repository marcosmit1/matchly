"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/blocks/button";
import { useModal } from "@/contexts/modal-context";
import { X, Users, Check, ArrowLeft } from "lucide-react";

interface Player {
  id: string;
  player_name: string;
  fourball_number?: number;
}

interface ManualFourballAssignmentProps {
  tournamentId: string;
  players: Player[];
  onAssignmentComplete: (assignments: Array<{ participant_id: string; fourball_number: number; position_in_fourball: number }>) => void;
  onCancel: () => void;
}

export function ManualFourballAssignment({
  tournamentId,
  players,
  onAssignmentComplete,
  onCancel
}: ManualFourballAssignmentProps) {
  const [assignments, setAssignments] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach(player => {
      if (player.fourball_number) {
        initial[player.id] = player.fourball_number;
      }
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownDir, setDropdownDir] = useState<'up' | 'down'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const controlRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const { showSuccess, showError } = useModal();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  // Lock body scroll while the full-screen assignment UI is open (prevents background scroll)
  useEffect(() => {
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previousOverflow;
    };
  }, []);

  // Calculate the number of fourballs needed (4 players per fourball, rounded up)
  const maxFourballNumber = Math.ceil(players.length / 4);

  const handleAssignmentChange = (playerId: string, fourballNumber: number) => {
    setAssignments(prev => ({
      ...prev,
      [playerId]: fourballNumber
    }));
  };

  const handleSaveAssignments = async () => {
    // Validate that all players are assigned to a fourball
    const unassignedPlayers = players.filter(player => !assignments[player.id]);

    if (unassignedPlayers.length > 0) {
      showError(`Please assign all players to fourballs. Missing: ${unassignedPlayers.map(p => p.player_name).join(', ')}`);
      return;
    }

    // Convert assignments to the format expected by the API
    const apiAssignments: Array<{ participant_id: string; fourball_number: number; position_in_fourball: number }> = [];

    // Group assignments by fourball number
    const fourballGroups: Record<number, string[]> = {};
    Object.entries(assignments).forEach(([playerId, fourballNumber]) => {
      if (!fourballGroups[fourballNumber]) {
        fourballGroups[fourballNumber] = [];
      }
      fourballGroups[fourballNumber].push(playerId);
    });

    // Create API assignments with correct positions
    Object.entries(fourballGroups).forEach(([fourballNumber, playerIds]) => {
      playerIds.forEach((playerId, index) => {
        apiAssignments.push({
          participant_id: playerId,
          fourball_number: parseInt(fourballNumber),
          position_in_fourball: index + 1
        });
      });
    });

    setSaving(true);
    try {
      console.log('🎯 Saving assignments:', apiAssignments);
      await onAssignmentComplete(apiAssignments);
      // Success feedback is handled in the parent component
      console.log('✅ Assignments saved successfully');
    } catch (error: any) {
      console.error('❌ Error saving assignments:', error);
      showError(error.message || "Failed to save fourball assignments");
      // Don't close modal on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  const getPlayersInFourball = (fourballNumber: number) => {
    return players.filter(player => assignments[player.id] === fourballNumber);
  };

  const getUnassignedPlayers = () => {
    return players.filter(player => !assignments[player.id]);
  };

  // When everyone assigned, prompt to confirm or edit
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const prevUnassignedRef = useRef<number>(players.length);
  useEffect(() => {
    const currentUnassigned = getUnassignedPlayers().length;
    const prev = prevUnassignedRef.current;
    if (prev > 0 && currentUnassigned === 0) {
      setShowConfirmPrompt(true);
    }
    prevUnassignedRef.current = currentUnassigned;
  }, [assignments, players.length]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-dvh sm:h-screen">
      <div
        ref={dropdownRef}
        className="flex-1 min-h-0 flex flex-col bg-white"
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={24} />
              <h2 className="text-xl font-bold">Assign Players to Fourballs</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Assign each player to a fourball group. Each fourball can have up to 4 players.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain pb-28 sm:pb-32">
          {/* Unassigned Players */}
          {getUnassignedPlayers().length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Unassigned Players</h3>
              <div className="space-y-2">
                {getUnassignedPlayers().map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{player.player_name}</span>
                    <span className="text-xs sm:text-sm text-yellow-700">Not assigned</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fourball Groups */}
          <div className="space-y-4">
            {Array.from({ length: maxFourballNumber }, (_, index) => {
              const fourballNumber = index + 1;
              const playersInFourball = getPlayersInFourball(fourballNumber);
              const isFull = playersInFourball.length >= 4;

              return (
                <div key={fourballNumber} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">
                      Fourball {fourballNumber}
                      {isFull && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Full</span>}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {playersInFourball.length}/4 players
                    </span>
                  </div>

                  {/* Players in this fourball */}
                  {playersInFourball.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {playersInFourball.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{player.player_name}</span>
                          <span className="text-xs sm:text-sm text-blue-700">✓ Assigned</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available players to assign */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Assign players to this fourball:
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={isFull}
                        ref={(el) => { controlRefs.current[fourballNumber] = el; }}
                        onClick={() => {
                          if (isFull) return;
                          const nextOpen = openDropdown === fourballNumber ? null : fourballNumber;
                          setOpenDropdown(nextOpen);
                          if (nextOpen !== null) {
                            const btn = controlRefs.current[fourballNumber];
                            if (btn) {
                              const rect = btn.getBoundingClientRect();
                              const viewportH = window.innerHeight;
                              const menuNeeded = 192; // approximate max height needed (48 * 4)
                              const bottomBar = 96; // allow for bottom action bar height
                              const spaceBelow = viewportH - rect.bottom - bottomBar;
                              const spaceAbove = rect.top - 120; // header space allowance
                              const goUp = spaceBelow < menuNeeded && spaceAbove > spaceBelow;
                              setDropdownDir(goUp ? 'up' : 'down');
                            }
                          }
                        }}
                        className={`w-full flex justify-between items-center px-3 py-3 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 ${openDropdown === fourballNumber ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <span className="truncate">
                          {isFull ? "Fourball is full" : "Select a player to assign..."}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === fourballNumber ? 'rotate-180' : ''}`}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      </button>

                      {openDropdown === fourballNumber && !isFull && (
                        <div className={`absolute z-[80] w-full ${dropdownDir === 'down' ? 'mt-1 top-full' : 'mb-1 bottom-full'} bg-white shadow-lg rounded-lg border border-gray-200 max-h-48 overflow-y-auto`}>
                          <div className="p-1">
                            {players
                              .filter(player => !assignments[player.id] || assignments[player.id] === fourballNumber)
                              .filter(player => !playersInFourball.some(p => p.id === player.id))
                              .map(player => (
                                <button
                                  key={player.id}
                                  type="button"
                                  className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:bg-gray-100 focus:outline-none"
                                  onClick={() => {
                                    handleAssignmentChange(player.id, fourballNumber);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  {player.player_name}
                                </button>
                              ))
                            }
                            {players.filter(player => !assignments[player.id] || assignments[player.id] === fourballNumber)
                              .filter(player => !playersInFourball.some(p => p.id === player.id)).length === 0 && (
                              <div className="px-3 py-3 text-sm text-gray-500 italic">
                                No players available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2 sm:gap-0">
              <span className="text-gray-600">
                Total players: {players.length}
              </span>
              <span className="text-gray-600">
                Fourballs needed: {maxFourballNumber}
              </span>
              <span className={`font-medium ${getUnassignedPlayers().length === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                {getUnassignedPlayers().length === 0 ? '✓ All assigned' : `${getUnassignedPlayers().length} remaining`}
              </span>
            </div>
            {getUnassignedPlayers().length === 0 && (
              <div className="mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800 font-medium">
                  🎉 All players assigned! Click &quot;Save Assignments&quot; to start the tournament.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed bottom action bar - always visible above app nav */}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[70] p-4 sm:p-6 border-t border-gray-200 bg-white flex gap-3">
        <Button
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium h-11 sm:h-12 text-sm sm:text-base"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveAssignments}
          disabled={saving || getUnassignedPlayers().length > 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium h-11 sm:h-12 text-sm sm:text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Check size={16} className="mr-1 sm:mr-2" />
              Save Assignments
            </>
          )}
        </Button>
      </div>

      {showConfirmPrompt && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">All players assigned</h3>
              <p className="mt-1 text-sm text-gray-600">Do you want to start the tournament with these fourballs?</p>
            </div>
            <div className="p-4 sm:p-5 flex gap-3">
              <Button
                onClick={() => setShowConfirmPrompt(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium h-11 sm:h-12 text-sm sm:text-base"
              >
                Edit
              </Button>
              <Button
                onClick={handleSaveAssignments}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium h-11 sm:h-12 text-sm sm:text-base"
              >
                Confirm & Start
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
