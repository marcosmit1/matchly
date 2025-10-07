# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Matchly is a modern sports tournament management platform built with Next.js, Supabase, and TypeScript. Originally designed for beer pong, it has been migrated to support squash and pickleball tournaments. The app provides comprehensive tournament management, box-based league systems with promotion/relegation, and court booking functionality.

**Important**: The main codebase is located in the `/web` directory. All development commands should be run from `/web`.

## Development Commands

All commands must be run from the `/web` directory:

```bash
cd web
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Styling**: Tailwind CSS 4, HeroUI, Material-UI
- **Deployment**: Vercel with PWA support
- **Payments**: Stripe integration (demo mode for bookings)

### Project Structure

```
/web
├── /src
│   ├── /app                    # Next.js App Router
│   │   ├── /(app)             # Main application pages (discover, tournaments, leagues, bookings)
│   │   ├── /api               # API routes (RESTful endpoints)
│   │   ├── /auth              # Authentication pages
│   │   ├── /join              # Join tournament/league pages
│   │   └── /login             # Login pages
│   ├── /blocks                # Core UI building blocks (drawer, button, input)
│   ├── /components            # Reusable React components organized by feature
│   ├── /contexts              # React Context providers (modal management)
│   ├── /hooks                 # Custom React hooks
│   ├── /lib                   # Utility libraries and services
│   ├── /schema                # Database schema files and migrations
│   ├── /supabase              # Supabase client configuration
│   ├── /types                 # TypeScript type definitions
│   └── /utils                 # Utility functions
├── *.sql                       # SQL migration files (stored in /web root)
├── CLAUDE.md                   # Original web-specific documentation
├── LEAGUE_API_DOCUMENTATION.md # Box-based league system API docs
├── BOOKING_SYSTEM_README.md    # Court booking system docs
└── SQUASH_MIGRATION_GUIDE.md   # Migration guide from beer pong to squash
```

## Key Features & Systems

### 1. Tournament System
- **Format Types**: Single elimination, double elimination, round robin
- **Player Management**: Individual players with seeding and guest player support
- **Real-time Scoring**: Live match tracking with game/set scoring
- **Guest Players**: Tournament-specific invite codes allow non-registered users to join tournaments
- **Match Tracking**: Comprehensive match history and statistics

**Key Files**:
- Tournament API: `/src/app/api/tournaments/`
- Tournament pages: `/src/app/(app)/tournaments/`
- Guest player management: `/src/components/tournaments/` and related SQL migrations

### 2. Box-Based League System
The league system uses a unique **box-based promotion/relegation** mechanism:

- Players are grouped into boxes (4-6 players each, optimal: 5)
- Each box plays round-robin matches
- Top performers promote up, bottom performers relegate down
- Creates natural skill-based matchmaking over time

**Promotion/Relegation Rules**:
- Top 20% of each box promote to higher box
- Bottom 20% of each box relegate to lower box
- Middle players stay in current box
- Supports 4-32+ players with optimal box sizing

**Key Tables**:
- `leagues` - Main league information
- `league_participants` - League membership
- `league_boxes` - Box structure and levels
- `league_box_assignments` - Player-to-box mapping
- `league_matches` - Matches with box assignments
- `league_box_standings` - Performance tracking per box
- `league_promotion_history` - Movement tracking

**API Endpoints**: See `LEAGUE_API_DOCUMENTATION.md` for full details
- `POST /api/leagues` - Create league
- `POST /api/leagues/join` - Join via invite code
- `POST /api/leagues/{id}/start` - Start league (creates boxes and generates matches)
- `GET /api/leagues/{id}/boxes` - Get box structure
- `POST /api/leagues/{id}/promotion` - Process promotion/relegation

### 3. Court Booking System
Full-featured venue and court booking system:

- **Venue Discovery**: Browse squash/pickleball venues with details
- **Real-time Availability**: Check court availability by date/time
- **Booking Management**: Create, view, cancel reservations
- **Payment**: Demo Stripe integration (prepared for production)

**Key Tables**:
- `venues` - Venue information, pricing, hours, amenities
- `bookings` - Reservation records with payment status

**API Endpoints**: See `BOOKING_SYSTEM_README.md` for full details
- `GET /api/venues` - List active venues
- `GET /api/venues/{id}/availability?date=YYYY-MM-DD` - Check availability
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - User's booking history

## Database Management

### Schema Location
SQL migration files are stored in the `/web` directory root (not in `/src/schema`).

### Migration Naming Convention
Use descriptive filenames with context:
- `add_tournament_guest_players.sql`
- `setup_league_system_safe.sql`
- `fix_league_guest_players.sql`

### Important Schema Patterns
- **Row Level Security (RLS)**: All tables use RLS policies for data protection
- **User Metadata**: User profiles stored in `raw_user_meta_data` JSON field
- **Real-time**: Tables support Supabase real-time subscriptions
- **Guest Players**: Tournament guest player system with invite codes and temporary access

### Running Migrations
Execute SQL files through Supabase SQL Editor or using psql:
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f migration_file.sql
```

## Authentication & Security

- **Supabase Auth**: Email/password authentication
- **RLS Policies**: Row-level security on all tables
- **User Metadata**: Profile data in `raw_user_meta_data` (name, avatar, etc.)
- **Service Role**: Use service role key for admin operations in API routes

## State Management

- **React Context**: Modal management (`/src/contexts/modal-context.tsx`)
- **Real-time Subscriptions**: Supabase real-time for live updates
- **URL State**: Search params and dynamic routes for navigation state

## UI/UX Patterns

### Design System
- **Theme**: Dark theme with gradient backgrounds and backdrop blur effects
- **Mobile-First**: Responsive design optimized for mobile devices
- **Components**: Custom library built on HeroUI and Material-UI
- **Animations**: Lottie animations and smooth transitions

### Component Organization
- `/src/blocks` - Basic building blocks (button, drawer, input)
- `/src/components` - Feature-specific components organized by domain
- Use TypeScript interfaces from `/src/types`
- Follow existing component patterns for consistency

## Testing

### Test Configuration
- **Framework**: Jest with React Testing Library
- **Location**: Tests in `/src/__tests__/` or co-located with `.test.tsx` extension
- **Commands**: `npm run test`, `npm run test:watch`, `npm run test:coverage`

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests with React Testing Library
- Manual testing checklists in feature documentation

## Common Development Tasks

### Adding a New Feature
1. Create components in `/src/components/{feature}/`
2. Define TypeScript types in `/src/types/`
3. Build API routes in `/src/app/api/{feature}/`
4. Add database migrations in `/web/*.sql`
5. Update RLS policies for new tables
6. Follow existing patterns for styling and state management

### Working with the League System
- Read `LEAGUE_API_DOCUMENTATION.md` for box system logic
- Box assignment happens when league starts via `/api/leagues/{id}/start`
- Promotion/relegation requires all matches in current round to be complete
- Use league_box_standings for performance tracking

### Working with Tournaments
- Tournament guest players can join via invite codes without full registration
- Guest player data includes name, email, invite code
- Guest players are tied to specific tournaments
- Use `/src/app/api/tournaments/{id}/guest-players` endpoints

### Working with Bookings
- Read `BOOKING_SYSTEM_README.md` for payment flow
- Venue availability considers operating hours and existing bookings
- Payment system is in demo mode by default
- For production Stripe: set `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`

## Path Aliases

The project uses TypeScript path aliases:
- `@/*` maps to `/src/*`

Example: `import { Button } from '@/blocks/button'`

## Deployment

### Vercel Configuration
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment Variables
Required for production:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_PUBLISHABLE_KEY=pk_live_... (optional, for bookings)
STRIPE_SECRET_KEY=sk_live_... (optional, for bookings)
```

## Important Notes

- **Working Directory**: Always work from `/web` directory
- **SQL Migrations**: Store in `/web` root, not `/src/schema`
- **Guest Players**: Tournament-specific, separate from league participants
- **Real-time Updates**: Leverage Supabase real-time for live match scoring
- **Dark Theme**: Maintain consistent dark theme with backdrop blur effects
- **Mobile-First**: Always test responsive design on mobile devices
