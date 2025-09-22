"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, Calendar, MapPin, Target, Copy, Share, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { BetterDatePicker } from "@/components/better-date-picker";

// Custom styles for the date picker
const customDatePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  
  .react-datepicker__input-container input {
    width: 100%;
    height: 48px;
    padding-left: 40px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background-color: white;
    color: #111827;
    font-size: 16px;
    outline: none;
    transition: all 0.2s;
  }
  
  .react-datepicker__input-container input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .react-datepicker__input-container input::placeholder {
    color: #9ca3af;
  }
  
  .react-datepicker {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    font-family: inherit;
  }
  
  .react-datepicker__header {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 12px 12px 0 0;
  }
  
  .react-datepicker__day--selected {
    background-color: #3b82f6;
    color: white;
  }
  
  .react-datepicker__day--selected:hover {
    background-color: #2563eb;
  }
  
  .react-datepicker__day:hover {
    background-color: #f3f4f6;
  }
`;

interface Sport {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SPORTS: Sport[] = [
  {
    id: "squash",
    name: "Squash",
    icon: "🏸",
    description: "Fast-paced racquet sport played in an enclosed court"
  },
  {
    id: "padel",
    name: "Padel",
    icon: "🎾",
    description: "Racquet sport combining tennis and squash elements"
  },
  {
    id: "pickleball",
    name: "Pickleball",
    icon: "🏓",
    description: "Fast-growing paddle sport played on a badminton-sized court"
  }
];

export function CreateLeagueForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLeague, setCreatedLeague] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sport: "",
    maxPlayers: 8 as number | string,
    startDate: null as Date | null,
    location: "",
    entryFee: 0,
    prizePool: 0,
    // Box configuration options
    numberOfBoxes: null as number | null,
    minPlayersPerBox: null as number | null,
    maxPlayersPerBox: null as number | null
  });

  const [hasEntryFee, setHasEntryFee] = useState(false);
  const [hasPrizePool, setHasPrizePool] = useState(false);

  const handleInputChange = (field: string, value: string | number | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSportSelect = (sportId: string) => {
    setFormData(prev => ({ ...prev, sport: sportId }));
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          max_players: typeof formData.maxPlayers === 'string' && formData.maxPlayers === '' ? 8 : formData.maxPlayers, // Convert camelCase to snake_case
          start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
          entry_fee: hasEntryFee ? formData.entryFee : 0,
          prize_pool: hasPrizePool ? formData.prizePool : 0,
          number_of_boxes: formData.numberOfBoxes,
          min_players_per_box: formData.minPlayersPerBox,
          max_players_per_box: formData.maxPlayersPerBox,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create league');
      }


      // Show success modal
      setCreatedLeague(result.league);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating league:', error);
      alert(error instanceof Error ? error.message : 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (createdLeague?.invite_code) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(createdLeague.invite_code);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = createdLeague.invite_code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        // Still show feedback even if copy fails
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const copyInviteLink = async () => {
    if (createdLeague?.invite_link) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(createdLeague.invite_link);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = createdLeague.invite_link;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        // Still show feedback even if copy fails
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    if (createdLeague?.id) {
      const leagueId = createdLeague.id;
      window.location.href = `/leagues/${leagueId}`;
    } else {
      window.location.href = '/leagues';
    }
    setCreatedLeague(null);
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Sport</h2>
          <p className="text-gray-600">Select the sport for your league</p>
        </div>

        <div className="grid gap-4">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSportSelect(sport.id)}
              className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{sport.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{sport.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{sport.description}</p>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">League Details</h2>
        <p className="text-gray-600">Fill in the details for your {SPORTS.find(s => s.id === formData.sport)?.name} league</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* League Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            League Name
          </label>
          <div className="relative">
            <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter league name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              placeholder="Describe your league..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="pl-3 w-full h-24 pt-3 pr-3 pb-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Max Players */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Players
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              min="4"
              max="32"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum 4, maximum 32 players</p>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date (Optional)
          </label>
          <BetterDatePicker
            value={formData.startDate}
            onChange={(date) => handleInputChange("startDate", date)}
            placeholder="Select start date"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty if start date is flexible</p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter location or venue"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Where will the league take place?</p>
        </div>

        {/* Entry Fee */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Entry Fee
            </label>
            <button
              type="button"
              onClick={() => setHasEntryFee(!hasEntryFee)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasEntryFee ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasEntryFee ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {hasEntryFee && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">€</span>
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={formData.entryFee || ""}
                onChange={(e) => handleInputChange("entryFee", parseFloat(e.target.value) || 0)}
                className="pl-8 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* Prize Pool */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Prize Pool
            </label>
            <button
              type="button"
              onClick={() => setHasPrizePool(!hasPrizePool)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hasPrizePool ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hasPrizePool ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {hasPrizePool && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">€</span>
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={formData.prizePool || ""}
                onChange={(e) => handleInputChange("prizePool", parseFloat(e.target.value) || 0)}
                className="pl-8 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* Box Configuration Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Box Configuration (Optional)</h3>
            <p className="text-sm text-gray-600">Customize how players are organized into boxes. Leave empty for automatic calculation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Boxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Boxes
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <span className="text-lg font-bold">#</span>
                </div>
                <input
                  type="number"
                  placeholder="Auto-calculate"
                  value={formData.numberOfBoxes || ""}
                  onChange={(e) => handleInputChange("numberOfBoxes", e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="1"
                  max={formData.maxPlayers}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Specify exact number of boxes</p>
            </div>

            {/* Min Players per Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Players per Box
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <span className="text-sm font-bold">↓</span>
                </div>
                <input
                  type="number"
                  placeholder="Auto-calculate"
                  value={formData.minPlayersPerBox || ""}
                  onChange={(e) => handleInputChange("minPlayersPerBox", e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="2"
                  max="8"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum players per box</p>
            </div>

            {/* Max Players per Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Players per Box
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center">
                  <span className="text-sm font-bold">↑</span>
                </div>
                <input
                  type="number"
                  placeholder="Auto-calculate"
                  value={formData.maxPlayersPerBox || ""}
                  onChange={(e) => handleInputChange("maxPlayersPerBox", e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-3 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  min="2"
                  max="12"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Maximum players per box</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Examples:</strong> 8 players with 2 boxes = 4 players each. 12 players with min 3, max 5 = 3 boxes of 4 players each.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            onClick={() => setStep(1)}
            className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.sport}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              "Create League"
            )}
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && createdLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">League Created!</h3>
              <p className="text-gray-600">Your league is ready to share</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Invite Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-lg text-center">
                    {createdLeague.invite_code}
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
                    {createdLeague.invite_link}
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

            <div className="flex space-x-3">
              <Button
                onClick={closeSuccess}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
              >
                View League
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
