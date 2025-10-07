-- Fix Tournament Public Access
-- Run this in your Supabase SQL editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view tournaments they created or participate in" ON public.tournaments;

-- Create new policy that allows public access to open tournaments
CREATE POLICY "Public can view open tournaments" ON public.tournaments
    FOR SELECT USING (
        status = 'open' OR created_by = auth.uid()
    );

-- Also fix the tournament_players policy to allow viewing players in public tournaments
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;

CREATE POLICY "Public can view tournament players" ON public.tournament_players
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE status = 'open' OR created_by = auth.uid()
        )
    );

-- Test the fix
SELECT 'Tournament public access fixed' as status;
