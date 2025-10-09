"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, Calendar, MapPin, Target, Plus, Trash2 } from "lucide-react";
import { showToast } from "@/components/toast";
import { BetterDatePicker } from "@/components/better-date-picker";
import { GolfCourseSearchInput } from "@/components/golf/golf-course-search-input";
import type { SelectedGolfCourse, TeeBoxOption, GolfHoleFormData } from "@/types/golf-course-api";

interface TournamentPlayer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface CreateTournamentFormProps {
  sport: 'padel' | 'squash' | 'pickleball' | 'golf';
}

export function CreateTournamentForm({ sport }: CreateTournamentFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedGolfCourse, setSelectedGolfCourse] = useState<SelectedGolfCourse | null>(null);
  const [selectedTeeBox, setSelectedTeeBox] = useState<TeeBoxOption | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: sport,
    maxPlayers: 8 as number | string,
    startDate: null as Date | null,
    location: "",
    numberOfCourts: 2 as number | string,
    tournamentType: "mexicano" as "mexicano" | "americano",
    pointsToWin: 21 as number | string,
    holes: Array(18).fill(null).map((_, i) => ({
      hole_number: i + 1,
      par: 4 as 3 | 4 | 5,
      handicap: i + 1,
      yardage: 0
    }))
  });

  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    email: "",
    phone: "",
  });


  const handleInputChange = (field: string, value: string | number | Date | null | Array<any>) => {
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

  // Handle golf course selection
  const handleGolfCourseSelect = (course: SelectedGolfCourse) => {
    setSelectedGolfCourse(course);
    setSelectedTeeBox(null); // Reset tee box when course changes

    // Auto-fill tournament name and location if empty
    if (!formData.name) {
      handleInputChange("name", course.course_name);
    }
    if (!formData.location) {
      handleInputChange("location", course.location); // Use the formatted location (City, State, Country)
    }
  };

  // Handle tee box selection
  const handleTeeBoxSelect = (teeBoxName: string) => {
    const teeBox = selectedGolfCourse?.tee_boxes.find(tb => tb.name === teeBoxName);
    if (!teeBox) return;

    setSelectedTeeBox(teeBox);

    // Auto-populate holes from selected tee box
    const newHoles = teeBox.holes.map((hole, index) => ({
      hole_number: index + 1,
      par: hole.par,
      handicap: hole.handicap ?? (index + 1), // Use API handicap or default to sequential
      yardage: hole.yardage
    }));

    console.log("🏌️ Auto-populating holes:", newHoles);
    handleInputChange("holes", newHoles);
  };

  // Handle individual hole handicap change (for easy editing)
  const handleHoleHandicapChange = (holeIndex: number, newHandicap: number) => {
    const newHoles = [...formData.holes];
    newHoles[holeIndex] = {
      ...newHoles[holeIndex],
      handicap: newHandicap
    };
    handleInputChange("holes", newHoles);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow creating tournaments with just the creator initially
    // Minimum players will be enforced when starting the tournament

    if (!formData.name.trim()) {
      showToast({ type: "error", title: "Please enter a tournament name" });
      return;
    }

    // Golf-specific validation
    if (sport === 'golf') {
      if (!selectedGolfCourse) {
        showToast({ type: "error", title: "Please search and select a golf course" });
        return;
      }
      if (!selectedTeeBox) {
        showToast({ type: "error", title: "Please select a tee box" });
        return;
      }
      // Check if any handicaps are missing
      const missingHandicaps = formData.holes.filter(h => !h.handicap);
      if (missingHandicaps.length > 0) {
        showToast({
          type: "error",
          title: `Please fill in handicaps for ${missingHandicaps.length} hole(s) (highlighted in orange)`
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Use different API endpoint for golf tournaments
      const apiEndpoint = sport === 'golf' ? '/api/golf-tournaments' : '/api/tournaments';

      const requestBody = sport === 'golf'
        ? {
            // Golf tournament format
            name: formData.name,
            description: formData.description,
            // Use the actual course name selected (critical for downstream lookups)
            course_name: selectedGolfCourse?.course_name || formData.name || 'Golf Course',
            start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
            location: formData.location,
            max_players: typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 100 : formData.maxPlayers,
            holes: formData.holes,
            // Include course cache info for updating missing handicaps
            course_id: selectedGolfCourse?.api_course_id,
            tee_box_name: selectedTeeBox?.name,
          }
        : {
            // Regular tournament format (padel, squash, etc.)
            ...formData,
            max_players: typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : formData.maxPlayers,
            number_of_courts: typeof formData.numberOfCourts === 'string' && formData.numberOfCourts === '' ? 2 : formData.numberOfCourts,
            points_to_win: typeof formData.pointsToWin === 'string' && formData.pointsToWin === '' ? 21 : formData.pointsToWin,
            start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
            players: players,
          };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({ type: "success", title: "Tournament created successfully!" });
        // Redirect to tournament details (use different route for golf)
        if (sport === 'golf') {
          window.location.href = `/golf/${data.tournament.id}`;
        } else {
          window.location.href = `/tournaments/${data.tournament.id}`;
        }
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
                  value={formData.name || ""}
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
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="pl-10 w-full h-24 pt-3 pr-3 pb-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Sport - Display only, not editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <div className="pl-10 w-full h-12 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 flex items-center font-medium">
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected sport cannot be changed
              </p>
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

            {/* Location - Only show for non-golf sports */}
            {sport !== 'golf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={formData.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Settings - Conditional based on sport */}
        {sport !== 'golf' ? (
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
        ) : (
          /* Golf-Specific Settings */
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Golf Tournament Settings ⛳</span>
            </h2>

            <div className="space-y-4">
              {/* Golf Course Search */}
              <GolfCourseSearchInput
                onCourseSelect={handleGolfCourseSelect}
                selectedCourse={selectedGolfCourse}
              />

              {/* Tee Box Selection */}
              {selectedGolfCourse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Tee Box *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">⛳</span>
                    <select
                      value={selectedTeeBox?.name || ""}
                      onChange={(e) => handleTeeBoxSelect(e.target.value)}
                      className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                      required
                    >
                      <option value="">Choose a tee box...</option>
                      {selectedGolfCourse.tee_boxes.map((teeBox) => (
                        <option key={teeBox.name} value={teeBox.name}>
                          {teeBox.display}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecting a tee box will auto-populate all hole information
                  </p>
                </div>
              )}

              {/* Location - Show after course selection, allow editing if needed */}
              {selectedGolfCourse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={formData.location || ""}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-filled from course data, edit if needed
                  </p>
                </div>
              )}

              {/* Hole Configuration */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⛳ Hole Configuration</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {formData.holes.map((hole, index) => (
                    <div key={hole.hole_number} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="text-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Hole {hole.hole_number}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Par</label>
                          <select
                            value={hole.par ?? 4}
                            onChange={(e) => {
                              const newHoles = [...formData.holes];
                              newHoles[index] = {
                                ...hole,
                                par: parseInt(e.target.value) as 3 | 4 | 5
                              };
                              handleInputChange("holes", newHoles);
                            }}
                            className="w-full h-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {[3, 4, 5].map(par => (
                              <option key={par} value={par}>{par}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Handicap {!hole.handicap && <span className="text-orange-600">⚠️</span>}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="18"
                            value={hole.handicap ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                // Allow clearing the field temporarily
                                const newHoles = [...formData.holes];
                                newHoles[index] = { ...newHoles[index], handicap: undefined as any };
                                handleInputChange("holes", newHoles);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue >= 1 && numValue <= 18) {
                                  handleHoleHandicapChange(index, numValue);
                                }
                              }
                            }}
                            placeholder="?"
                            className={`w-full h-8 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center ${
                              !hole.handicap ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                            }`}
                            title={!hole.handicap ? "Handicap missing from API - please enter" : "Click to edit"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Golf Tournament Info */}
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  ⛳ Golf Tournament Format
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Search from thousands of golf courses worldwide 🌍</li>
                  <li>• Course data auto-fills (par, yardage, handicap)</li>
                  <li>• Missing handicaps? Just click and edit - super easy! ✏️</li>
                  <li>• Players grouped into fourballs (4-person groups)</li>
                  <li>• Stroke play with real-time leaderboards</li>
                  <li>• Track penalties, birdies, eagles, and more</li>
                  <li>• Fun social features: fines, banter, wall of shame 😂</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Players - Only for non-golf tournaments */}
        {sport !== 'golf' && (
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
              <p className="text-gray-500">Add players now or share the tournament link later for others to join</p>
            </div>
          )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
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
