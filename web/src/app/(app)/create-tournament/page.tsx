"use client";

import { useState } from "react";
import { SportSelection, SportType } from "./sport-selection";
import { CreateTournamentForm } from "./create-tournament-form";

export default function CreateTournamentPage() {
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);

  const handleSelectSport = (sport: SportType) => {
    setSelectedSport(sport);
  };

  const handleBack = () => {
    setSelectedSport(null);
  };

  if (!selectedSport) {
    return <SportSelection onSelectSport={handleSelectSport} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={handleBack}
          className="text-sm text-blue-600 hover:text-blue-700 mb-2"
        >
          ← Back to sport selection
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Create {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Tournament
        </h1>
      </div>

      <div className="px-4 py-6">
        <CreateTournamentForm sport={selectedSport} />
      </div>
    </div>
  );
}
