"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { USER, BOOKING } from "@/types/game";
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/blocks/button";

interface BookingsViewProps {
  user: USER;
}

export function BookingsView({ user }: BookingsViewProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BOOKING[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        
        if (response.ok) {
          setBookings(data.bookings || []);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-300 bg-green-500/20';
      case 'pending':
        return 'text-yellow-300 bg-yellow-500/20';
      case 'completed':
        return 'text-blue-300 bg-blue-500/20';
      case 'cancelled':
        return 'text-red-300 bg-red-500/20';
      default:
        return 'text-white/70 bg-white/10';
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const upcomingBookings = bookings.filter(booking => isUpcoming(booking.start_time));
  const pastBookings = bookings.filter(booking => !isUpcoming(booking.start_time));

  if (loading) {
    return (
      <div className="absolute-no-scroll">
        <div className="relative pt-8 sm:pt-12 pb-4 text-center px-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Back"
            className="absolute left-4 top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-4xl font-bold mb-2 text-white">My Bookings</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute-no-scroll">
      {/* Header */}
      <div className="relative pt-8 sm:pt-12 pb-4 text-center px-4">
        <button
          onClick={() => router.push("/")}
          aria-label="Back"
          className="absolute left-4 top-8 sm:top-12 h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-4xl font-bold mb-2 text-white">My Bookings</h1>
        <p className="text-md opacity-70 text-white">Manage your table reservations</p>
      </div>

      <div className="flex-1 px-4 pb-20">
        <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto teams-scroll-container">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {bookings.length === 0 && !error && (
            <div className="text-center py-12">
              <Calendar size={48} className="text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No bookings yet</h3>
                              <p className="text-white/70 mb-6">You haven&apos;t made any table reservations.</p>
              <Button
                onClick={() => router.push("/game")}
                variant="pongbros-primary"
                className="h-[45px]"
              >
                Book a Table
              </Button>
            </div>
          )}

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Upcoming Bookings</h2>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Past Bookings</h2>
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -z-10 inset-0">
        <div className="absolute -top-24 left-10 h-48 w-48 rounded-full bg-[#FAD659]/15 blur-3xl" />
        <div className="absolute -bottom-28 right-8 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
      </div>
    </div>
  );

  function BookingCard({ booking }: { booking: BOOKING }) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed':
          return 'text-green-300 bg-green-500/20';
        case 'pending':
          return 'text-yellow-300 bg-yellow-500/20';
        case 'completed':
          return 'text-blue-300 bg-blue-500/20';
        case 'cancelled':
          return 'text-red-300 bg-red-500/20';
        default:
          return 'text-white/70 bg-white/10';
      }
    };

    return (
      <div
        className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-xl"
        style={{ backdropFilter: "blur(10px)" }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">{booking.venue?.name || 'Unknown Venue'}</h3>
              <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                <MapPin size={14} />
                <span>{booking.venue?.address}, {booking.venue?.city}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-300" />
              <div>
                <div className="text-white/70">Date</div>
                <div className="text-white font-medium">{formatDate(booking.start_time)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-300" />
              <div>
                <div className="text-white/70">Time</div>
                <div className="text-white font-medium">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users size={16} className="text-yellow-300" />
              <div>
                <div className="text-white/70">Players</div>
                <div className="text-white font-medium">{booking.number_of_players}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-green-300" />
              <div>
                <div className="text-white/70">Total</div>
                <div className="text-white font-medium">${booking.total_amount}</div>
              </div>
            </div>
          </div>

          {/* Table Info */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">Table #{booking.table_number}</span>
              <span className="text-white/70 font-mono">#{booking.id.slice(-8)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
