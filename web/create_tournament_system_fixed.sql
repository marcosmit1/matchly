-- Create Tournament System (Fixed)
-- Run this in your Supabase SQL editor to add tournament functionality

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sport VARCHAR(50) DEFAULT 'padel',
    max_players INTEGER DEFAULT 8,
    current_players INTEGER DEFAULT 0,
    start_date DATE,
    location VARCHAR(255),
    number_of_courts INTEGER DEFAULT 2,
    tournament_type VARCHAR(20) DEFAULT 'mexicano' CHECK (tournament_type IN ('mexicano', 'americano')),
    points_to_win INTEGER DEFAULT 21,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'started', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_players table
CREATE TABLE IF NOT EXISTS public.tournament_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_rounds table
CREATE TABLE IF NOT EXISTS public.tournament_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, round_number)
);

-- Create tournament_matches table (after tournament_rounds exists)
CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
    court_number INTEGER NOT NULL,
    player1_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    player3_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    player4_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    player3_score INTEGER DEFAULT 0,
    player4_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_rankings table
CREATE TABLE IF NOT EXISTS public.tournament_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON public.tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON public.tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament_id ON public.tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round_id ON public.tournament_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rankings_tournament_id ON public.tournament_rankings(tournament_id);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Users can view tournaments they created or participate in" ON public.tournaments
    FOR SELECT USING (
        created_by = auth.uid() OR
        id IN (
            SELECT tournament_id FROM public.tournament_players 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create tournaments" ON public.tournaments
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update tournaments they created" ON public.tournaments
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete tournaments they created" ON public.tournaments
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for tournament_players
CREATE POLICY "Users can view tournament players" ON public.tournament_players
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid() OR id IN (
                SELECT tournament_id FROM public.tournament_players 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add players to their tournaments" ON public.tournament_players
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update players in their tournaments" ON public.tournament_players
    FOR UPDATE USING (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete players from their tournaments" ON public.tournament_players
    FOR DELETE USING (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- RLS Policies for tournament_rounds
CREATE POLICY "Users can view tournament rounds" ON public.tournament_rounds
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid() OR id IN (
                SELECT tournament_id FROM public.tournament_players 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage rounds in their tournaments" ON public.tournament_rounds
    FOR ALL USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- RLS Policies for tournament_matches
CREATE POLICY "Users can view tournament matches" ON public.tournament_matches
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid() OR id IN (
                SELECT tournament_id FROM public.tournament_players 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage matches in their tournaments" ON public.tournament_matches
    FOR ALL USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- RLS Policies for tournament_rankings
CREATE POLICY "Users can view tournament rankings" ON public.tournament_rankings
    FOR SELECT USING (
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid() OR id IN (
                SELECT tournament_id FROM public.tournament_players 
                WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage rankings in their tournaments" ON public.tournament_rankings
    FOR ALL USING (
        tournament_id IN (
            SELECT id FROM public.tournaments WHERE created_by = auth.uid()
        )
    );

-- Create function to start tournament
CREATE OR REPLACE FUNCTION public.start_tournament(p_tournament_id UUID)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_player_count INTEGER;
    v_round_id UUID;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
    
    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    IF v_tournament.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only tournament creator can start the tournament';
    END IF;
    
    IF v_tournament.status != 'open' THEN
        RAISE EXCEPTION 'Tournament is not open for starting';
    END IF;
    
    -- Count players
    SELECT COUNT(*) INTO v_player_count
    FROM public.tournament_players
    WHERE tournament_id = p_tournament_id;
    
    IF v_player_count < 4 THEN
        RAISE EXCEPTION 'Tournament needs at least 4 players to start';
    END IF;
    
    -- Create first round
    INSERT INTO public.tournament_rounds (tournament_id, round_number, status)
    VALUES (p_tournament_id, 1, 'active')
    RETURNING id INTO v_round_id;
    
    -- Update tournament status
    UPDATE public.tournaments
    SET status = 'started', updated_at = NOW()
    WHERE id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'round_id', v_round_id,
        'message', 'Tournament started successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate matches for a round
CREATE OR REPLACE FUNCTION public.generate_round_matches(
    p_tournament_id UUID,
    p_round_number INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_round_id UUID;
    v_players RECORD[];
    v_courts INTEGER;
    v_matches_generated INTEGER := 0;
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
    
    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    -- Get round ID
    SELECT id INTO v_round_id 
    FROM public.tournament_rounds 
    WHERE tournament_id = p_tournament_id AND round_number = p_round_number;
    
    IF v_round_id IS NULL THEN
        RAISE EXCEPTION 'Round not found';
    END IF;
    
    -- Get all players
    SELECT ARRAY_AGG(tp.*) INTO v_players
    FROM public.tournament_players tp
    WHERE tp.tournament_id = p_tournament_id
    ORDER BY RANDOM();
    
    v_courts := v_tournament.number_of_courts;
    
    -- Generate matches based on tournament type
    IF v_tournament.tournament_type = 'mexicano' THEN
        -- Mexicano: Generate matches based on current rankings
        -- For now, simple random pairing
        FOR i IN 1..LEAST(v_courts, FLOOR(array_length(v_players, 1) / 4)) LOOP
            INSERT INTO public.tournament_matches (
                tournament_id, round_id, court_number,
                player1_id, player2_id, player3_id, player4_id
            ) VALUES (
                p_tournament_id, v_round_id, i,
                v_players[(i-1)*4 + 1].id,
                v_players[(i-1)*4 + 2].id,
                v_players[(i-1)*4 + 3].id,
                v_players[(i-1)*4 + 4].id
            );
            v_matches_generated := v_matches_generated + 1;
        END LOOP;
    ELSE
        -- Americano: Round-robin format
        -- For now, simple random pairing
        FOR i IN 1..LEAST(v_courts, FLOOR(array_length(v_players, 1) / 4)) LOOP
            INSERT INTO public.tournament_matches (
                tournament_id, round_id, court_number,
                player1_id, player2_id, player3_id, player4_id
            ) VALUES (
                p_tournament_id, v_round_id, i,
                v_players[(i-1)*4 + 1].id,
                v_players[(i-1)*4 + 2].id,
                v_players[(i-1)*4 + 3].id,
                v_players[(i-1)*4 + 4].id
            );
            v_matches_generated := v_matches_generated + 1;
        END LOOP;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'matches_generated', v_matches_generated,
        'message', 'Matches generated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('tournaments', 'tournament_players', 'tournament_rounds', 'tournament_matches', 'tournament_rankings')
ORDER BY table_name, column_name;
