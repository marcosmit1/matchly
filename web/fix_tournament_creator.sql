-- Fix Tournament Creator ID
-- Run this in your Supabase SQL editor to make you the creator of the test tournament

-- Update the tournament to be created by your current user ID
UPDATE public.tournaments
SET created_by = '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff'
WHERE id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Verify the update
SELECT 
    id,
    name,
    created_by,
    status
FROM public.tournaments
WHERE id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Also update the tournament players to be created by you
UPDATE public.tournament_players
SET created_by = '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff'
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

SELECT 'Tournament creator updated successfully' as status;
