-- Clean up and regenerate tournament matches with proper logic
-- Run this in your Supabase SQL editor

-- First, let's see what matches currently exist
SELECT 
    tm.id,
    tm.court_number,
    tm.player1_id,
    tm.player2_id,
    tm.player3_id,
    tm.player4_id,
    tm.status
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'  -- Replace with your tournament ID
ORDER BY tm.court_number;

-- Check for duplicate players in the same round
SELECT 
    tr.round_number,
    tm.player1_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player1_id
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    tr.round_number,
    tm.player2_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player2_id
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    tr.round_number,
    tm.player3_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player3_id
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    tr.round_number,
    tm.player4_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player4_id
HAVING COUNT(*) > 1;

-- Delete all existing matches for this tournament
DELETE FROM public.tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Delete all existing rounds for this tournament
DELETE FROM public.tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Regenerate Round 1 with proper logic
SELECT public.generate_round_matches('05138795-471e-4680-8ad8-33f87a029f5c', 1);

-- Verify the new matches don't have duplicate players
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

-- Check for any remaining duplicates (should return empty)
SELECT 
    tr.round_number,
    tm.player1_id as player_id,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
GROUP BY tr.round_number, tm.player1_id
HAVING COUNT(*) > 1;
