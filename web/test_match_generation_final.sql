-- Final test of the match generation function
-- Run this in your Supabase SQL editor

-- Clean up existing data
DELETE FROM public.tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

DELETE FROM public.tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Test the function with correct status
SELECT public.generate_round_matches('05138795-471e-4680-8ad8-33f87a029f5c', 1);

-- Verify matches were created with correct status
SELECT 
    tm.court_number,
    tm.status,
    COUNT(*) as match_count
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1
GROUP BY tm.court_number, tm.status
ORDER BY tm.court_number;

-- Check total matches created
SELECT COUNT(*) as total_matches
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1;
