"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { useModal } from "@/contexts/modal-context";
import { Plus, X, Trash2 } from "lucide-react";

interface GolfTournamentGuestPlayerManagerProps {
  tournamentId: string;
  maxPlayers: number;
  currentPlayers: number;
  onUpdate: () => void;
}

export function GolfTournamentGuestPlayerManager({
  tournamentId,
  maxPlayers,
  currentPlayers,
  onUpdate
}: GolfTournamentGuestPlayerManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const { showSuccess, showError } = useModal();

  const addGuestPlayer = async () => {
    if (!guestName.trim()) {
      showError("Please enter a name for the guest player");
      return;
    }

    if (currentPlayers >= maxPlayers) {
      showError(`Maximum of ${maxPlayers} players allowed`);
      return;
    }

    setAddingGuest(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournamentId}/guest-players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add guest player");
      }

      setGuestName("");
      setShowAddForm(false);
      showSuccess("Guest player added successfully!");
      onUpdate(); // Refresh the participants list
    } catch (error: any) {
      showError(error.message || "Failed to add guest player");
    } finally {
      setAddingGuest(false);
    }
  };

  return (
    <div className="space-y-3">
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
        >
          <Plus size={18} />
          Add Guest Player
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-blue-900 text-sm">Add Guest Player</div>
            <button
              onClick={() => {
                setShowAddForm(false);
                setGuestName("");
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <X size={18} />
            </button>
          </div>

          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest player name"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addGuestPlayer();
              }
            }}
          />

          <div className="flex gap-2">
            <Button
              onClick={addGuestPlayer}
              disabled={addingGuest || !guestName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium h-10"
            >
              {addingGuest ? "Adding..." : "Add Player"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setGuestName("");
              }}
              className="px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium h-10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
