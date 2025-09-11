"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, Calendar, MapPin, Target, Copy, Share, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

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
    maxPlayers: 8,
    startDate: "",
    location: "",
    entryFee: 0,
    prizePool: 0
  });

  const handleInputChange = (field: string, value: string | number) => {
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
          max_players: formData.maxPlayers, // Convert camelCase to snake_case
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create league');
      }

      console.log('League creation response:', result);
      console.log('League object:', result.league);
      console.log('League ID:', result.league?.id);

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
    console.log('closeSuccess called');
    console.log('createdLeague:', createdLeague);
    console.log('createdLeague.id:', createdLeague?.id);
    console.log('createdLeague.id type:', typeof createdLeague?.id);
    
    setShowSuccess(false);
    if (createdLeague?.id) {
      const leagueId = createdLeague.id;
      console.log('Navigating to league:', leagueId);
      window.location.href = `/leagues/${leagueId}`;
    } else {
      console.log('No league ID, navigating to leagues list');
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

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
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
              className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            placeholder="Describe your league..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full h-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder:text-gray-400"
          />
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
              placeholder="8"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange("maxPlayers", parseInt(e.target.value) || 8)}
              className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              min="4"
              max="32"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 [color-scheme:light]"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter location or venue"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Entry Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Fee (€)
          </label>
          <input
            type="number"
            placeholder="0"
            value={formData.entryFee || ""}
            onChange={(e) => handleInputChange("entryFee", parseFloat(e.target.value) || 0)}
            className="w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            min="0"
            step="0.01"
          />
        </div>

        {/* Prize Pool */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prize Pool (€)
          </label>
          <input
            type="number"
            placeholder="0"
            value={formData.prizePool || ""}
            onChange={(e) => handleInputChange("prizePool", parseFloat(e.target.value) || 0)}
            className="w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            min="0"
            step="0.01"
          />
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
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
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
