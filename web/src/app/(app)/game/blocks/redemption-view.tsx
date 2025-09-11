"use client";

import { useState, useEffect } from "react";
import { Target, X } from "lucide-react";
import { GAME } from "@/types/game";
import { gamecolors } from "@/lib/game-theme";

interface REDEMPTION_VIEW_PROPS {
  game: GAME;
  onHit: () => void;
  onMiss: () => void;
  onClose: () => void;
}

export function REDEMPTION_VIEW({ game, onHit, onMiss, onClose }: REDEMPTION_VIEW_PROPS) {
  const [showContent, setShowContent] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Start the animation
    setShowContent(true);

    // Start title pulse animation for "sudden death" feeling
    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 700);

    return () => clearInterval(pulseInterval);
  }, []);

  const handleHit = () => {
    onHit();
    onClose();
  };

  const handleMiss = () => {
    onMiss();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay with game theme */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 opacity-100"
        style={{ 
          background: `linear-gradient(135deg, ${gamecolors.dark}E6, ${gamecolors.main}E6)`,
          backdropFilter: "blur(8px)"
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 text-center transition-all duration-500 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div 
          className="rounded-3xl p-8 shadow-2xl max-w-md mx-4 border-2"
          style={{
            background: `linear-gradient(135deg, ${gamecolors.main}, ${gamecolors.dark})`,
            borderColor: `${gamecolors.accent}80`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${gamecolors.accent}40`
          }}
        >
          {/* Title with pulsing animation */}
          <div className="mb-6">
            <h1 
              className={`text-3xl font-black tracking-wider transition-transform duration-700 ${
                pulseAnimation ? "scale-110" : "scale-100"
              }`}
              style={{ 
                color: gamecolors.secondary,
                textShadow: `0 4px 12px rgba(0, 0, 0, 0.7), 0 0 20px ${gamecolors.cup}40`
              }}
            >
              🎯 REDEMPTION SHOT
            </h1>
          </div>

          {/* Description */}
          <p 
            className="text-lg font-semibold mb-8 opacity-90"
            style={{ color: gamecolors.secondary }}
          >
            Last chance to stay in the game!
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Hit Button */}
            <button
              onClick={handleHit}
              className="flex items-center gap-2 px-8 py-4 font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: `linear-gradient(135deg, #22c55e, #16a34a)`,
                color: "white",
                border: `2px solid ${gamecolors.cup}80`,
                boxShadow: `0 8px 25px rgba(34, 197, 94, 0.3)`
              }}
            >
              <Target size={24} />
              Hit!
            </button>

            {/* Miss Button */}
            <button
              onClick={handleMiss}
              className="flex items-center gap-2 px-8 py-4 font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: `linear-gradient(135deg, #ef4444, #dc2626)`,
                color: "white", 
                border: `2px solid ${gamecolors.cup}80`,
                boxShadow: `0 8px 25px rgba(239, 68, 68, 0.3)`
              }}
            >
              <X size={24} />
              Miss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
