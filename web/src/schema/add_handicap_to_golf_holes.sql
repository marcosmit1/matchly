-- Add handicap column to golf_holes table (tournament-specific holes)
-- This allows tournaments to store handicap/stroke index for each hole

ALTER TABLE golf_holes ADD COLUMN IF NOT EXISTS handicap INTEGER;

COMMENT ON COLUMN golf_holes.handicap IS 'Stroke index for the hole (1-18, where 1 is hardest)';
