# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo with the main application located in the `/web` directory. **All development work should be done within the `/web` directory.**

```
/matchly (root)
└── /web                    # Main Next.js application
    ├── /src                # Application source code
    ├── package.json        # Dependencies and scripts
    ├── CLAUDE.md           # Detailed web-specific documentation
    └── *.md                # Feature-specific documentation
```

## Working Directory

**IMPORTANT**: Before running any commands or making changes, navigate to the `/web` directory:

```bash
cd web
```

All npm commands, file operations, and development tasks must be executed from within `/web`.

## Quick Start Commands

```bash
cd web
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

## Project Overview

Matchly is a comprehensive sports tournament management platform supporting multiple sports:

- **Squash**: Tournament brackets, leagues with box-based promotion/relegation, court bookings
- **Pickleball**: Similar features as squash
- **Golf**: Tournament management (recently implemented)

### Core Features
1. **Tournament System**: Single/double elimination, round robin formats with real-time scoring
2. **Box-Based Leagues**: Unique promotion/relegation system grouping players by skill level
3. **Court Booking**: Venue discovery and reservation system with Stripe integration
4. **Guest Players**: Tournament-specific invite codes for non-registered participants
5. **PWA Support**: Progressive Web App with offline capabilities and native app-like experience

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS 4, HeroUI, Material-UI
- **Deployment**: Vercel

## Documentation

For detailed documentation about the application architecture, API endpoints, database schema, and development patterns, see:

- **`/web/CLAUDE.md`** - Comprehensive development guide with architecture details
- **`/web/LEAGUE_API_DOCUMENTATION.md`** - Box-based league system API and logic
- **`/web/BOOKING_SYSTEM_README.md`** - Court booking system and payment flow
- **`/web/SQUASH_MIGRATION_GUIDE.md`** - Migration guide from beer pong to squash
- **`/web/README.md`** - Project README

## Key Architectural Patterns

### Database & Schema
- SQL migration files stored in `/web/src/schema/` directory
- All tables use Row Level Security (RLS) for data protection
- User profiles stored in Supabase Auth `raw_user_meta_data` JSON field
- Real-time subscriptions enabled for live updates

### API Routes
- RESTful API routes in `/web/src/app/api/`
- Key endpoints: `/tournaments`, `/leagues`, `/bookings`, `/venues`, `/golf-tournaments`
- Use Supabase service role key for admin operations in API routes

### Frontend Structure
```
/web/src
├── /app                    # Next.js App Router
│   ├── /(app)             # Main app pages (discover, tournaments, leagues, bookings, golf)
│   ├── /api               # API routes
│   └── /auth              # Authentication pages
├── /blocks                # Core UI building blocks
├── /components            # Feature-specific React components
├── /lib                   # Utility libraries and services
├── /supabase              # Supabase client configuration
└── /types                 # TypeScript type definitions
```

### Path Aliases
TypeScript path alias `@/*` maps to `/web/src/*`

Example: `import { Button } from '@/blocks/button'`

## Recent Developments

Based on recent commits:
- **Golf tournaments** feature recently implemented (see `/web/src/app/api/golf-tournaments` and `/web/src/app/(app)/golf`)
- Pickleball support added alongside squash
- Guest player system with invite codes and real-time validation
- PWA improvements for native app-like experience

## Common Patterns

### Authentication
- Email/password authentication via Supabase Auth
- User metadata in `raw_user_meta_data` (name, avatar)
- RLS policies enforce data access control

### Real-time Features
- Live match scoring using Supabase real-time subscriptions
- Real-time invite code validation
- Live tournament bracket updates

### State Management
- React Context for modal management
- URL state via search params and dynamic routes
- Real-time subscriptions for live data

### UI/UX
- Mobile-first responsive design
- Dark theme with gradient backgrounds and backdrop blur
- Lottie animations (`/web/public/lottie/`)
- PWA with service worker and manifest

## Development Workflow

1. Navigate to `/web` directory
2. Install dependencies: `npm install`
3. Set up environment variables (Supabase credentials)
4. Run development server: `npm run dev`
5. For new features:
   - Add components in `/web/src/components/{feature}/`
   - Create API routes in `/web/src/app/api/{feature}/`
   - Define types in `/web/src/types/`
   - Add database migrations in `/web/src/schema/`
   - Update RLS policies for new tables

## Important Notes

- **Always work from `/web` directory** - the root directory is just a container
- **SQL migrations** are in `/web/src/schema/`, not at the web root
- **Guest players** are tournament-specific and separate from league participants
- **PWA configuration** in `/web/next.config.ts` with `next-pwa`
- **Dark theme** should be maintained consistently across all new features
- **Mobile-first** - always test responsive design on mobile devices

For detailed information about any specific feature or system, refer to the documentation files in `/web/`.
