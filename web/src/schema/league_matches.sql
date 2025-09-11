-- League Matches Table
CREATE TABLE IF NOT EXISTS league_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    box_id UUID NOT NULL REFERENCES league_boxes(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player1_username TEXT NOT NULL,
    player2_username TEXT NOT NULL,
    player1_score INTEGER DEFAULT NULL,
    player2_score INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_matches_league_id ON league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_box_id ON league_matches(box_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_player1_id ON league_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_player2_id ON league_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_status ON league_matches(status);

-- RLS Policies
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches they are involved in
CREATE POLICY "Users can view their own matches" ON league_matches
    FOR SELECT USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Users can update matches they are involved in
CREATE POLICY "Users can update their own matches" ON league_matches
    FOR UPDATE USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Only league creators can insert matches
CREATE POLICY "League creators can insert matches" ON league_matches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Only league creators can delete matches
CREATE POLICY "League creators can delete matches" ON league_matches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_league_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_league_matches_updated_at
    BEFORE UPDATE ON league_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_league_matches_updated_at();
