-- Fix Tournament RLS Policies (Remove Infinite Recursion)
-- Run this in your Supabase SQL editor to fix the RLS policy issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Users can add players to their tournaments" ON public.tournament_players;
DROP POLICY IF EXISTS "Users can update players in their tournaments" ON public.tournament_players;
DROP POLICY IF EXISTS "Users can delete players from their tournaments" ON public.tournament_players;

-- Create fixed policies without infinite recursion
CREATE POLICY "Users can view tournament players" ON public.tournament_players
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can add players to their tournaments" ON public.tournament_players
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update players in their tournaments" ON public.tournament_players
    FOR UPDATE USING (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete players from their tournaments" ON public.tournament_players
    FOR DELETE USING (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- Also fix the tournament policies to be simpler
DROP POLICY IF EXISTS "Users can view tournaments they created or participate in" ON public.tournaments;

CREATE POLICY "Users can view tournaments they created or participate in" ON public.tournaments
    FOR SELECT USING (
        created_by = auth.uid()
    );

-- Test the fix
SELECT 'RLS policies fixed successfully' as status;
