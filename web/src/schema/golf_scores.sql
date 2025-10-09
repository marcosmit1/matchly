-- Create golf_scores table
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES golf_tournament_participants(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes INTEGER NOT NULL CHECK (strokes >= 1),
  putts INTEGER CHECK (putts >= 0),
  fairway_hit BOOLEAN DEFAULT false,
  green_in_regulation BOOLEAN DEFAULT false,
  bunker BOOLEAN DEFAULT false,
  water_hazard BOOLEAN DEFAULT false,
  penalties INTEGER DEFAULT 0,
  is_eagle BOOLEAN DEFAULT false,
  is_birdie BOOLEAN DEFAULT false,
  is_par BOOLEAN DEFAULT false,
  is_bogey BOOLEAN DEFAULT false,
  is_double_bogey_plus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, participant_id, hole_number)
);

-- Add RLS policies
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON golf_scores FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for tournament participants"
  ON golf_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM golf_tournament_participants gtp
      WHERE gtp.id = participant_id
      AND gtp.tournament_id = tournament_id
      AND (
        gtp.user_id = auth.uid() OR  -- User is the participant
        EXISTS (
          SELECT 1 FROM golf_tournaments gt
          WHERE gt.id = tournament_id
          AND gt.created_by = auth.uid() -- Or user is tournament creator
        )
      )
    )
  );

CREATE POLICY "Enable update for tournament participants"
  ON golf_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM golf_tournament_participants gtp
      WHERE gtp.id = participant_id
      AND gtp.tournament_id = tournament_id
      AND (
        gtp.user_id = auth.uid() OR  -- User is the participant
        EXISTS (
          SELECT 1 FROM golf_tournaments gt
          WHERE gt.id = tournament_id
          AND gt.created_by = auth.uid() -- Or user is tournament creator
        )
      )
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_golf_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_golf_scores_updated_at
  BEFORE UPDATE ON golf_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_golf_scores_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS golf_scores_tournament_id_idx ON golf_scores(tournament_id);
CREATE INDEX IF NOT EXISTS golf_scores_participant_id_idx ON golf_scores(participant_id);
CREATE INDEX IF NOT EXISTS golf_scores_created_at_idx ON golf_scores(created_at);
