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
    email: "",
    phone: "",
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
          email: newGuest.email.trim() || null,
          phone: newGuest.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewGuest({ name: "", email: "", phone: "" });
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
          <h3 className="text-lg font-semibold text-white">Guest Players</h3>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </Button>
        </div>
      )}

      {/* Add Guest Player Form */}
      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Add Guest Player</h4>
            <Button
              onClick={() => setShowAddForm(false)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  type="text"
                  placeholder="Enter guest player name"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="pl-12 w-full h-12 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/80 shadow-inner"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="pl-12 w-full h-12 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/80 shadow-inner"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  className="pl-12 w-full h-12 border border-white/30 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 bg-black/20 backdrop-blur-md transition-all duration-300 text-white placeholder:text-white/80 shadow-inner"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-3 border border-white/30 text-white/80 rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-md font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={addGuestPlayer}
                disabled={addingGuest || !newGuest.name.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {addingGuest ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  "Add Guest Player"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Players List */}
      {guestPlayers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-white/90">Guest Players ({guestPlayers.length})</h4>
          {guestPlayers.map((guest) => (
            <div
              key={guest.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">{guest.name}</h5>
                    {guest.email && (
                      <p className="text-sm text-white/70 flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{guest.email}</span>
                      </p>
                    )}
                    {guest.phone && (
                      <p className="text-sm text-white/70 flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{guest.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => removeGuestPlayer(guest.guest_player_id!)}
                className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
