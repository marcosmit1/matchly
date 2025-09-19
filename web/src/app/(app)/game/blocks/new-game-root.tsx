"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NEW_GAME_VIEW } from "./new-game-view";
import { USER } from "@/types/game";
import { Zap, Trophy, ArrowLeft, Calendar, Target } from "lucide-react";

type Mode = null | "quick" | "tournament" | "booking";

export function NEW_GAME_ROOT({ user }: { user: USER }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);

  // Prevent scrolling on this screen
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Allow pinch zoom
      e.preventDefault();
    };
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    window.addEventListener('scroll', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      window.removeEventListener('scroll', preventDefault);
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventDefault);
    };
  }, []);

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    if (mode === "tournament") {
      router.push("/game/tournament");
    } else if (mode === "booking") {
      router.push("/game/booking");
    }
  }, [mode, router]);

  if (mode === "quick") {
    return <NEW_GAME_VIEW user={user} />;
  }

  if (mode === "tournament") {
    // Show loading state while navigating
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading tournament setup...</div>
      </div>
    );
  }

  if (mode === "booking") {
    // Show loading state while navigating
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading booking system...</div>
      </div>
    );
  }

  return (
    <div className="absolute-no-scroll">
      {/* Header */}
      <div className="relative pt-8 sm:pt-12 pb-6 text-center px-4">
        <button
          onClick={() => router.push("/")}
          aria-label="Back"
          className="absolute left-4 top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-4xl font-bold mb-2 text-white">New Game</h1>
        <p className="text-md opacity-70 text-white">Choose a mode</p>
      </div>

      <div className="px-4 absolute inset-x-0 top-1/2 transform -translate-y-1/2">
        <div className="max-w-md w-full mx-auto space-y-4">
          {/* Quick Match */}
          <button
          onClick={() => setMode("quick")}
          className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-white shadow-xl active:scale-[0.99]"
          style={{ backdropFilter: "blur(10px)" as any }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300 border border-emerald-300/20">
              <Zap size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold">Quick Match</div>
              <div className="text-white/70 text-sm">Fast setup with two players.</div>
            </div>
          </div>
          </button>

          {/* Tournament */}
          <button
          onClick={() => setMode("tournament")}
          className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-white shadow-xl active:scale-[0.99]"
          style={{ backdropFilter: "blur(10px)" as any }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-yellow-400/20 text-yellow-300 border border-yellow-300/20">
              <Trophy size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold">Tournament</div>
              <div className="text-white/70 text-sm">Create a bracket and run a full squash tournament.</div>
            </div>
          </div>
          </button>

          {/* Bookings */}
          <button
          onClick={() => setMode("booking")}
          className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-white shadow-xl active:scale-[0.99]"
          style={{ backdropFilter: "blur(10px)" as any }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-blue-400/20 text-blue-300 border border-blue-300/20">
              <Calendar size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold">Book a Court</div>
              <div className="text-white/70 text-sm">Reserve a squash court at a local venue and play with friends.</div>
            </div>
          </div>
          </button>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -z-10 inset-0">
        <div className="absolute -top-24 left-10 h-48 w-48 rounded-full bg-[#FAD659]/15 blur-3xl" />
        <div className="absolute -bottom-28 right-8 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
    </div>
  );
}


