"use client";

import { useState, useEffect } from "react";
import { VENUE } from "@/types/game";
import { MapPin, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@/blocks/button";

interface VenueSelectionProps {
  onVenueSelect: (venueId: string) => void;
}

export function VenueSelection({ onVenueSelect }: VenueSelectionProps) {
  const [venues, setVenues] = useState<VENUE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        // For now, use mock data directly since API might not have venues yet
        const mockVenues: VENUE[] = [
            {
              id: "1",
              name: "Beer Bros Lounge",
              address: "123 Long Street",
              city: "Cape Town",
              state: "Western Cape",
              zip_code: "8001",
              phone: "+27 21 123 4567",
              description: "The ultimate beer pong destination with craft beer and friendly atmosphere in the heart of Cape Town.",
              number_of_tables: 4,
              price_per_hour: 120,
              hours_of_operation: {
                monday: { open: "16:00", close: "23:00" },
                tuesday: { open: "16:00", close: "23:00" },
                wednesday: { open: "16:00", close: "23:00" },
                thursday: { open: "16:00", close: "01:00" },
                friday: { open: "16:00", close: "02:00" },
                saturday: { open: "12:00", close: "02:00" },
                sunday: { open: "12:00", close: "22:00" },
              },
              amenities: ["Free WiFi", "Craft Beer", "Food Menu", "Parking", "Mountain Views"],
              images: [],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Pong Palace",
              address: "456 Rivonia Road",
              city: "Johannesburg",
              state: "Gauteng",
              zip_code: "2196",
              phone: "+27 11 987 6543",
              description: "Premium gaming venue with professional tables and tournament setup in Sandton.",
              number_of_tables: 6,
              price_per_hour: 150,
              hours_of_operation: {
                monday: { open: "15:00", close: "23:00" },
                tuesday: { open: "15:00", close: "23:00" },
                wednesday: { open: "15:00", close: "23:00" },
                thursday: { open: "15:00", close: "01:00" },
                friday: { open: "15:00", close: "02:00" },
                saturday: { open: "11:00", close: "02:00" },
                sunday: { open: "11:00", close: "22:00" },
              },
              amenities: ["Tournament Tables", "Live Streaming", "Private Rooms", "Catering", "VIP Lounge"],
              images: [],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        
        setVenues(mockVenues);
        
        // Try to fetch from API as well (but don't block on it)
        try {
          const response = await fetch('/api/venues');
          const data = await response.json();
          
          if (response.ok && data.venues && data.venues.length > 0) {
            setVenues(data.venues);
          }
        } catch (apiError) {
          console.log('API not available, using mock data');
        }
      } catch (error) {
        console.error('Error setting up venues:', error);
        setError("Failed to load venues. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const formatHours = (hours: VENUE["hours_of_operation"]) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    if (!todayHours) return "Closed today";
    return `${todayHours.open} - ${todayHours.close}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white text-lg">Loading venues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-300 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 space-y-4 pb-24">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-white shadow-xl"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <div className="space-y-4">
              {/* Venue Header */}
              <div>
                <h3 className="text-xl font-bold">{venue.name}</h3>
                <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{venue.address}, {venue.city}, {venue.state}</span>
                </div>
              </div>

              {/* Description */}
              {venue.description && (
                <p className="text-white/80 text-sm">{venue.description}</p>
              )}

              {/* Venue Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-300" />
                  <div>
                    <div className="text-white/70">Today</div>
                    <div className="text-white font-medium">{formatHours(venue.hours_of_operation)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-300" />
                  <div>
                    <div className="text-white/70">Price</div>
                    <div className="text-white font-medium">${venue.price_per_hour}/hour</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users size={16} className="text-yellow-300" />
                  <div>
                    <div className="text-white/70">Tables</div>
                    <div className="text-white font-medium">{venue.number_of_tables} available</div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {venue.amenities.length > 0 && (
                <div>
                  <div className="text-white/70 text-sm mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Button */}
              <Button
                onClick={() => onVenueSelect(venue.id)}
                className="w-full h-[45px]"
                variant="pongbros-primary"
              >
                Select This Venue
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
