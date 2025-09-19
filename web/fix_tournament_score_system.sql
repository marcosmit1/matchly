-- Comprehensive Fix for Tournament Score System
-- Run this in your Supabase SQL editor to fix all score-related issues

-- 1. Fix tournament_matches schema
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player1_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player2_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player3_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player4_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Fix RLS policies for tournament_matches
DROP POLICY IF EXISTS "Users can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can insert tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can update tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Users can delete tournament matches" ON public.tournament_matches;

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

-- 3. Fix RLS policies for tournament_rounds
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

-- 4. Check current tournament_matches structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tournament_matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test query to see if we can access tournament matches
SELECT 
    tm.id,
    tm.tournament_id,
    tm.court_number,
    tm.status,
    tm.player1_score,
    tm.player2_score,
    tm.player3_score,
    tm.player4_score
FROM public.tournament_matches tm
JOIN public.tournaments t ON tm.tournament_id = t.id
WHERE t.id = '05138795-471e-4680-8ad8-33f87a029f5c'
LIMIT 5;

SELECT 'Tournament score system fixed successfully' as status;
