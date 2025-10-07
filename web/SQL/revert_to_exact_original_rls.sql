-- Completely revert to the exact original working RLS policy
-- Run this in your Supabase SQL editor

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view participants for leagues they're in" ON league_participants;

-- Restore the EXACT original policy from setup_league_system_safe.sql (lines 179-187)
CREATE POLICY "Users can view participants for leagues they're in" ON league_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM leagues
            WHERE leagues.id = league_participants.league_id
            AND leagues.created_by = auth.uid()
        )
    );