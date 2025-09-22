-- Fix RLS policy for league_participants to allow participants to see each other
-- Run this in your Supabase SQL editor

-- Drop and recreate the policy for viewing league participants
DROP POLICY IF EXISTS "Users can view participants for leagues they're in" ON league_participants;

CREATE POLICY "Users can view participants for leagues they're in" ON league_participants
    FOR SELECT USING (
        -- Users can see their own participation record
        auth.uid() = user_id OR
        -- League creators can see all participants in their leagues
        EXISTS (
            SELECT 1 FROM leagues
            WHERE leagues.id = league_participants.league_id
            AND leagues.created_by = auth.uid()
        ) OR
        -- Confirmed participants can see all other participants in the same league
        EXISTS (
            SELECT 1 FROM league_participants AS my_participation
            WHERE my_participation.league_id = league_participants.league_id
            AND my_participation.user_id = auth.uid()
            AND my_participation.status = 'confirmed'
        )
    );