-- Fix league_participants table to allow NULL user_id for guest players
-- Run this in your Supabase SQL editor

-- Make user_id nullable in league_participants
ALTER TABLE public.league_participants
ALTER COLUMN user_id DROP NOT NULL;

-- Add or update constraint to ensure either user_id OR guest_player_id is set
ALTER TABLE public.league_participants
DROP CONSTRAINT IF EXISTS check_league_participant_type;

ALTER TABLE public.league_participants
ADD CONSTRAINT check_league_participant_type CHECK (
    (user_id IS NOT NULL AND guest_player_id IS NULL) OR
    (user_id IS NULL AND guest_player_id IS NOT NULL)
);

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'league_participants'
  AND table_schema = 'public'
  AND column_name IN ('user_id', 'guest_player_id')
ORDER BY column_name;