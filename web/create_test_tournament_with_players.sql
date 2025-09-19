-- Create Test Tournament with 20 Players
-- Run this in your Supabase SQL editor

-- Create a test tournament
INSERT INTO public.tournaments (
    name, 
    description, 
    sport, 
    max_players, 
    current_players, 
    start_date, 
    location, 
    number_of_courts, 
    tournament_type, 
    points_to_win, 
    status, 
    created_by
)
VALUES (
    'Test Padel Tournament',
    'A test tournament with 20 players for testing the Mexicano format',
    'padel',
    20,
    0,
    CURRENT_DATE + INTERVAL '1 day',
    'Test Sports Center',
    4,
    'mexicano',
    21,
    'open',
    (SELECT id FROM auth.users LIMIT 1)
)
RETURNING id;

-- Get the tournament ID and add 20 players
WITH tournament_info AS (
    SELECT id, created_by 
    FROM public.tournaments 
    WHERE name = 'Test Padel Tournament'
    ORDER BY created_at DESC 
    LIMIT 1
)
INSERT INTO public.tournament_players (tournament_id, name, email, phone, created_by)
SELECT 
    ti.id as tournament_id,
    'Player ' || generate_series(1, 20) as name,
    'player' || generate_series(1, 20) || '@test.com' as email,
    '+123456789' || LPAD(generate_series(1, 20)::text, 2, '0') as phone,
    ti.created_by
FROM tournament_info ti;

-- Update the tournament's current_players count
UPDATE public.tournaments 
SET current_players = 20
WHERE id = (
    SELECT id 
    FROM public.tournaments 
    WHERE name = 'Test Padel Tournament'
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Show the created tournament
SELECT 
    t.id,
    t.name,
    t.description,
    t.sport,
    t.current_players,
    t.max_players,
    t.number_of_courts,
    t.tournament_type,
    t.points_to_win,
    t.status,
    t.start_date,
    t.location
FROM public.tournaments t
WHERE t.name = 'Test Padel Tournament'
ORDER BY t.created_at DESC 
LIMIT 1;

-- Show the added players
SELECT 
    tp.name,
    tp.email,
    tp.phone
FROM public.tournament_players tp
JOIN public.tournaments t ON tp.tournament_id = t.id
WHERE t.name = 'Test Padel Tournament'
ORDER BY tp.name;
