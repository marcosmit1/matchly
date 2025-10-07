-- Add 20 Random Test Players to Tournament
-- Run this in your Supabase SQL editor after creating a tournament

-- First, let's see what tournaments exist
SELECT id, name, status, current_players, max_players 
FROM public.tournaments 
ORDER BY created_at DESC 
LIMIT 5;

-- Replace 'YOUR_TOURNAMENT_ID_HERE' with the actual tournament ID from the query above
-- You can get this by running the SELECT query above first

-- Add 20 random test players
INSERT INTO public.tournament_players (tournament_id, name, email, phone, created_by)
SELECT 
    'YOUR_TOURNAMENT_ID_HERE'::UUID as tournament_id,
    'Player ' || generate_series(1, 20) as name,
    'player' || generate_series(1, 20) || '@test.com' as email,
    '+123456789' || LPAD(generate_series(1, 20)::text, 2, '0') as phone,
    (SELECT id FROM auth.users LIMIT 1) as created_by;

-- Update the tournament's current_players count
UPDATE public.tournaments 
SET current_players = (
    SELECT COUNT(*) 
    FROM public.tournament_players 
    WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE'::UUID
)
WHERE id = 'YOUR_TOURNAMENT_ID_HERE'::UUID;

-- Verify the players were added
SELECT 
    t.name as tournament_name,
    t.current_players,
    t.max_players,
    COUNT(tp.id) as actual_players
FROM public.tournaments t
LEFT JOIN public.tournament_players tp ON t.id = tp.tournament_id
WHERE t.id = 'YOUR_TOURNAMENT_ID_HERE'::UUID
GROUP BY t.id, t.name, t.current_players, t.max_players;

-- Show the added players
SELECT 
    tp.name,
    tp.email,
    tp.phone
FROM public.tournament_players tp
WHERE tp.tournament_id = 'YOUR_TOURNAMENT_ID_HERE'::UUID
ORDER BY tp.name;
