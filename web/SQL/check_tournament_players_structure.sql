-- Check the structure of tournament_players table
-- Run this in your Supabase SQL editor

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournament_players'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists in tournament_players
SELECT * FROM public.tournament_players LIMIT 5;

-- Check if there are any players in your tournament
SELECT COUNT(*) as player_count
FROM public.tournament_players
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';
