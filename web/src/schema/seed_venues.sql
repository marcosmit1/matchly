-- Insert sample venues for demo purposes (South African locations)
INSERT INTO public.venues (
  name,
  address,
  city,
  state,
  zip_code,
  phone,
  email,
  description,
  number_of_tables,
  price_per_hour,
  hours_of_operation,
  amenities
) VALUES 
(
  'Beer Bros Lounge',
  '123 Long Street',
  'Cape Town',
  'Western Cape',
  '8001',
  '+27 21 123 4567',
  'info@beerbroslgounge.co.za',
  'The ultimate beer pong destination with craft beer and friendly atmosphere in the heart of Cape Town. Perfect for casual games and celebrations.',
  4,
  120.00,
  '{
    "monday": {"open": "16:00", "close": "23:00"},
    "tuesday": {"open": "16:00", "close": "23:00"}, 
    "wednesday": {"open": "16:00", "close": "23:00"},
    "thursday": {"open": "16:00", "close": "01:00"},
    "friday": {"open": "16:00", "close": "02:00"},
    "saturday": {"open": "12:00", "close": "02:00"},
    "sunday": {"open": "12:00", "close": "22:00"}
  }'::jsonb,
  '["Free WiFi", "Craft Beer", "Food Menu", "Parking", "Mountain Views", "Outdoor Seating"]'::jsonb
),
(
  'Pong Palace',
  '456 Rivonia Road',
  'Johannesburg', 
  'Gauteng',
  '2196',
  '+27 11 987 6543',
  'bookings@pongpalace.co.za',
  'Premium gaming venue with professional tournament-grade tables and live streaming capabilities in Sandton.',
  6,
  150.00,
  '{
    "monday": {"open": "15:00", "close": "23:00"},
    "tuesday": {"open": "15:00", "close": "23:00"},
    "wednesday": {"open": "15:00", "close": "23:00"}, 
    "thursday": {"open": "15:00", "close": "01:00"},
    "friday": {"open": "15:00", "close": "02:00"},
    "saturday": {"open": "11:00", "close": "02:00"},
    "sunday": {"open": "11:00", "close": "22:00"}
  }'::jsonb,
  '["Tournament Tables", "Live Streaming", "Private Rooms", "Catering", "Pro Shop", "Coaching", "VIP Lounge"]'::jsonb
),
(
  'Brew & Ball Sports Bar',
  '789 Florida Road',
  'Durban',
  'KwaZulu-Natal', 
  '4001',
  '+27 31 456 7890',
  'contact@brewandball.co.za',
  'Casual sports bar with beer pong tables, big screens, and an extensive beer selection in trendy Morningside.',
  3,
  100.00,
  '{
    "monday": {"open": "17:00", "close": "23:00"},
    "tuesday": {"open": "17:00", "close": "23:00"},
    "wednesday": {"open": "17:00", "close": "23:00"},
    "thursday": {"open": "17:00", "close": "01:00"}, 
    "friday": {"open": "17:00", "close": "02:00"},
    "saturday": {"open": "14:00", "close": "02:00"},
    "sunday": {"open": "14:00", "close": "23:00"}
  }'::jsonb,
  '["Sports TV", "Happy Hour", "Pool Tables", "Arcade Games", "Food Delivery", "Beach Views"]'::jsonb
),
(
  'The Pong Zone',
  '321 Hatfield Street',
  'Pretoria',
  'Gauteng',
  '0028', 
  '+27 12 321 0987',
  'hello@pongzone.co.za',
  'Student-friendly venue near UP campus with affordable rates and late-night hours.',
  8,
  80.00,
  '{
    "monday": {"open": "18:00", "close": "02:00"},
    "tuesday": {"open": "18:00", "close": "02:00"},
    "wednesday": {"open": "18:00", "close": "02:00"},
    "thursday": {"open": "18:00", "close": "03:00"},
    "friday": {"open": "18:00", "close": "03:00"}, 
    "saturday": {"open": "16:00", "close": "03:00"},
    "sunday": {"open": "16:00", "close": "02:00"}
  }'::jsonb,
  '["Student Discounts", "Late Night", "Snacks", "Energy Drinks", "Study Area", "Campus Shuttle"]'::jsonb
);
