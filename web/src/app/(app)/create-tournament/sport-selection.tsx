"use client";

import { useRouter } from "next/navigation";

export type SportType = 'padel' | 'squash' | 'pickleball' | 'golf';

interface SportOption {
  id: SportType;
  name: string;
  icon: string;
  description: string;
}

interface SportSelectionProps {
  onSelectSport: (sport: SportType) => void;
}

export function SportSelection({ onSelectSport }: SportSelectionProps) {
  const router = useRouter();

  const sports: SportOption[] = [
    {
      id: 'padel',
      name: 'Padel',
      icon: '🎾',
      description: 'Fast-paced racket sport with walls',
    },
    {
      id: 'squash',
      name: 'Squash',
      icon: '🏸',
      description: 'Intense indoor racket sport',
    },
    {
      id: 'pickleball',
      name: 'Pickleball',
      icon: '🏓',
      description: 'Fun paddle sport for all ages',
    },
    {
      id: 'golf',
      name: 'Golf',
      icon: '⛳',
      description: 'Classic golf tournament with fourballs',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 py-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Sport</h2>
          <p className="text-gray-600">Select the sport for your tournament</p>
        </div>

        <div className="grid gap-4">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
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
    </div>
  );
}
