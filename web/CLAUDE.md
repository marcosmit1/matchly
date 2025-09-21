# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Matchly is a modern tournament management app built with Next.js, Supabase, and TypeScript. It provides tournament management, league systems with box-based promotion/relegation, and court booking functionality for squash venues.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Testing
- Tests are configured with Jest and React Testing Library
- Test files should be placed in `src/__tests__/` or alongside components with `.test.tsx` extension
- Use `npm run test` to run all tests

## Architecture Overview

### Core Technologies
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Tailwind CSS 4, HeroUI components, Material-UI components
- **Deployment**: Vercel with PWA support

### Directory Structure
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/` - Reusable React components
- `/src/blocks/` - Core UI building blocks (drawer, button, input)
- `/src/lib/` - Utility libraries and services
- `/src/types/` - TypeScript type definitions
- `/src/supabase/` - Supabase client configuration
- `/src/schema/` - Database schema files and migrations

### Key Features

#### Tournament System
- Single/double elimination tournaments
- Real-time scoring and match tracking
- Player seeding and management
- Tournament guest player system with invite codes

#### League System (Box-Based)
- Box-based promotion/relegation system where players are grouped by skill level
- Round-robin matches within boxes
- Automatic promotion/relegation based on performance
- Detailed API documented in `LEAGUE_API_DOCUMENTATION.md`

#### Court Booking System
- Venue discovery and court reservation
- Real-time availability checking
- Payment integration (demo implementation)
- Full documentation in `BOOKING_SYSTEM_README.md`

### Database Architecture
- Uses Supabase PostgreSQL with Row Level Security (RLS)
- Complex schema with leagues, tournaments, matches, bookings
- Extensive SQL migration files in root directory
- Guest player and invitation systems

### Authentication & Security
- Supabase Auth for user management
- Row Level Security policies for data protection
- User metadata stored in `raw_user_meta_data`

### State Management
- React Context for modal management (`src/contexts/modal-context.tsx`)
- Supabase real-time subscriptions for live updates

### UI Components
- Custom component library built on HeroUI and Material-UI
- Consistent dark theme with gradient backgrounds
- Mobile-first responsive design
- PWA capabilities with offline support

## Working with this Codebase

### Adding New Features
1. Follow the existing component patterns in `/src/components/`
2. Use TypeScript interfaces defined in `/src/types/`
3. API routes follow RESTful conventions in `/src/app/api/`
4. Database changes require SQL migration files

### Database Modifications
- SQL migration files are stored in the root directory
- Use descriptive filenames with dates (e.g., `add_tournament_guest_players.sql`)
- Test migrations thoroughly as they affect production data

### Styling Guidelines
- Use Tailwind CSS classes consistently
- Follow the dark theme pattern with backdrop blur effects
- Mobile-first responsive design approach
- Maintain consistency with existing HeroUI component usage

### Testing Approach
- Write unit tests for utility functions
- Integration tests for API endpoints
- Component tests using React Testing Library
- Manual testing checklist available in booking system docs