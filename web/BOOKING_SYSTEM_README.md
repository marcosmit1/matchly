# Squash Tourney Court Booking System

## Overview

The Squash Tourney booking system allows users to reserve squash courts at local venues. This feature is fully integrated into the existing Next.js web app and follows the same design patterns and theme as the rest of the application.

## Features

### 🎯 Core Functionality
- **Venue Discovery**: Browse available squash venues with detailed information
- **Real-time Availability**: Check court availability by date and time
- **Booking Management**: Create, view, and manage court reservations
- **Payment Integration**: Secure payment processing (demo implementation)
- **Responsive Design**: Optimized for mobile and desktop

### 🎨 User Experience
- **Seamless Integration**: Added as a third option in the "New Game" tab
- **Step-by-step Flow**: Venue selection → Time slot selection → Payment → Confirmation
- **Consistent Theme**: Matches the app's dark theme with gradient backgrounds
- **Intuitive Navigation**: Clear back buttons and progress indication

## Architecture

### Frontend Components

#### 1. New Game Integration
- **Location**: `/src/app/(app)/game/blocks/new-game-root.tsx`
- **Purpose**: Added "Book a Court" option alongside Quick Match and Tournament
- **Icon**: Calendar icon with blue accent color

#### 2. Booking Flow Components
- **`booking-root.tsx`**: Main container managing the booking flow
- **`venue-selection.tsx`**: Venue browsing and selection interface
- **`booking-flow.tsx`**: Time slot selection and booking details
- **`payment-component.tsx`**: Payment form (demo implementation)

#### 3. Booking Management
- **`/bookings/page.tsx`**: User's booking history and management
- **Navigation**: Added to bottom navigation bar

### Backend API Endpoints

#### Venues API
```
GET /api/venues
- Returns list of active venues
- Includes venue details, hours, pricing, amenities
```

#### Availability API
```
GET /api/venues/[venueId]/availability?date=YYYY-MM-DD
- Returns available time slots for a specific venue and date
- Considers existing bookings and venue operating hours
```

#### Bookings API
```
POST /api/bookings
- Creates a new booking
- Validates availability and assigns table number

GET /api/bookings
- Returns user's booking history

PATCH /api/bookings/[bookingId]
- Updates booking status or payment status

DELETE /api/bookings/[bookingId]
- Cancels a booking (soft delete)
```

### Database Schema

#### Venues Table
```sql
venues (
  id: uuid (primary key)
  name: text
  address: text
  city: text
  state: text
  zip_code: text
  phone: text (optional)
  email: text (optional)
  description: text (optional)
  number_of_tables: integer
  price_per_hour: decimal
  hours_of_operation: jsonb
  amenities: jsonb (array)
  images: jsonb (array)
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
)
```

#### Bookings Table
```sql
bookings (
  id: uuid (primary key)
  venue_id: uuid (foreign key)
  user_id: uuid (foreign key)
  table_number: integer
  start_time: timestamp
  end_time: timestamp
  status: enum (pending, confirmed, active, completed, cancelled, no_show)
  total_amount: decimal
  payment_status: enum (pending, processing, succeeded, failed, cancelled, refunded)
  payment_intent_id: text (optional)
  special_requests: text (optional)
  number_of_players: integer
  created_at: timestamp
  updated_at: timestamp
)
```

## Setup Instructions

### 1. Database Setup
```sql
-- Run the schema files in order:
\i src/schema/venues.sql
\i src/schema/bookings.sql

-- Optional: Add sample data
\i src/schema/seed_venues.sql
```

### 2. Environment Variables
```env
# Add to your .env.local if using real Stripe integration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Dependencies
```bash
# Already installed in the project:
npm install stripe @stripe/stripe-js
```

## Usage Flow

### 1. User Journey
1. User navigates to "New Game" tab
2. Selects "Book a Table" option
3. Browses available venues
4. Selects preferred venue
5. Chooses date and time slot
6. Specifies number of players and special requests
7. Proceeds to payment
8. Completes booking and receives confirmation
9. Can view booking in "Bookings" tab

### 2. Venue Management
Venues can be managed through direct database access or by building an admin interface. The system supports:
- Multiple tables per venue
- Custom operating hours per day
- Flexible pricing
- Amenity listing
- Active/inactive status

## Payment Integration

### Current Implementation
- **Demo Mode**: Simulated payment processing for demonstration
- **Forms**: Credit card input with validation
- **Security**: Displays security indicators and SSL messaging

### Stripe Integration (Future)
The system is prepared for Stripe integration:
```javascript
// Example Stripe integration
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const paymentIntent = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: elements.getElement(CardElement),
  }
});
```

## Design System

### Colors
- **Primary**: Blue accents for booking-related elements
- **Success**: Green for confirmations and positive states
- **Warning**: Yellow for pending states
- **Error**: Red for cancellations and errors

### Components
- **Cards**: Rounded corners with backdrop blur
- **Buttons**: Consistent with existing PongBros button styles
- **Forms**: Dark theme with white/10 opacity backgrounds
- **Navigation**: Integrated with existing bottom navigation

## Testing

### Manual Testing Checklist
- [ ] Venue selection displays all active venues
- [ ] Time slot availability updates based on date selection
- [ ] Booking creation works with valid data
- [ ] Payment flow completes successfully
- [ ] Booking confirmation shows correct details
- [ ] User can view bookings in history
- [ ] Navigation between screens works smoothly
- [ ] Responsive design works on mobile

### API Testing
```bash
# Test venue listing
curl -X GET http://localhost:3000/api/venues

# Test availability
curl -X GET "http://localhost:3000/api/venues/[venue_id]/availability?date=2024-01-15"

# Test booking creation
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"venue_id":"...","start_time":"...","end_time":"...","number_of_players":4}'
```

## Future Enhancements

### Phase 2 Features
- [ ] Real Stripe payment integration
- [ ] Email confirmations and reminders
- [ ] SMS notifications
- [ ] Venue reviews and ratings
- [ ] Group booking invitations
- [ ] Recurring bookings
- [ ] Cancellation policies
- [ ] Refund processing

### Admin Features
- [ ] Venue management dashboard
- [ ] Booking analytics
- [ ] Revenue reporting
- [ ] Customer management
- [ ] Dynamic pricing

### Mobile App Integration
- [ ] Calendar integration
- [ ] Location-based venue discovery
- [ ] Push notifications
- [ ] Offline booking queue

## Troubleshooting

### Common Issues

1. **Venues not loading**
   - Check database connection
   - Verify venues table has data
   - Check API endpoint accessibility

2. **Time slots showing as unavailable**
   - Verify venue operating hours
   - Check for existing bookings
   - Ensure date is not in the past

3. **Payment errors**
   - Currently in demo mode - payments will simulate success/failure
   - For real integration, check Stripe keys and webhook setup

4. **Booking creation fails**
   - Verify user authentication
   - Check for table availability conflicts
   - Validate all required fields

## Contributing

When contributing to the booking system:

1. **Follow existing patterns**: Use the same component structure and styling
2. **Test thoroughly**: Ensure all user flows work end-to-end
3. **Update documentation**: Keep this README current with changes
4. **Consider mobile**: All components should work well on mobile devices
5. **Security first**: Validate all inputs and secure API endpoints

## Support

For questions or issues with the booking system:
- Check the console for error messages
- Review the API responses for debugging information
- Ensure all required environment variables are set
- Verify database schema is up to date
