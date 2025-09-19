-- Clean up duplicate matches and fix the tournament
-- Run this in your Supabase SQL editor

-- First, let's see how many matches we have
SELECT 
    COUNT(*) as total_matches,
    COUNT(DISTINCT tm.player1_id) as unique_players_team1,
    COUNT(DISTINCT tm.player2_id) as unique_players_team2,
    COUNT(DISTINCT tm.player3_id) as unique_players_team3,
    COUNT(DISTINCT tm.player4_id) as unique_players_team4
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Check the tournament's number of courts
SELECT 
    name,
    number_of_courts,
    current_players
FROM public.tournaments
WHERE id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Delete all existing matches and rounds
DELETE FROM public.tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

DELETE FROM public.tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Generate the correct number of matches (should be 5 matches for 20 players on 4 courts)
SELECT public.generate_round_matches('05138795-471e-4680-8ad8-33f87a029f5c', 1);

-- Verify the correct number of matches were created
SELECT 
    COUNT(*) as matches_created,
    'Should be 5 matches for 20 players' as expected
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1;

-- Show the matches with court numbers
SELECT 
    tm.court_number,
    tm.status,
    'Court ' || tm.court_number as court_name
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1
ORDER BY tm.court_number;
