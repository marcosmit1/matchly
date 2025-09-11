-- Fix RLS policies to allow all users to see public leagues
-- Run this in your Supabase SQL editor

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view participants for leagues they're in" ON league_participants;
DROP POLICY IF EXISTS "Users can view league participants" ON league_participants;

-- Create more permissive policies for viewing leagues and participants
-- This allows all authenticated users to see public leagues and their participants

-- Leagues: Allow all users to view all leagues (public discovery)
DROP POLICY IF EXISTS "Users can view public leagues" ON leagues;
DROP POLICY IF EXISTS "Users can view all leagues" ON leagues;

CREATE POLICY "Users can view all leagues" ON leagues
    FOR SELECT USING (true);

-- League participants: Allow all users to view participants for public leagues
CREATE POLICY "Users can view league participants" ON league_participants
    FOR SELECT USING (true);

-- League boxes: Allow all users to view boxes for public leagues
DROP POLICY IF EXISTS "Users can view boxes for leagues they're in" ON league_boxes;
DROP POLICY IF EXISTS "Users can view league boxes" ON league_boxes;

CREATE POLICY "Users can view league boxes" ON league_boxes
    FOR SELECT USING (true);

-- Box assignments: Allow all users to view assignments for public leagues
DROP POLICY IF EXISTS "Users can view assignments for leagues they're in" ON league_box_assignments;
DROP POLICY IF EXISTS "Users can view box assignments" ON league_box_assignments;

CREATE POLICY "Users can view box assignments" ON league_box_assignments
    FOR SELECT USING (true);

-- League matches: Allow all users to view matches for public leagues
DROP POLICY IF EXISTS "Users can view matches for leagues they're in" ON league_matches;
DROP POLICY IF EXISTS "Users can view league matches" ON league_matches;

CREATE POLICY "Users can view league matches" ON league_matches
    FOR SELECT USING (true);

-- Box standings: Allow all users to view standings for public leagues
DROP POLICY IF EXISTS "Users can view standings for leagues they're in" ON league_box_standings;
DROP POLICY IF EXISTS "Users can view box standings" ON league_box_standings;

CREATE POLICY "Users can view box standings" ON league_box_standings
    FOR SELECT USING (true);

-- Promotion history: Allow all users to view promotion history for public leagues
DROP POLICY IF EXISTS "Users can view promotion history for leagues they're in" ON league_promotion_history;
DROP POLICY IF EXISTS "Users can view promotion history" ON league_promotion_history;

CREATE POLICY "Users can view promotion history" ON league_promotion_history
    FOR SELECT USING (true);

-- Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('leagues', 'league_participants', 'league_boxes', 'league_box_assignments', 'league_matches', 'league_box_standings', 'league_promotion_history')
ORDER BY tablename, policyname;
