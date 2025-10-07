-- Add bunker and penalties columns to golf_scores table
-- This allows tracking bunker shots and penalty strokes directly on each hole score

ALTER TABLE public.golf_scores
ADD COLUMN IF NOT EXISTS bunker BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS penalties INTEGER DEFAULT 0 CHECK (penalties >= 0 AND penalties <= 5);

COMMENT ON COLUMN public.golf_scores.bunker IS 'Whether the player hit from a bunker on this hole';
COMMENT ON COLUMN public.golf_scores.penalties IS 'Number of penalty strokes incurred on this hole';
