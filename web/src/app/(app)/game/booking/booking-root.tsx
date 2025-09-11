"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { USER } from "@/types/game";
import { ArrowLeft } from "lucide-react";
import { VenueSelection } from "./venue-selection";
import { BookingFlow } from "./booking-flow";

type BookingStep = "venues" | "booking";

interface BookingRootProps {
  user: USER;
}

export function BOOKING_ROOT({ user }: BookingRootProps) {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>("venues");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Prevent scrolling in header area
  useEffect(() => {
    // Reset any scroll prevention from other screens
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    
    // Prevent scrolling specifically in header areas
    const preventHeaderScroll = (e: TouchEvent | WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.booking-header-no-scroll')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('touchmove', preventHeaderScroll, { passive: false });
    document.addEventListener('wheel', preventHeaderScroll, { passive: false });
    
    return () => {
      // Clean up when leaving
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.removeEventListener('touchmove', preventHeaderScroll);
      document.removeEventListener('wheel', preventHeaderScroll);
    };
  }, []);

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId);
    setStep("booking");
  };

  const handleBack = () => {
    if (step === "booking") {
      setStep("venues");
      setSelectedVenueId(null);
    } else {
      router.push("/game");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header - No scrolling allowed */}
      <div className="booking-header-no-scroll relative pt-8 sm:pt-12 pb-4 text-center px-4 flex-shrink-0 bg-[#2C2C2C] z-10 overflow-hidden">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="absolute left-4 top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-4xl font-bold mb-2 text-white">
          {step === "venues" ? "Select Venue" : "Book Table"}
        </h1>
        <p className="text-md opacity-70 text-white">
          {step === "venues" ? "Choose where you want to play" : "Choose your time slot"}
        </p>
      </div>

      {step === "venues" && (
        <VenueSelection onVenueSelect={handleVenueSelect} />
      )}

      {step === "booking" && selectedVenueId && (
        <BookingFlow 
          venueId={selectedVenueId} 
          user={user}
          onBookingComplete={() => {
            // Navigate to booking confirmation or back to home
            router.push("/");
          }}
        />
      )}

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -z-10 inset-0">
        <div className="absolute -top-24 left-10 h-48 w-48 rounded-full bg-[#FAD659]/15 blur-3xl" />
        <div className="absolute -bottom-28 right-8 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
      </div>
    </div>
  );
}
