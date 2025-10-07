-- =====================================================
-- LEAGUE BOXES SCHEMA - PROMOTION/RELEGATION SYSTEM
-- =====================================================
-- This extends the leagues schema to support the box system
-- where players are grouped by skill level and can be promoted/relegated

-- =====================================================
-- 1. LEAGUE BOXES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_boxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    box_number INTEGER NOT NULL,
    box_level INTEGER NOT NULL, -- Higher number = higher skill level
    box_name VARCHAR(50), -- e.g., "Premier Box", "Championship Box"
    max_players INTEGER NOT NULL DEFAULT 5,
    current_players INTEGER DEFAULT 0 CHECK (current_players >= 0),
    
    -- Box status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique box numbers per league
    UNIQUE(league_id, box_number)
);

-- =====================================================
-- 2. LEAGUE BOX ASSIGNMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_box_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    box_id UUID NOT NULL REFERENCES public.league_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'relegated', 'withdrawn')),
    
    -- Performance tracking
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    points_won INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    
    -- Unique constraint to prevent duplicate assignments
    UNIQUE(league_id, user_id)
);

-- =====================================================
-- 3. UPDATE LEAGUE MATCHES TABLE
-- =====================================================

-- Add box_id to existing league_matches table
ALTER TABLE public.league_matches 
ADD COLUMN IF NOT EXISTS box_id UUID REFERENCES public.league_boxes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'round_robin' CHECK (match_type IN ('round_robin', 'promotion', 'relegation', 'playoff'));

-- =====================================================
-- 4. LEAGUE BOX STANDINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_box_standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    box_id UUID NOT NULL REFERENCES public.league_boxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Standings data
    position INTEGER NOT NULL,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    points_won INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    
    -- Calculated fields
    win_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN matches_played = 0 THEN 0
            ELSE (matches_won::DECIMAL / matches_played::DECIMAL) * 100
        END
    ) STORED,
    
    set_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (sets_won + sets_lost) = 0 THEN 0
            ELSE (sets_won::DECIMAL / (sets_won + sets_lost)::DECIMAL) * 100
        END
    ) STORED,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unique constraint
    UNIQUE(league_id, box_id, user_id)
);

-- =====================================================
-- 5. PROMOTION/RELEGATION HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.league_promotion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Movement details
    from_box_id UUID REFERENCES public.league_boxes(id) ON DELETE SET NULL,
    to_box_id UUID REFERENCES public.league_boxes(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('promotion', 'relegation', 'initial_assignment')),
    
    -- Performance that triggered the movement
    season_period VARCHAR(20), -- e.g., "Round 1", "Month 1"
    matches_played INTEGER,
    matches_won INTEGER,
    final_position INTEGER,
    
    -- Timestamps
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Metadata
    notes TEXT
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- League boxes indexes
CREATE INDEX IF NOT EXISTS idx_league_boxes_league_id ON public.league_boxes(league_id);
CREATE INDEX IF NOT EXISTS idx_league_boxes_box_level ON public.league_boxes(league_id, box_level);
CREATE INDEX IF NOT EXISTS idx_league_boxes_status ON public.league_boxes(status);

-- Box assignments indexes
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_league_id ON public.league_box_assignments(league_id);
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_box_id ON public.league_box_assignments(box_id);
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_user_id ON public.league_box_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_league_box_assignments_status ON public.league_box_assignments(status);

-- Box standings indexes
CREATE INDEX IF NOT EXISTS idx_league_box_standings_league_id ON public.league_box_standings(league_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_box_id ON public.league_box_standings(box_id);
CREATE INDEX IF NOT EXISTS idx_league_box_standings_position ON public.league_box_standings(league_id, box_id, position);

-- Promotion history indexes
CREATE INDEX IF NOT EXISTS idx_league_promotion_history_league_id ON public.league_promotion_history(league_id);
CREATE INDEX IF NOT EXISTS idx_league_promotion_history_user_id ON public.league_promotion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_league_promotion_history_movement_type ON public.league_promotion_history(movement_type);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.league_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_box_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_box_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_promotion_history ENABLE ROW LEVEL SECURITY;

-- League boxes policies
CREATE POLICY "Users can view league boxes" ON public.league_boxes
    FOR SELECT USING (true);

CREATE POLICY "League creators can manage boxes" ON public.league_boxes
    FOR ALL USING (auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- Box assignments policies
CREATE POLICY "Users can view box assignments" ON public.league_box_assignments
    FOR SELECT USING (true);

CREATE POLICY "League creators can manage box assignments" ON public.league_box_assignments
    FOR ALL USING (auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- Box standings policies
CREATE POLICY "Users can view box standings" ON public.league_box_standings
    FOR SELECT USING (true);

CREATE POLICY "League creators can manage standings" ON public.league_box_standings
    FOR ALL USING (auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- Promotion history policies
CREATE POLICY "Users can view promotion history" ON public.league_promotion_history
    FOR SELECT USING (true);

CREATE POLICY "League creators can manage promotion history" ON public.league_promotion_history
    FOR ALL USING (auth.uid() IN (
        SELECT created_by FROM public.leagues WHERE id = league_id
    ));

-- =====================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp for boxes
CREATE TRIGGER handle_updated_at_league_boxes
    BEFORE UPDATE ON public.league_boxes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update box player count when assignments change
CREATE OR REPLACE FUNCTION public.update_box_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.league_boxes 
        SET current_players = current_players + 1
        WHERE id = NEW.box_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE public.league_boxes 
            SET current_players = current_players + 1
            WHERE id = NEW.box_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE public.league_boxes 
            SET current_players = current_players - 1
            WHERE id = OLD.box_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE public.league_boxes 
        SET current_players = current_players - 1
        WHERE id = OLD.box_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_box_player_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.league_box_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_box_player_count();

-- =====================================================
-- 9. UTILITY FUNCTIONS FOR BOX MANAGEMENT
-- =====================================================

-- Function to get box standings
CREATE OR REPLACE FUNCTION public.get_box_standings(p_league_id UUID, p_box_id UUID)
RETURNS TABLE (
    user_id UUID,
    position INTEGER,
    matches_played INTEGER,
    matches_won INTEGER,
    matches_lost INTEGER,
    sets_won INTEGER,
    sets_lost INTEGER,
    points_won INTEGER,
    points_lost INTEGER,
    win_percentage DECIMAL(5,2),
    set_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.user_id, s.position, s.matches_played, s.matches_won, s.matches_lost,
        s.sets_won, s.sets_lost, s.points_won, s.points_lost,
        s.win_percentage, s.set_percentage
    FROM public.league_box_standings s
    WHERE s.league_id = p_league_id AND s.box_id = p_box_id
    ORDER BY s.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process promotion/relegation
CREATE OR REPLACE FUNCTION public.process_promotion_relegation(p_league_id UUID, p_box_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    box_info RECORD;
    standings RECORD;
    total_players INTEGER;
    promote_count INTEGER;
    relegate_count INTEGER;
    stay_count INTEGER;
BEGIN
    -- Get box information
    SELECT * INTO box_info FROM public.league_boxes WHERE id = p_box_id;
    
    -- Get current standings
    SELECT COUNT(*) INTO total_players 
    FROM public.league_box_standings 
    WHERE league_id = p_league_id AND box_id = p_box_id;
    
    -- Calculate promotion/relegation counts
    promote_count := GREATEST(1, total_players / 5); -- Top 20% promote
    relegate_count := GREATEST(1, total_players / 5); -- Bottom 20% relegate
    stay_count := total_players - promote_count - relegate_count;
    
    -- Process promotions (top players)
    WITH top_players AS (
        SELECT user_id, position
        FROM public.league_box_standings
        WHERE league_id = p_league_id AND box_id = p_box_id
        ORDER BY position
        LIMIT promote_count
    )
    UPDATE public.league_box_assignments
    SET status = 'promoted'
    WHERE league_id = p_league_id AND user_id IN (SELECT user_id FROM top_players);
    
    -- Process relegations (bottom players)
    WITH bottom_players AS (
        SELECT user_id, position
        FROM public.league_box_standings
        WHERE league_id = p_league_id AND box_id = p_box_id
        ORDER BY position DESC
        LIMIT relegate_count
    )
    UPDATE public.league_box_assignments
    SET status = 'relegated'
    WHERE league_id = p_league_id AND user_id IN (SELECT user_id FROM bottom_players);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get league box structure
CREATE OR REPLACE FUNCTION public.get_league_box_structure(p_league_id UUID)
RETURNS TABLE (
    box_id UUID,
    box_number INTEGER,
    box_level INTEGER,
    box_name VARCHAR(50),
    max_players INTEGER,
    current_players INTEGER,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.box_number, b.box_level, b.box_name,
        b.max_players, b.current_players, b.status
    FROM public.league_boxes b
    WHERE b.league_id = p_league_id
    ORDER BY b.box_level DESC; -- Highest level first
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
