# Squash Tournament App Migration Guide

This guide will help you transform the beer pong tournament app into a squash tournament app.

## 🎾 What's Been Transformed

### Database Schema Changes
- **Games**: Changed from team-based to individual player matches
- **Tournaments**: Now supports individual players instead of teams
- **Game Events**: Updated to track squash-specific events (points, games, sets)
- **Venues**: Changed from beer pong tables to squash courts
- **Bookings**: Updated to support court reservations instead of table bookings

### UI/UX Changes
- Updated terminology from "teams" to "players"
- Changed "Book a Table" to "Book a Court"
- Updated descriptions to reflect squash instead of beer pong
- Maintained the same modern, mobile-first design

### Scoring System
- **Squash Scoring**: Best of 3 or 5 games, first to 11 points (or 9)
- **Game Events**: Points, games, sets, serves, faults, lets, strokes
- **Tournament Types**: Single elimination, double elimination, round robin

## 🚀 Setup Instructions

### 1. Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note down your project URL and anon key

### 2. Run Database Migration
1. Open the Supabase SQL Editor
2. Copy and paste the contents of `migrate_to_squash.sql`
3. Execute the script to create all tables, indexes, and functions

### 3. Update Environment Variables
Create a `.env.local` file in the web directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Install Dependencies
```bash
cd web
npm install
```

### 5. Run the Development Server
```bash
npm run dev
```

## 🏗️ Key Features

### Tournament Management
- **Individual Players**: Each tournament participant is a single player
- **Bracket Generation**: Automatic single elimination bracket creation
- **Seeding**: Players can be seeded for fair tournament brackets
- **Multiple Formats**: Support for different tournament types

### Game Scoring
- **Squash Rules**: Standard squash scoring (11 points per game)
- **Best of Series**: Configurable best of 3 or 5 games
- **Real-time Updates**: Live scoring with real-time synchronization
- **Game History**: Complete match history and statistics

### Court Booking
- **Venue Management**: Add and manage squash facilities
- **Court Availability**: Real-time court availability checking
- **Booking Types**: Singles, doubles, practice, lessons
- **Payment Integration**: Stripe integration for court bookings

### Player Statistics
- **Match Records**: Win/loss records for each player
- **Game Statistics**: Points won/lost, games won/lost
- **Tournament History**: Complete tournament participation history

## 📱 App Structure

### Main Navigation
- **Home**: Dashboard with recent activity
- **Friends**: Social features and friend management
- **Activity**: Tournament invitations and notifications
- **New**: Create new matches or tournaments
- **History**: Past matches and tournaments
- **Settings**: User account and preferences

### Game Modes
1. **Quick Match**: Fast setup for casual games between two players
2. **Tournament**: Create and manage full tournaments with brackets
3. **Book a Court**: Reserve squash courts at local venues

## 🔧 Customization Options

### Tournament Settings
- **Tournament Type**: Single elimination, double elimination, round robin
- **Games per Match**: Best of 3 or 5 games
- **Points per Game**: 9 or 11 points to win a game
- **Player Limit**: Maximum number of participants

### Venue Management
- **Court Information**: Number of courts, pricing, amenities
- **Operating Hours**: Flexible hours for each day of the week
- **Booking Rules**: Minimum/maximum booking duration, advance booking limits

## 🎨 Design System

The app maintains the same modern design language:
- **Dark Theme**: Sleek dark interface with gradient accents
- **Mobile-First**: Optimized for mobile devices
- **Glassmorphism**: Frosted glass effects and subtle transparency
- **Smooth Animations**: Lottie animations and smooth transitions

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 📊 Sample Data

The migration script includes sample squash venues:
- Downtown Squash Club (New York)
- Metro Sports Center (Los Angeles)
- Elite Squash Academy (Chicago)

## 🔄 Next Steps

1. **Test the App**: Create test tournaments and matches
2. **Add Real Venues**: Replace sample venues with actual squash facilities
3. **Customize Branding**: Update logos, colors, and app name
4. **Add Features**: Consider adding features like:
   - Player rankings
   - League management
   - Coaching services
   - Equipment rental
   - Social features

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure Supabase URL and keys are correct
2. **RLS Policies**: Check that Row Level Security policies are properly configured
3. **Authentication**: Verify Supabase Auth is enabled and configured
4. **Real-time**: Ensure real-time subscriptions are enabled in Supabase

### Support
- Check Supabase documentation for database issues
- Review Next.js documentation for frontend issues
- Check the original beer pong app for reference implementations

## 🎉 Congratulations!

You now have a fully functional squash tournament app! The transformation maintains all the robust features of the original app while adapting them perfectly for squash tournaments.
