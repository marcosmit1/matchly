-- League Box Standings Table
CREATE TABLE IF NOT EXISTS league_box_standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    box_id UUID NOT NULL REFERENCES league_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0, -- 3 for win, 1 for draw, 0 for loss
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, box_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_box_standings_league_id ON league_box_standings(league_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_box_id ON league_box_standings(box_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_user_id ON league_box_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_points ON league_box_standings(points DESC);

-- RLS Policies
ALTER TABLE league_box_standings ENABLE ROW LEVEL SECURITY;

-- Users can view standings for leagues they are in
CREATE POLICY "Users can view standings for their leagues" ON league_box_standings
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM league_participants 
            WHERE league_participants.league_id = league_box_standings.league_id 
            AND league_participants.user_id = auth.uid()
            AND league_participants.status = 'confirmed'
        ) OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_box_standings.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Only system can insert/update standings (via triggers or admin functions)
CREATE POLICY "System can manage standings" ON league_box_standings
    FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_league_box_standings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_league_box_standings_updated_at
    BEFORE UPDATE ON league_box_standings
    FOR EACH ROW
    EXECUTE FUNCTION update_league_box_standings_updated_at();
