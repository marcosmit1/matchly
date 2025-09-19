-- =====================================================
-- matchly LEAGUES SCHEMA
-- =====================================================
-- This script creates the database schema for league management
-- Core concept: Create leagues, invite players, start when ready

-- =====================================================
-- 1. LEAGUES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sport VARCHAR(50) NOT NULL DEFAULT 'squash',
    max_players INTEGER NOT NULL DEFAULT 8 CHECK (max_players >= 4 AND max_players <= 32),
    current_players INTEGER DEFAULT 0 CHECK (current_players >= 0),
    start_date DATE,
    location VARCHAR(255),
    entry_fee DECIMAL(10,2) DEFAULT 0 CHECK (entry_fee >= 0),
    prize_pool DECIMAL(10,2) DEFAULT 0 CHECK (prize_pool >= 0),
    
    -- League status and management
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'full', 'started', 'completed', 'cancelled')),
    invite_code VARCHAR(8) UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
    invite_link TEXT GENERATED ALWAYS AS ('https://matchly.app/join/' || invite_code) STORED,
    
    -- Admin and metadata
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. LEAGUE PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Participant status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'withdrawn', 'disqualified')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Tournament-specific data (for when league starts)
    seed_position INTEGER,
    final_position INTEGER,
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE(league_id, user_id)
);

-- =====================================================
-- 3. LEAGUE MATCHES TABLE (for when league becomes tournament)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    
    -- Match participants
    player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Match details
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    court_number INTEGER,
    
    -- Match status and results
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Squash-specific scoring
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    sets_to_win INTEGER DEFAULT 3,
    points_to_win INTEGER DEFAULT 11,
    current_set INTEGER DEFAULT 1,
    
    -- Match metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure no player plays against themselves
    CHECK (player1_id != player2_id)
);

-- =====================================================
-- 4. LEAGUE INVITATIONS TABLE (for tracking invites)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invitation status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined', 'expired')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
    
    -- Prevent duplicate invitations
    UNIQUE(league_id, invited_email)
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Leagues indexes
CREATE INDEX IF NOT EXISTS idx_leagues_created_by ON public.leagues(created_by);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON public.leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_invite_code ON public.leagues(invite_code);
CREATE INDEX IF NOT EXISTS idx_leagues_sport ON public.leagues(sport);
CREATE INDEX IF NOT EXISTS idx_leagues_start_date ON public.leagues(start_date);

-- League participants indexes
CREATE INDEX IF NOT EXISTS idx_league_participants_league_id ON public.league_participants(league_id);
CREATE INDEX IF NOT EXISTS idx_league_participants_user_id ON public.league_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_league_participants_status ON public.league_participants(status);

-- League matches indexes
CREATE INDEX IF NOT EXISTS idx_league_matches_league_id ON public.league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_players ON public.league_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_status ON public.league_matches(status);
CREATE INDEX IF NOT EXISTS idx_league_matches_round ON public.league_matches(league_id, round_number, match_number);

-- League invitations indexes
CREATE INDEX IF NOT EXISTS idx_league_invitations_league_id ON public.league_invitations(league_id);
CREATE INDEX IF NOT EXISTS idx_league_invitations_email ON public.league_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_league_invitations_status ON public.league_invitations(status);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_invitations ENABLE ROW LEVEL SECURITY;

-- Leagues policies
CREATE POLICY "Users can view all leagues" ON public.leagues
    FOR SELECT USING (true);

CREATE POLICY "Users can create leagues" ON public.leagues
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creators can update their leagues" ON public.leagues
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "League creators can delete their leagues" ON public.leagues
    FOR DELETE USING (auth.uid() = created_by);

-- League participants policies
CREATE POLICY "Users can view league participants" ON public.league_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join leagues" ON public.league_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.league_participants
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

CREATE POLICY "Users can withdraw from leagues" ON public.league_participants
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- League matches policies
CREATE POLICY "Users can view league matches" ON public.league_matches
    FOR SELECT USING (true);

CREATE POLICY "League creators can manage matches" ON public.league_matches
    FOR ALL USING (auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- League invitations policies
CREATE POLICY "Users can view invitations they sent or received" ON public.league_invitations
    FOR SELECT USING (
        auth.uid() = invited_by OR 
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "League creators can send invitations" ON public.league_invitations
    FOR INSERT WITH CHECK (auth.uid() = invited_by AND auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

CREATE POLICY "League creators can manage invitations" ON public.league_invitations
    FOR UPDATE USING (auth.uid() = invited_by);

-- =====================================================
-- 7. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER handle_updated_at_leagues
    BEFORE UPDATE ON public.leagues
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_league_matches
    BEFORE UPDATE ON public.league_matches
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update current_players count when participants change
CREATE OR REPLACE FUNCTION public.update_league_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE public.leagues 
        SET current_players = current_players + 1,
            status = CASE 
                WHEN current_players + 1 >= max_players THEN 'full'
                ELSE status
            END
        WHERE id = NEW.league_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE public.leagues 
            SET current_players = current_players + 1,
                status = CASE 
                    WHEN current_players + 1 >= max_players THEN 'full'
                    ELSE status
                END
            WHERE id = NEW.league_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE public.leagues 
            SET current_players = current_players - 1,
                status = CASE 
                    WHEN current_players - 1 < max_players AND status = 'full' THEN 'open'
                    ELSE status
                END
            WHERE id = NEW.league_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE public.leagues 
        SET current_players = current_players - 1,
            status = CASE 
                WHEN current_players - 1 < max_players AND status = 'full' THEN 'open'
                ELSE status
            END
        WHERE id = OLD.league_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_league_player_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.league_participants
    FOR EACH ROW EXECUTE FUNCTION public.update_league_player_count();

-- =====================================================
-- 8. UTILITY FUNCTIONS FOR LEAGUE MANAGEMENT
-- =====================================================

-- Function to create a new league
CREATE OR REPLACE FUNCTION public.create_league(
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_sport VARCHAR(50) DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date DATE DEFAULT NULL,
    p_location VARCHAR(255) DEFAULT NULL,
    p_entry_fee DECIMAL(10,2) DEFAULT 0,
    p_prize_pool DECIMAL(10,2) DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    league_id UUID;
    user_id UUID;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Create the league
    INSERT INTO public.leagues (
        name, description, sport, max_players, start_date, 
        location, entry_fee, prize_pool, created_by
    ) VALUES (
        p_name, p_description, p_sport, p_max_players, p_start_date,
        p_location, p_entry_fee, p_prize_pool, user_id
    ) RETURNING id INTO league_id;
    
    -- Add creator as first participant
    INSERT INTO public.league_participants (league_id, user_id, status)
    VALUES (league_id, user_id, 'confirmed');
    
    RETURN league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a league by invite code
CREATE OR REPLACE FUNCTION public.join_league_by_code(p_invite_code VARCHAR(8))
RETURNS UUID AS $$
DECLARE
    league_id UUID;
    user_id UUID;
    participant_count INTEGER;
    max_players INTEGER;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Find league by invite code
    SELECT id, max_players INTO league_id, max_players
    FROM public.leagues 
    WHERE invite_code = p_invite_code AND status IN ('open', 'full');
    
    IF league_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;
    
    -- Check if user is already a participant
    IF EXISTS (SELECT 1 FROM public.league_participants WHERE league_id = league_id AND user_id = user_id) THEN
        RAISE EXCEPTION 'You are already a participant in this league';
    END IF;
    
    -- Check if league is full
    SELECT COUNT(*) INTO participant_count
    FROM public.league_participants 
    WHERE league_id = league_id AND status = 'confirmed';
    
    IF participant_count >= max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;
    
    -- Add user as participant
    INSERT INTO public.league_participants (league_id, user_id, status)
    VALUES (league_id, user_id, 'confirmed');
    
    RETURN league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a league (convert to tournament)
CREATE OR REPLACE FUNCTION public.start_league(p_league_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    participant_count INTEGER;
    min_players INTEGER := 4;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user is the league creator
    IF NOT EXISTS (
        SELECT 1 FROM public.leagues 
        WHERE id = p_league_id AND created_by = user_id
    ) THEN
        RAISE EXCEPTION 'Only the league creator can start the league';
    END IF;
    
    -- Check if league is in valid state
    IF NOT EXISTS (
        SELECT 1 FROM public.leagues 
        WHERE id = p_league_id AND status IN ('open', 'full')
    ) THEN
        RAISE EXCEPTION 'League cannot be started in its current state';
    END IF;
    
    -- Check minimum participant count
    SELECT COUNT(*) INTO participant_count
    FROM public.league_participants 
    WHERE league_id = p_league_id AND status = 'confirmed';
    
    IF participant_count < min_players THEN
        RAISE EXCEPTION 'League needs at least % players to start', min_players;
    END IF;
    
    -- Update league status
    UPDATE public.leagues 
    SET status = 'started', started_at = timezone('utc'::text, now())
    WHERE id = p_league_id;
    
    -- TODO: Generate tournament bracket and matches
    -- This will be implemented in the next phase
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get league details with participant count
CREATE OR REPLACE FUNCTION public.get_league_details(p_league_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    sport VARCHAR(50),
    max_players INTEGER,
    current_players INTEGER,
    start_date DATE,
    location VARCHAR(255),
    entry_fee DECIMAL(10,2),
    prize_pool DECIMAL(10,2),
    status VARCHAR(20),
    invite_code VARCHAR(8),
    invite_link TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id, l.name, l.description, l.sport, l.max_players, l.current_players,
        l.start_date, l.location, l.entry_fee, l.prize_pool, l.status,
        l.invite_code, l.invite_link, l.created_by, l.created_at, l.started_at
    FROM public.leagues l
    WHERE l.id = p_league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment the following lines to add sample data for testing

/*
-- Sample league (requires a user to exist)
INSERT INTO public.leagues (
    name, description, sport, max_players, start_date, location, entry_fee, prize_pool, created_by
) VALUES (
    'Spring Squash Championship',
    'A competitive squash league for all skill levels. Join us for exciting matches and great prizes!',
    'squash',
    16,
    '2024-03-15',
    'City Sports Center',
    25.00,
    200.00,
    (SELECT id FROM auth.users LIMIT 1)
);
*/

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
