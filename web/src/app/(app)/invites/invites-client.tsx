"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { Notification, NotificationType } from "@/types/notifications";
import { Calendar, Users, Trophy, CheckCircle, Clock, X, MapPin, DollarSign, ChevronRight } from "lucide-react";

interface UserBooking {
  id: string;
  venue_id: string;
  user_id: string;
  table_number: number;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  special_requests?: string;
  created_at: string;
  venues: {
    name: string;
    address: string;
    city: string;
  };
}

type Invite = Notification;

export default function InvitesClient({ initialInvites }: { initialInvites: Invite[] }) {
  const supabase = createClient();
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'bookings'>('notifications');
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const channel = supabase
      .channel("invites")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "invitations" },
        (payload: { new: Invite }) => setInvites((prev) => [payload.new, ...prev])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "invitations" },
        (payload: { new: Invite }) => setInvites((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)))
      )
      .subscribe();

    // Fetch user bookings on component mount
    fetchUserBookings();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues (
            name,
            address,
            city
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (id: string, action: "accept" | "decline") => {
    await fetch("/api/invitations/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
  };

  const markAsRead = async (id: string) => {
    await fetch("/api/invitations/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "read" }) });
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'game':
        return <Users size={20} className="text-blue-300" />;
      case 'tournament':
        return <Trophy size={20} className="text-yellow-300" />;
      case 'booking_confirmation':
        return <CheckCircle size={20} className="text-green-300" />;
      case 'booking_reminder':
        return <Clock size={20} className="text-orange-300" />;
      case 'booking_cancelled':
        return <X size={20} className="text-red-300" />;
      default:
        return <Calendar size={20} className="text-blue-300" />;
    }
  };

  const getNotificationTitle = (type: NotificationType) => {
    switch (type) {
      case 'game':
        return 'Game Invite';
      case 'tournament':
        return 'Tournament Invite';
      case 'booking_confirmation':
        return 'Booking Confirmed';
      case 'booking_reminder':
        return 'Booking Reminder';
      case 'booking_cancelled':
        return 'Booking Cancelled';
      default:
        return 'Notification';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isBookingNotification = (type: NotificationType) => {
    return type.startsWith('booking_');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-400/15 border-green-300/20 text-green-300';
      case 'pending':
        return 'bg-yellow-400/15 border-yellow-300/20 text-yellow-300';
      case 'cancelled':
        return 'bg-red-400/15 border-red-300/20 text-red-300';
      case 'completed':
        return 'bg-blue-400/15 border-blue-300/20 text-blue-300';
      default:
        return 'bg-white/10 border-white/15 text-white/70';
    }
  };

  const formatBookingDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  return (
    <main className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 pt-6 pb-4">
        <div className="text-white text-2xl font-bold">Activity</div>
        <div className="text-white/60 text-sm mt-1">Game invites, bookings & more</div>
        
        {/* Tab Navigation */}
        <div className="flex mt-4 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Game Invites
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'bookings'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {activeTab === 'notifications' ? (
          <div className="space-y-3">
            {invites.length === 0 && <div className="text-white/60 text-sm">No notifications yet.</div>}
            {invites.map((inv) => (
          <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg" style={{ backdropFilter: "blur(8px)" as any }}>
            <div className="flex items-start gap-3">
              {/* Notification Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(inv.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white/70">{formatDateTime(inv.created_at)}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] border ${
                    inv.status === 'accepted' ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-300' : 
                    inv.status === 'declined' ? 'bg-red-400/15 border-red-300/20 text-red-300' : 
                    inv.status === 'read' ? 'bg-blue-400/15 border-blue-300/20 text-blue-300' :
                    'bg-white/10 border-white/15 text-white/70'
                  }`}>
                    {inv.status === 'unread' ? 'new' : inv.status}
                  </span>
                </div>

                {/* Title */}
                <div className="text-lg font-semibold mb-1">
                  {getNotificationTitle(inv.type)}
                </div>

                {/* Message */}
                {inv.message && (
                  <div className="text-white/70 text-sm mb-2">{inv.message}</div>
                )}

                {/* Booking Details */}
                {isBookingNotification(inv.type) && inv.metadata && (
                  <div className="bg-white/5 rounded-xl p-3 mb-3 space-y-2">
                    {inv.metadata.venue_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-blue-300" />
                        <span className="font-medium">{inv.metadata.venue_name}</span>
                      </div>
                    )}
                    {inv.metadata.venue_address && (
                      <div className="text-white/60 text-xs ml-6">
                        {inv.metadata.venue_address}
                      </div>
                    )}
                    {inv.metadata.start_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-green-300" />
                        <span>{formatDateTime(inv.metadata.start_time)}</span>
                        {inv.metadata.end_time && (
                          <span className="text-white/60">
                            - {new Date(inv.metadata.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                    {inv.metadata.table_number && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Table #{inv.metadata.table_number}</span>
                        {inv.metadata.total_amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} className="text-green-300" />
                            <span className="font-medium">R{inv.metadata.total_amount}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {inv.status === "pending" && !isBookingNotification(inv.type) && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respond(inv.id, "accept")} 
                      className="h-8 px-3 rounded-lg bg-emerald-400/20 border border-emerald-300/20 text-emerald-200 text-xs active:scale-95"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respond(inv.id, "decline")} 
                      className="h-8 px-3 rounded-lg bg-red-400/20 border border-red-300/20 text-red-200 text-xs active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                {inv.status === "unread" && isBookingNotification(inv.type) && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => markAsRead(inv.id)} 
                      className="h-8 px-3 rounded-lg bg-blue-400/20 border border-blue-300/20 text-blue-200 text-xs active:scale-95"
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
            ))}
          </div>
        ) : (
          // Bookings Tab
          <div className="space-y-3">
            {loading && <div className="text-white/60 text-sm">Loading your bookings...</div>}
            

            
            {!loading && bookings.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={48} className="text-white/30 mx-auto mb-4" />
                <div className="text-white/60 text-sm">No bookings yet.</div>
                <div className="text-white/40 text-xs mt-1">Make your first booking to see it here!</div>
              </div>
            )}
            {!loading && bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-lg" style={{ backdropFilter: "blur(8px)" as any }}>
                <div className="flex items-start gap-3">
                  {/* Booking Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <Calendar size={20} className="text-blue-300" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-white/70">{formatBookingDateTime(booking.created_at)}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-lg font-semibold mb-1">
                      Table Booking
                    </div>

                    {/* Venue Details */}
                    <div className="bg-white/5 rounded-xl p-3 mb-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-blue-300" />
                        <span className="font-medium">{booking.venues.name}</span>
                      </div>
                      <div className="text-white/60 text-xs ml-6">
                        {booking.venues.address}, {booking.venues.city}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-green-300" />
                        <span>{formatBookingDateTime(booking.start_time)}</span>
                        <span className="text-white/60">
                          - {new Date(booking.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Table #{booking.table_number}</span>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-green-300" />
                          <span className="font-medium">R{booking.total_amount}</span>
                        </div>
                      </div>
                      {booking.special_requests && (
                        <div className="text-white/60 text-xs">
                          <span className="font-medium">Special Requests:</span> {booking.special_requests}
                        </div>
                      )}
                    </div>

                    {/* Booking ID */}
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Booking ID: {booking.id.slice(0, 8)}...</span>
                      <ChevronRight size={16} className="text-white/30" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


