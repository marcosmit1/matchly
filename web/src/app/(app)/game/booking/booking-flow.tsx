"use client";

import { useState, useEffect } from "react";
import { VENUE, TIME_SLOT, USER, BOOKING } from "@/types/game";
import { Calendar, Clock, Users, DollarSign, CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { PaymentComponent } from "./payment-component";

interface BookingFlowProps {
  venueId: string;
  user: USER;
  onBookingComplete: () => void;
}

type BookingStep = "details" | "payment" | "confirmation";

export function BookingFlow({ venueId, user, onBookingComplete }: BookingFlowProps) {
  const [venue, setVenue] = useState<VENUE | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>(4);
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TIME_SLOT[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState<BookingStep>("details");
  const [createdBooking, setCreatedBooking] = useState<BOOKING | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with today's date
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    
    // Mock venue data - TODO: Replace with actual API call
    const mockVenue: VENUE = {
      id: venueId,
      name: venueId === "1" ? "Beer Bros Lounge" : "Pong Palace",
      address: venueId === "1" ? "123 Long Street" : "456 Rivonia Road",
      city: venueId === "1" ? "Cape Town" : "Johannesburg",
      state: venueId === "1" ? "Western Cape" : "Gauteng",
      zip_code: venueId === "1" ? "8001" : "2196",
      phone: venueId === "1" ? "+27 21 123 4567" : "+27 11 987 6543",
      description: venueId === "1" 
        ? "The ultimate beer pong destination with craft beer and friendly atmosphere in the heart of Cape Town."
        : "Premium gaming venue with professional tables and tournament setup in Sandton.",
      number_of_tables: venueId === "1" ? 4 : 6,
      price_per_hour: venueId === "1" ? 120 : 150,
      hours_of_operation: {
        monday: { open: "16:00", close: "23:00" },
        tuesday: { open: "16:00", close: "23:00" },
        wednesday: { open: "16:00", close: "23:00" },
        thursday: { open: "16:00", close: "01:00" },
        friday: { open: "16:00", close: "02:00" },
        saturday: { open: "12:00", close: "02:00" },
        sunday: { open: "12:00", close: "22:00" },
      },
      amenities: venueId === "1" 
        ? ["Free WiFi", "Craft Beer", "Food Menu", "Parking", "Mountain Views"]
        : ["Tournament Tables", "Live Streaming", "Private Rooms", "Catering", "VIP Lounge"],
      images: [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setVenue(mockVenue);
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    if (!venue || !selectedDate) return;

    const generateTimeSlots = () => {
      console.log('Generating time slots for:', selectedDate, venue.name);
      
      // Get the day of the week
      const date = new Date(selectedDate);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      console.log('Day name:', dayName);
      
      const hours = venue.hours_of_operation[dayName];
      console.log('Hours for', dayName, ':', hours);
      
      if (!hours) {
        console.log('No hours found for', dayName);
        setTimeSlots([]);
        return;
      }

      const slots: TIME_SLOT[] = [];
      const openTime = parseInt(hours.open.split(':')[0]);
      let closeTime = parseInt(hours.close.split(':')[0]);
      
      // Handle venues that close after midnight (e.g., open 12:00, close 02:00)
      if (closeTime <= openTime) {
        closeTime += 24; // Add 24 hours to represent next day
      }
      
      console.log('Open time:', openTime, 'Close time:', closeTime);
      
      // Generate hourly slots
      for (let hour = openTime; hour < closeTime; hour++) {
        // Handle hours after midnight (convert back to 0-23 range for display)
        const displayHour = hour >= 24 ? hour - 24 : hour;
        const timeString = `${displayHour.toString().padStart(2, '0')}:00`;
        const isAvailable = Math.random() > 0.2; // Mock availability (80% chance available)
        
        slots.push({
          time: timeString,
          available: isAvailable,
          price: venue.price_per_hour,
        });
      }

      console.log('Generated slots:', slots);
      setTimeSlots(slots);
    };

    // For now, just generate mock time slots directly
    // We can add API integration later
    generateTimeSlots();

    // Optional: Try to fetch from API but don't block on it
    const fetchFromAPI = async () => {
      try {
        const response = await fetch(`/api/venues/${venue.id}/availability?date=${selectedDate}`);
        const data = await response.json();
        
        if (response.ok && data.timeSlots && data.timeSlots.length > 0) {
          console.log('API slots:', data.timeSlots);
          setTimeSlots(data.timeSlots);
        }
      } catch (error) {
        console.log('API not available, using generated slots');
      }
    };

    fetchFromAPI();
  }, [venue, selectedDate]);

  const handleProceedToPayment = () => {
    if (!venue || !selectedDate || !selectedTime) return;
    setStep("payment");
  };

  const handlePaymentSuccess = async () => {
    if (!venue || !selectedDate || !selectedTime) return;

    setBooking(true);
    
    try {
      const startTime = `${selectedDate}T${selectedTime}:00.000Z`;
      const endTime = `${selectedDate}T${(parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00:00.000Z`;
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venue_id: venue.id,
          start_time: startTime,
          end_time: endTime,
          number_of_players: numberOfPlayers,
          special_requests: specialRequests || undefined,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCreatedBooking(data.booking);
        
        // Create booking confirmation notification
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'booking_confirmation',
              recipient_id: user.id,
              booking_id: data.booking.id,
              message: `Your table booking at ${venue.name} has been confirmed!`,
              metadata: {
                venue_name: venue.name,
                venue_address: `${venue.address}, ${venue.city}`,
                start_time: startTime,
                end_time: endTime,
                table_number: data.booking.table_number,
                total_amount: data.booking.total_amount,
                booking_status: data.booking.status,
              },
            }),
          });
        } catch (notificationError) {
          console.log('Notification creation failed (non-critical):', notificationError);
        }
        
        setStep("confirmation");
      } else {
        console.error("Error creating booking:", data.error);
        setPaymentError(data.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setPaymentError("Failed to create booking");
    } finally {
      setBooking(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handleBack = () => {
    if (step === "payment") {
      setStep("details");
      setPaymentError(null);
    }
  };

  const calculateTotal = () => {
    return venue ? venue.price_per_hour : 0;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white text-lg">Loading venue details...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-300 text-lg">Venue not found</div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-6 pb-24">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Details</span>
          </button>

          {/* Booking Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
               style={{ backdropFilter: "blur(10px)" }}>
            <h3 className="text-lg font-bold mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Venue:</span>
                <span>{venue?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Date:</span>
                <span>{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Time:</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Players:</span>
                <span>{numberOfPlayers}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-white/20">
                <span>Total:</span>
                <span className="text-green-300">${calculateTotal()}</span>
              </div>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              {paymentError}
            </div>
          )}

          {/* Payment Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
               style={{ backdropFilter: "blur(10px)" }}>
            <h3 className="text-lg font-bold mb-4">Payment Information</h3>
            <PaymentComponent
              amount={calculateTotal()}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              loading={booking}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 flex flex-col items-center justify-center min-h-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-300" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-white/70 mb-2">Your table has been reserved successfully.</p>
            <p className="text-white/50 text-sm">Check your notifications for booking details and reminders.</p>
          </div>

          {createdBooking && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white max-w-sm w-full"
                 style={{ backdropFilter: "blur(10px)" }}>
              <h3 className="font-bold mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Booking ID:</span>
                  <span className="font-mono">{createdBooking.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Table:</span>
                  <span>#{createdBooking.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className="text-green-300 capitalize">{createdBooking.status}</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={onBookingComplete}
            className="w-full max-w-sm h-[45px]"
            variant="default"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 space-y-6 pb-24">
        {/* Venue Info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
             style={{ backdropFilter: "blur(10px)" }}>
          <h3 className="text-lg font-bold mb-1">{venue.name}</h3>
          <p className="text-white/70 text-sm">{venue.address}, {venue.city}</p>
          <p className="text-green-300 text-sm mt-1">${venue.price_per_hour}/hour</p>
        </div>

        {/* Date Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white relative overflow-visible"
             style={{ backdropFilter: "blur(10px)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} className="text-blue-300" />
            <h3 className="text-lg font-bold">Select Date</h3>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            style={{ 
              colorScheme: "dark",
              fontSize: "16px", // Prevents zoom on iOS
              WebkitAppearance: "none",
              MozAppearance: "textfield"
            }}
          />
        </div>

        {/* Time Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
             style={{ backdropFilter: "blur(10px)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={20} className="text-blue-300" />
            <h3 className="text-lg font-bold">Select Time</h3>
          </div>
          {timeSlots.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <p>Loading available times...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    selectedTime === slot.time
                      ? "bg-blue-500 text-white"
                      : slot.available
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Players Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
             style={{ backdropFilter: "blur(10px)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} className="text-blue-300" />
            <h3 className="text-lg font-bold">Number of Players</h3>
          </div>
          <div className="flex gap-2">
            {[2, 4, 6, 8].map((count) => (
              <button
                key={count}
                onClick={() => setNumberOfPlayers(count)}
                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                  numberOfPlayers === count
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
             style={{ backdropFilter: "blur(10px)" }}>
          <h3 className="text-lg font-bold mb-3">Special Requests (Optional)</h3>
          <Input
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requirements or requests..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        {/* Total & Booking */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
             style={{ backdropFilter: "blur(10px)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-green-300" />
              <span className="text-lg font-bold">Total</span>
            </div>
            <span className="text-2xl font-bold text-green-300">${calculateTotal()}</span>
          </div>
          
          <Button
            onClick={handleProceedToPayment}
            disabled={!selectedDate || !selectedTime}
            className="w-full h-[50px] flex items-center justify-center gap-2"
            variant="default"
          >
            <CreditCard size={20} />
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
