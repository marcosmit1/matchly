-- Add water_hazard column to golf_scores table
ALTER TABLE golf_scores
ADD COLUMN IF NOT EXISTS water_hazard BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN golf_scores.water_hazard IS 'Indicates if the player hit their ball into a water hazard on this hole';
