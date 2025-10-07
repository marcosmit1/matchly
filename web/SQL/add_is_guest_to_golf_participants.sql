-- Add is_guest column to golf_tournament_participants table

ALTER TABLE public.golf_tournament_participants
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- Update the UNIQUE constraint to allow multiple guest players
-- (since they don't have user_ids, the unique constraint on tournament_id + user_id would block multiple guests)
ALTER TABLE public.golf_tournament_participants
DROP CONSTRAINT IF EXISTS golf_tournament_participants_tournament_id_user_id_key;

-- Add a new unique constraint that only applies when user_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS golf_participants_tournament_user_unique
ON public.golf_tournament_participants(tournament_id, user_id)
WHERE user_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.golf_tournament_participants.is_guest IS 'Whether this participant is a guest player (not a registered user)';
