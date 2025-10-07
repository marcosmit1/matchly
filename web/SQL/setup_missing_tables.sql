-- Setup Missing Tables for League System
-- Run this in your Supabase SQL editor

-- 1. League Matches Table
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

-- 2. League Box Standings Table
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

-- 3. League Promotion History Table
CREATE TABLE IF NOT EXISTS league_promotion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_box_id UUID REFERENCES league_boxes(id) ON DELETE SET NULL,
    to_box_id UUID REFERENCES league_boxes(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('promotion', 'relegation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_matches_league_id ON league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_box_id ON league_matches(box_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_player1_id ON league_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_player2_id ON league_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_status ON league_matches(status);

CREATE INDEX IF NOT EXISTS idx_league_box_standings_league_id ON league_box_standings(league_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_box_id ON league_box_standings(box_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_user_id ON league_box_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_points ON league_box_standings(points DESC);

CREATE INDEX IF NOT EXISTS idx_league_promotion_history_league_id ON league_promotion_history(league_id);
CREATE INDEX IF NOT EXISTS idx_league_promotion_history_user_id ON league_promotion_history(user_id);

-- RLS Policies for league_matches
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "League creators can insert matches" ON league_matches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

CREATE POLICY "League creators can delete matches" ON league_matches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- RLS Policies for league_box_standings
ALTER TABLE league_box_standings ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "System can manage standings" ON league_box_standings
    FOR ALL USING (true);

-- RLS Policies for league_promotion_history
ALTER TABLE league_promotion_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotion history for their leagues" ON league_promotion_history
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM league_participants 
            WHERE league_participants.league_id = league_promotion_history.league_id 
            AND league_participants.user_id = auth.uid()
            AND league_participants.status = 'confirmed'
        ) OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_promotion_history.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

CREATE POLICY "System can manage promotion history" ON league_promotion_history
    FOR ALL USING (true);

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_league_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_league_box_standings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER trigger_update_league_matches_updated_at
    BEFORE UPDATE ON league_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_league_matches_updated_at();

CREATE TRIGGER trigger_update_league_box_standings_updated_at
    BEFORE UPDATE ON league_box_standings
    FOR EACH ROW
    EXECUTE FUNCTION update_league_box_standings_updated_at();

-- Function to initialize standings when a player is assigned to a box
CREATE OR REPLACE FUNCTION initialize_player_standings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO league_box_standings (league_id, box_id, user_id)
    VALUES (NEW.league_id, NEW.box_id, NEW.user_id)
    ON CONFLICT (league_id, box_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize standings when player is assigned to box
CREATE TRIGGER trigger_initialize_player_standings
    AFTER INSERT ON league_box_assignments
    FOR EACH ROW
    EXECUTE FUNCTION initialize_player_standings();
