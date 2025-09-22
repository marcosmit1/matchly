-- Restore the original working RLS policy and just add participant visibility
-- Run this in your Supabase SQL editor

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view participants for leagues they're in" ON league_participants;

-- Restore the original policy with one small addition
CREATE POLICY "Users can view participants for leagues they're in" ON league_participants
    FOR SELECT USING (
        -- Users can see their own participation record (original)
        auth.uid() = user_id OR
        -- League creators can see all participants in their leagues (original)
        EXISTS (
            SELECT 1 FROM leagues
            WHERE leagues.id = league_participants.league_id
            AND leagues.created_by = auth.uid()
        ) OR
        -- NEW: If user is a participant in this league, they can see other participants
        EXISTS (
            SELECT 1 FROM league_participants AS my_participation
            WHERE my_participation.league_id = league_participants.league_id
            AND my_participation.user_id = auth.uid()
        )
    );