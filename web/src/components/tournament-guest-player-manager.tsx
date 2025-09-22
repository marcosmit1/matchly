"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useModal } from "@/contexts/modal-context";
import { Plus, X, User, Mail, Phone, Trash2 } from "lucide-react";

interface TournamentGuestPlayerManagerProps {
  tournamentId: string;
  maxPlayers: number;
  currentPlayers: number;
}

interface Participant {
  id: string;
  tournament_id: string;
  user_id?: string;
  guest_player_id?: string;
  status: string;
  created_at: string;
  is_guest: boolean;
  name: string;
  email?: string;
  phone?: string;
}

export function TournamentGuestPlayerManager({ 
  tournamentId, 
  maxPlayers, 
  currentPlayers 
}: TournamentGuestPlayerManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
  });
  const { showModal } = useModal();

  // Fetch tournament participants
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/guest-players`);
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants || []);
      } else {
        console.error("Failed to fetch participants:", data.error);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  // Add guest player
  const addGuestPlayer = async () => {
    if (!newGuest.name.trim()) {
      showModal({
        type: "error",
        message: "Please enter a name for the guest player",
      });
      return;
    }

    setAddingGuest(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/guest-players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGuest.name.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewGuest({ name: "" });
        setShowAddForm(false);
        await fetchParticipants(); // Refresh the list
        showModal({
          type: "success",
          message: "Guest player added successfully!",
        });
      } else {
        showModal({
          type: "error",
          message: data.error || "Failed to add guest player",
        });
      }
    } catch (error) {
      console.error("Error adding guest player:", error);
      showModal({
        type: "error",
        message: "Failed to add guest player",
      });
    } finally {
      setAddingGuest(false);
    }
  };

  // Remove guest player
  const removeGuestPlayer = async (guestPlayerId: string) => {
    showModal({
      type: "confirm",
      message: "Are you sure you want to remove this guest player?",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `/api/tournaments/${tournamentId}/guest-players?guestPlayerId=${guestPlayerId}`,
            {
              method: "DELETE",
            }
          );

          const data = await response.json();

          if (data.success) {
            await fetchParticipants(); // Refresh the list
            showModal({
              type: "success",
              message: "Guest player removed successfully!",
            });
          } else {
            showModal({
              type: "error",
              message: data.error || "Failed to remove guest player",
            });
          }
        } catch (error) {
          console.error("Error removing guest player:", error);
          showModal({
            type: "error",
            message: "Failed to remove guest player",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" color="blue" />
      </div>
    );
  }

  const guestPlayers = participants.filter(p => p.is_guest);
  const registeredPlayers = participants.filter(p => !p.is_guest);
  const canAddMore = currentPlayers < maxPlayers;

  return (
    <div className="space-y-4">
      {/* Add Guest Player Button */}
      {canAddMore && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Guest Players</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      )}

      {/* Add Guest Player Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">👤</div>
              <h4 className="font-semibold text-gray-900">Add Guest Player</h4>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Player Name
              </label>
              <input
                type="text"
                placeholder="Enter guest player name"
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> This is for guest players only. If someone has an account, they should join using the tournament invite code from their own device.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addGuestPlayer}
                disabled={addingGuest || !newGuest.name.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {addingGuest ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  "Add Guest Player"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Players List */}
      {guestPlayers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900">Guest Players ({guestPlayers.length})</h4>
          {guestPlayers.map((guest) => (
            <div
              key={guest.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👤</div>
                <div>
                  <h5 className="font-semibold text-gray-900">{guest.name}</h5>
                  <p className="text-sm text-gray-600">Guest Player</p>
                </div>
              </div>
              <button
                onClick={() => removeGuestPlayer(guest.guest_player_id!)}
                className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Player Count Info */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
        <p className="text-sm text-white/80 text-center">
          {currentPlayers} of {maxPlayers} players ({guestPlayers.length} guests)
        </p>
      </div>
    </div>
  );
}
