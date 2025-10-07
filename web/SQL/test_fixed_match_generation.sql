-- Test the fixed match generation function
-- Run this in your Supabase SQL editor

-- First, let's clean up any existing matches and rounds
DELETE FROM public.tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

DELETE FROM public.tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Test the fixed function
SELECT public.generate_round_matches('05138795-471e-4680-8ad8-33f87a029f5c', 1);

-- Check the results
SELECT 
    tm.court_number,
    tm.player1_id,
    tm.player2_id,
    tm.player3_id,
    tm.player4_id,
    tm.status
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1
ORDER BY tm.court_number;

-- Verify no duplicate players
SELECT 
    tr.round_number,
    tm.player1_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player1_id
HAVING COUNT(*) > 1;
