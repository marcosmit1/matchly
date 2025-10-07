-- Debug tournament data access issues
-- Run this in your Supabase SQL editor

-- Check if tournament exists
SELECT 
    id, 
    name, 
    status, 
    created_by,
    created_at
FROM tournaments 
WHERE id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Check tournament players
SELECT 
    id,
    name,
    tournament_id,
    created_at
FROM tournament_players 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
ORDER BY created_at;

-- Check tournament matches
SELECT 
    id,
    tournament_id,
    round_id,
    court_number,
    player1_id,
    player2_id,
    player3_id,
    player4_id,
    status,
    player1_score,
    player2_score,
    player3_score,
    player4_score,
    created_at
FROM tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
ORDER BY created_at;

-- Check tournament rounds
SELECT 
    id,
    tournament_id,
    round_number,
    status,
    created_at
FROM tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
ORDER BY round_number;

-- Check current user
SELECT auth.uid() as current_user_id;

-- Check RLS policies on tournament_players
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tournament_players';

-- Check RLS policies on tournament_matches
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tournament_matches';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('tournament_players', 'tournament_matches', 'tournament_rounds', 'tournaments');
