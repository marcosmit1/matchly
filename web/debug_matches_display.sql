-- Debug why matches aren't displaying
-- Run this in your Supabase SQL editor

-- Check if matches exist
SELECT 
    tm.id,
    tm.court_number,
    tm.player1_id,
    tm.player2_id,
    tm.player3_id,
    tm.player4_id,
    tm.status,
    tr.round_number
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
ORDER BY tm.court_number;

-- Check if foreign key constraints exist
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.tournament_matches'::regclass
AND contype = 'f';

-- Test the foreign key relationship manually
SELECT 
    tm.id,
    tm.court_number,
    tp1.name as player1_name,
    tp2.name as player2_name,
    tp3.name as player3_name,
    tp4.name as player4_name,
    tm.status
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
LEFT JOIN public.tournament_players tp1 ON tm.player1_id = tp1.id
LEFT JOIN public.tournament_players tp2 ON tm.player2_id = tp2.id
LEFT JOIN public.tournament_players tp3 ON tm.player3_id = tp3.id
LEFT JOIN public.tournament_players tp4 ON tm.player4_id = tp4.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
ORDER BY tm.court_number;
