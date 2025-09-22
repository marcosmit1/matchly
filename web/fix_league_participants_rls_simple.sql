-- Fix broken RLS policy for league_participants - make it simpler and working
-- Run this in your Supabase SQL editor

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view participants for leagues they're in" ON league_participants;

-- Create a much simpler policy that actually works
CREATE POLICY "Users can view participants for leagues they're in" ON league_participants
    FOR SELECT USING (
        -- League creators can see all participants in their leagues
        EXISTS (
            SELECT 1 FROM leagues
            WHERE leagues.id = league_participants.league_id
            AND leagues.created_by = auth.uid()
        ) OR
        -- ANY user who is a participant in the league can see all participants in that league
        league_participants.league_id IN (
            SELECT league_id FROM league_participants
            WHERE user_id = auth.uid()
        )
    );