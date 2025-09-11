"use client";

export default function TournamentLoader() {
  return (
    <div className="flex items-center justify-center p-8" aria-label="Loading">
      <div className="relative">
        {/* Trophy base */}
        <div className="w-16 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
          {/* Trophy cup */}
          <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg relative">
            {/* Trophy handles */}
            <div className="absolute -left-2 top-2 w-3 h-6 bg-yellow-500 rounded-l-full"></div>
            <div className="absolute -right-2 top-2 w-3 h-6 bg-yellow-500 rounded-r-full"></div>
            {/* Trophy top */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-yellow-300 rounded-full"></div>
          </div>
        </div>
        
        {/* Animated ring around trophy */}
        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Pulsing effect */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
      </div>
    </div>
  );
}
