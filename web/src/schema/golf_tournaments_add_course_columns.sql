-- Add columns for storing course and tee box selection
ALTER TABLE golf_tournaments
ADD COLUMN IF NOT EXISTS cached_course_id UUID REFERENCES golf_courses(id),
ADD COLUMN IF NOT EXISTS selected_tee_box VARCHAR(50);

-- Add comment explaining the columns
COMMENT ON COLUMN golf_tournaments.cached_course_id IS 'Reference to the golf_courses table for the selected course';
COMMENT ON COLUMN golf_tournaments.selected_tee_box IS 'Name of the selected tee box for this tournament';
