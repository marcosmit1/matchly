"use client";

import { useState, useEffect } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Plus, Trash2, User, Mail, Phone, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

interface GuestPlayer {
  participant_id: string;
  user_id: string | null;
  guest_player_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  is_guest: boolean;
  joined_at: string;
}

interface GuestPlayerManagerProps {
  leagueId: string;
  maxPlayers: number;
  currentPlayers: number;
}

export function GuestPlayerManager({ leagueId, maxPlayers, currentPlayers }: GuestPlayerManagerProps) {
  const [participants, setParticipants] = useState<GuestPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingGuest, setAddingGuest] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/guest-players`);
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.participants);
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
  }, [leagueId]);

  // Add guest player
  const addGuestPlayer = async () => {
    if (!newGuest.name.trim()) {
      alert("Please enter a name for the guest player");
      return;
    }

    setAddingGuest(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/guest-players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGuest.name.trim(),
          email: newGuest.email.trim() || null,
          phone: newGuest.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewGuest({ name: "", email: "", phone: "" });
        setShowAddForm(false);
        await fetchParticipants(); // Refresh the list
      } else {
        alert(data.error || "Failed to add guest player");
      }
    } catch (error) {
      console.error("Error adding guest player:", error);
      alert("Failed to add guest player");
    } finally {
      setAddingGuest(false);
    }
  };

  // Remove guest player
  const removeGuestPlayer = async (guestPlayerId: string) => {
    if (!confirm("Are you sure you want to remove this guest player?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/leagues/${leagueId}/guest-players?guestPlayerId=${guestPlayerId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchParticipants(); // Refresh the list
      } else {
        alert(data.error || "Failed to remove guest player");
      }
    } catch (error) {
      console.error("Error removing guest player:", error);
      alert("Failed to remove guest player");
    }
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
  const availableSlots = maxPlayers - currentPlayers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
          <p className="text-sm text-gray-600">
            {currentPlayers} / {maxPlayers} players
            {availableSlots > 0 && ` (${availableSlots} slots available)`}
          </p>
        </div>
        {availableSlots > 0 && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </Button>
        )}
      </div>

      {/* Add Guest Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-blue-900">Add Guest Player</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Guest player name"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="pl-10 w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="pl-10 w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  className="pl-10 w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={addGuestPlayer}
              disabled={addingGuest || !newGuest.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              {addingGuest ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                "Add Guest Player"
              )}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewGuest({ name: "", email: "", phone: "" });
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Registered Players */}
      {registeredPlayers.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Registered Players ({registeredPlayers.length})</span>
          </h4>
          <div className="space-y-2">
            {registeredPlayers.map((player) => (
              <div
                key={player.participant_id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Registered
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Players */}
      {guestPlayers.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Guest Players ({guestPlayers.length})</span>
          </h4>
          <div className="space-y-2">
            {guestPlayers.map((player) => (
              <div
                key={player.participant_id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      {player.email && <p>{player.email}</p>}
                      {player.phone && <p>{player.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Guest
                  </span>
                  <button
                    onClick={() => removeGuestPlayer(player.guest_player_id!)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Remove guest player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {participants.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
          <p className="text-gray-500 mb-4">
            Add guest players or share the invite link for registered users to join.
          </p>
          {availableSlots > 0 && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add First Guest Player
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
