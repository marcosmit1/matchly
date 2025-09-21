"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, Calendar, MapPin, Target, Plus, Trash2 } from "lucide-react";
import { showToast } from "@/components/toast";
import { BetterDatePicker } from "@/components/better-date-picker";

interface TournamentPlayer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export function CreateTournamentForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "padel",
    maxPlayers: 8 as number | string,
    startDate: null as Date | null,
    location: "",
    numberOfCourts: 2 as number | string,
    tournamentType: "mexicano" as "mexicano" | "americano",
    pointsToWin: 21 as number | string,
  });

  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    email: "",
    phone: "",
  });


  const handleInputChange = (field: string, value: string | number | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPlayer = () => {
    if (!newPlayer.name.trim()) {
      showToast({ type: "error", title: "Please enter a player name" });
      return;
    }

    const maxPlayers = typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : Number(formData.maxPlayers);
    if (players.length >= maxPlayers) {
      showToast({ type: "error", title: `Maximum ${maxPlayers} players allowed` });
      return;
    }

    const player: TournamentPlayer = {
      id: `player-${Date.now()}`,
      name: newPlayer.name.trim(),
      email: newPlayer.email.trim() || undefined,
      phone: newPlayer.phone.trim() || undefined,
    };

    setPlayers(prev => [...prev, player]);
    setNewPlayer({ name: "", email: "", phone: "" });
  };

  const removePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow creating tournaments with just the creator initially
    // Minimum players will be enforced when starting the tournament

    if (!formData.name.trim()) {
      showToast({ type: "error", title: "Please enter a tournament name" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          max_players: typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : formData.maxPlayers,
          number_of_courts: typeof formData.numberOfCourts === 'string' && formData.numberOfCourts === '' ? 2 : formData.numberOfCourts,
          points_to_win: typeof formData.pointsToWin === 'string' && formData.pointsToWin === '' ? 21 : formData.pointsToWin,
          start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
          players: players,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({ type: "success", title: "Tournament created successfully!" });
        // Redirect to tournament details
        window.location.href = `/tournaments/${data.tournament.id}`;
      } else {
        showToast({ type: "error", title: data.error || "Failed to create tournament" });
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      showToast({ type: "error", title: "Failed to create tournament" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tournament Info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span>Tournament Details</span>
          </h2>
          
          <div className="space-y-4">
            {/* Tournament Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tournament Name *
              </label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter tournament name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 w-4 h-4 text-gray-400">📝</span>
                <textarea
                  placeholder="Enter tournament description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="pl-10 w-full h-24 pt-3 pr-3 pb-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Sport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.sport}
                  onChange={(e) => handleInputChange("sport", e.target.value)}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="padel">Padel</option>
                  <option value="squash">Squash</option>
                  <option value="tennis">Tennis</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Players *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="Enter max players"
                  value={formData.maxPlayers || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleInputChange("maxPlayers", "");
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange("maxPlayers", numValue);
                      }
                    }
                  }}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="4"
                  max="32"
                  required
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <BetterDatePicker
                value={formData.startDate}
                onChange={(date) => handleInputChange("startDate", date)}
                placeholder="Select start date"
                className="w-full"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Tournament Settings</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Courts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Courts *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">🏟️</span>
                <input
                  type="number"
                  placeholder="2"
                  value={formData.numberOfCourts || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleInputChange("numberOfCourts", "");
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange("numberOfCourts", numValue);
                      }
                    }
                  }}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="1"
                  max="8"
                  required
                />
              </div>
            </div>

            {/* Tournament Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tournament Type *
              </label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.tournamentType}
                  onChange={(e) => handleInputChange("tournamentType", e.target.value)}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  required
                >
                  <option value="mexicano">Mexicano</option>
                  <option value="americano">Americano</option>
                </select>
              </div>
            </div>

            {/* Points to Win */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points to Win *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400">🎯</span>
                <input
                  type="number"
                  placeholder="21"
                  value={formData.pointsToWin || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleInputChange("pointsToWin", "");
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange("pointsToWin", numValue);
                      }
                    }
                  }}
                  className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="11"
                  max="50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tournament Type Description */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {formData.tournamentType === "mexicano" ? "Mexicano Format" : "Americano Format"}
            </h4>
            <p className="text-sm text-blue-800">
              {formData.tournamentType === "mexicano" 
                ? "Like normal Americano but will result in more even games. After every round, a new game is generated depending on the current scoreboard."
                : "All players play with everyone, 1 time. Simple round-robin format."
              }
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Players (Optional) ({players.length}/{typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : formData.maxPlayers})</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You can add players now or share the tournament link later for others to join.
          </p>
          
          {/* Add Player Form */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Player name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="pl-3 w-full h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  className="w-full pl-3 h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                  className="w-full pl-3 h-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addPlayer}
                  disabled={!newPlayer.name.trim() || players.length >= (typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : Number(formData.maxPlayers))}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Player</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Players List */}
          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{player.name}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        {player.email && <p>{player.email}</p>}
                        {player.phone && <p>{player.phone}</p>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Remove player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No players added yet</h3>
              <p className="text-gray-500">Add at least 4 players to create the tournament</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || players.length < 4}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-2xl flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                <span>Create Tournament</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
