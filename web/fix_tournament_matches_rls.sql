-- Fix Tournament Matches RLS Policies
-- Run this in your Supabase SQL editor to fix the score update permissions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can insert tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can update tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can delete tournament matches" ON public.tournament_matches;

-- Create new policies that allow tournament creators to manage matches
CREATE POLICY "Users can view tournament matches" ON public.tournament_matches
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert tournament matches" ON public.tournament_matches
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update tournament matches" ON public.tournament_matches
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete tournament matches" ON public.tournament_matches
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- Also fix tournament_rounds policies
DROP POLICY IF EXISTS "Users can view tournament rounds" ON public.tournament_rounds;
DROP POLICY IF EXISTS "Users can insert tournament rounds" ON public.tournament_rounds;
DROP POLICY IF EXISTS "Users can update tournament rounds" ON public.tournament_rounds;
DROP POLICY IF EXISTS "Users can delete tournament rounds" ON public.tournament_rounds;

CREATE POLICY "Users can view tournament rounds" ON public.tournament_rounds
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert tournament rounds" ON public.tournament_rounds
    FOR INSERT WITH CHECK (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update tournament rounds" ON public.tournament_rounds
    FOR UPDATE USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete tournament rounds" ON public.tournament_rounds
    FOR DELETE USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- Test the fix
SELECT 'Tournament matches RLS policies fixed successfully' as status;
