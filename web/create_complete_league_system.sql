-- Complete League System Setup
-- Run this in your Supabase SQL editor to create the entire league system

-- 1. Create the main leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sport TEXT NOT NULL DEFAULT 'squash',
    max_players INTEGER NOT NULL DEFAULT 8,
    current_players INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'started', 'completed', 'cancelled')),
    invite_code TEXT UNIQUE NOT NULL,
    invite_link TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create league_participants table
CREATE TABLE IF NOT EXISTS league_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- 3. Create league_boxes table
CREATE TABLE IF NOT EXISTS league_boxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    name TEXT NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, level)
);

-- 4. Create league_box_assignments table
CREATE TABLE IF NOT EXISTS league_box_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    box_id UUID NOT NULL REFERENCES league_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, box_id, user_id)
);

-- 5. Create league_matches table
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

-- 6. Create league_box_standings table
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
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, box_id, user_id)
);

-- 7. Create league_promotion_history table
CREATE TABLE IF NOT EXISTS league_promotion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_box_id UUID REFERENCES league_boxes(id) ON DELETE SET NULL,
    to_box_id UUID REFERENCES league_boxes(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('promotion', 'relegation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leagues_created_by ON leagues(created_by);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_sport ON leagues(sport);
CREATE INDEX IF NOT EXISTS idx_leagues_invite_code ON leagues(invite_code);

CREATE INDEX IF NOT EXISTS idx_league_participants_league_id ON league_participants(league_id);
CREATE INDEX IF NOT EXISTS idx_league_participants_user_id ON league_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_league_participants_status ON league_participants(status);

CREATE INDEX IF NOT EXISTS idx_league_boxes_league_id ON league_boxes(league_id);
CREATE INDEX IF NOT EXISTS idx_league_boxes_level ON league_boxes(level);

CREATE INDEX IF NOT EXISTS idx_league_box_assignments_league_id ON league_box_assignments(league_id);
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_box_id ON league_box_assignments(box_id);
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_user_id ON league_box_assignments(user_id);

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

-- Enable RLS on all tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_box_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_box_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_promotion_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leagues
CREATE POLICY "Users can view public leagues" ON leagues
    FOR SELECT USING (true);

CREATE POLICY "Users can create leagues" ON leagues
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creators can update their leagues" ON leagues
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "League creators can delete their leagues" ON leagues
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for league_participants
CREATE POLICY "Users can view participants for leagues they're in" ON league_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_participants.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can join leagues" ON league_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON league_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for league_boxes
CREATE POLICY "Users can view boxes for leagues they're in" ON league_boxes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM league_participants 
            WHERE league_participants.league_id = league_boxes.league_id 
            AND league_participants.user_id = auth.uid()
            AND league_participants.status = 'confirmed'
        ) OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_boxes.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

CREATE POLICY "League creators can manage boxes" ON league_boxes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_boxes.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- RLS Policies for league_box_assignments
CREATE POLICY "Users can view assignments for leagues they're in" ON league_box_assignments
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM league_participants 
            WHERE league_participants.league_id = league_box_assignments.league_id 
            AND league_participants.user_id = auth.uid()
            AND league_participants.status = 'confirmed'
        ) OR
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_box_assignments.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

CREATE POLICY "League creators can manage assignments" ON league_box_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_box_assignments.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- RLS Policies for league_matches
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

CREATE POLICY "League creators can manage matches" ON league_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = league_matches.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- RLS Policies for league_box_standings
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

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_leagues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION initialize_player_standings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO league_box_standings (league_id, box_id, user_id)
    VALUES (NEW.league_id, NEW.box_id, NEW.user_id)
    ON CONFLICT (league_id, box_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_leagues_updated_at
    BEFORE UPDATE ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION update_leagues_updated_at();

CREATE TRIGGER trigger_update_league_matches_updated_at
    BEFORE UPDATE ON league_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_league_matches_updated_at();

CREATE TRIGGER trigger_update_league_box_standings_updated_at
    BEFORE UPDATE ON league_box_standings
    FOR EACH ROW
    EXECUTE FUNCTION update_league_box_standings_updated_at();

CREATE TRIGGER trigger_initialize_player_standings
    AFTER INSERT ON league_box_assignments
    FOR EACH ROW
    EXECUTE FUNCTION initialize_player_standings();

-- Create the create_league function
CREATE OR REPLACE FUNCTION create_league(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_sport TEXT DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_entry_fee DECIMAL(10,2) DEFAULT 0,
    p_prize_pool DECIMAL(10,2) DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_league_id UUID;
    v_invite_code TEXT;
    v_invite_link TEXT;
    v_creator_id UUID;
BEGIN
    -- Get current user
    v_creator_id := auth.uid();
    
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Generate unique invite code
    v_invite_code := substring(md5(random()::text) from 1 for 8);
    
    -- Create invite link
    v_invite_link := 'https://tournamator.app/join/' || v_invite_code;
    
    -- Insert league
    INSERT INTO leagues (
        name, description, sport, max_players, start_date, 
        location, entry_fee, prize_pool, invite_code, invite_link, created_by
    ) VALUES (
        p_name, p_description, p_sport, p_max_players, p_start_date,
        p_location, p_entry_fee, p_prize_pool, v_invite_code, v_invite_link, v_creator_id
    ) RETURNING id INTO v_league_id;
    
    -- Add creator as confirmed participant
    INSERT INTO league_participants (league_id, user_id, status)
    VALUES (v_league_id, v_creator_id, 'confirmed');
    
    -- Update current_players count
    UPDATE leagues SET current_players = 1 WHERE id = v_league_id;
    
    RETURN json_build_object(
        'id', v_league_id,
        'invite_code', v_invite_code,
        'invite_link', v_invite_link
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the start_league function
CREATE OR REPLACE FUNCTION start_league(p_league_id UUID)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_participant_count INTEGER;
    v_boxes_needed INTEGER;
    v_box_id UUID;
    v_participant RECORD;
    v_box_level INTEGER;
    v_box_name TEXT;
    v_participants_per_box INTEGER;
    v_remaining_participants INTEGER;
    v_current_box_participants INTEGER;
BEGIN
    -- Get league details
    SELECT * INTO v_league FROM leagues WHERE id = p_league_id;
    
    IF v_league IS NULL THEN
        RAISE EXCEPTION 'League not found';
    END IF;
    
    IF v_league.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only league creator can start the league';
    END IF;
    
    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'League is not open for starting';
    END IF;
    
    -- Count confirmed participants
    SELECT COUNT(*) INTO v_participant_count 
    FROM league_participants 
    WHERE league_id = p_league_id AND status = 'confirmed';
    
    IF v_participant_count < 4 THEN
        RAISE EXCEPTION 'League needs at least 4 players to start';
    END IF;
    
    -- Calculate boxes needed (4-5 players per box)
    v_boxes_needed := CEIL(v_participant_count::DECIMAL / 5);
    v_participants_per_box := CEIL(v_participant_count::DECIMAL / v_boxes_needed);
    
    -- Create boxes
    FOR v_box_level IN 1..v_boxes_needed LOOP
        v_box_name := CASE 
            WHEN v_box_level = 1 THEN 'Championship Box'
            WHEN v_box_level = 2 THEN 'Premier Box'
            ELSE 'Division ' || (v_box_level - 2) || ' Box'
        END;
        
        INSERT INTO league_boxes (league_id, level, name, max_players)
        VALUES (p_league_id, v_box_level, v_box_name, v_participants_per_box)
        RETURNING id INTO v_box_id;
    END LOOP;
    
    -- Assign participants to boxes randomly
    v_remaining_participants := v_participant_count;
    v_current_box_participants := 0;
    v_box_level := 1;
    
    FOR v_participant IN 
        SELECT user_id FROM league_participants 
        WHERE league_id = p_league_id AND status = 'confirmed'
        ORDER BY RANDOM()
    LOOP
        -- Get current box ID
        SELECT id INTO v_box_id FROM league_boxes 
        WHERE league_id = p_league_id AND level = v_box_level;
        
        -- Assign participant to current box
        INSERT INTO league_box_assignments (league_id, box_id, user_id)
        VALUES (p_league_id, v_box_id, v_participant.user_id);
        
        v_current_box_participants := v_current_box_participants + 1;
        v_remaining_participants := v_remaining_participants - 1;
        
        -- Move to next box if current box is full or we're out of participants
        IF v_current_box_participants >= v_participants_per_box OR v_remaining_participants = 0 THEN
            v_box_level := v_box_level + 1;
            v_current_box_participants := 0;
        END IF;
    END LOOP;
    
    -- Update league status
    UPDATE leagues SET status = 'started' WHERE id = p_league_id;
    
    RETURN json_build_object(
        'message', 'League started successfully',
        'boxes_created', v_boxes_needed,
        'participants_assigned', v_participant_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the start_league_test function (bypasses participant count check)
CREATE OR REPLACE FUNCTION start_league_test(p_league_id UUID)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_boxes_needed INTEGER;
    v_box_id UUID;
    v_box_level INTEGER;
    v_box_name TEXT;
BEGIN
    -- Get league details
    SELECT * INTO v_league FROM leagues WHERE id = p_league_id;
    
    IF v_league IS NULL THEN
        RAISE EXCEPTION 'League not found';
    END IF;
    
    IF v_league.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only league creator can start the league';
    END IF;
    
    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'League is not open for starting';
    END IF;
    
    -- Create 4 boxes for testing (Championship, Premier, Division 1, Division 2)
    FOR v_box_level IN 1..4 LOOP
        v_box_name := CASE 
            WHEN v_box_level = 1 THEN 'Championship Box'
            WHEN v_box_level = 2 THEN 'Premier Box'
            WHEN v_box_level = 3 THEN 'Division 1 Box'
            ELSE 'Division 2 Box'
        END;
        
        INSERT INTO league_boxes (league_id, level, name, max_players)
        VALUES (p_league_id, v_box_level, v_box_name, 5)
        RETURNING id INTO v_box_id;
    END LOOP;
    
    -- Update league status
    UPDATE leagues SET status = 'started' WHERE id = p_league_id;
    
    RETURN json_build_object(
        'message', 'Test league started successfully',
        'boxes_created', 4,
        'note', 'This is a test setup with 4 boxes ready for match generation'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
