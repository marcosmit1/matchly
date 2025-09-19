-- Add 20 Random Test Players to Most Recent Tournament
-- Run this in your Supabase SQL editor after creating a tournament

-- Add 20 random test players to the most recently created tournament
WITH latest_tournament AS (
    SELECT id, created_by 
    FROM public.tournaments 
    ORDER BY created_at DESC 
    LIMIT 1
)
INSERT INTO public.tournament_players (tournament_id, name, email, phone, created_by)
SELECT 
    lt.id as tournament_id,
    'Player ' || generate_series(1, 20) as name,
    'player' || generate_series(1, 20) || '@test.com' as email,
    '+123456789' || LPAD(generate_series(1, 20)::text, 2, '0') as phone,
    lt.created_by
FROM latest_tournament lt;

-- Update the tournament's current_players count
WITH latest_tournament AS (
    SELECT id 
    FROM public.tournaments 
    ORDER BY created_at DESC 
    LIMIT 1
)
UPDATE public.tournaments 
SET current_players = (
    SELECT COUNT(*) 
    FROM public.tournament_players 
    WHERE tournament_id = (SELECT id FROM latest_tournament)
)
WHERE id = (SELECT id FROM latest_tournament);

-- Show the results
SELECT 
    t.name as tournament_name,
    t.current_players,
    t.max_players,
    t.tournament_type,
    t.number_of_courts
FROM public.tournaments t
ORDER BY t.created_at DESC 
LIMIT 1;

-- Show the added players
WITH latest_tournament AS (
    SELECT id 
    FROM public.tournaments 
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    tp.name,
    tp.email,
    tp.phone
FROM public.tournament_players tp
WHERE tp.tournament_id = (SELECT id FROM latest_tournament)
ORDER BY tp.name;
