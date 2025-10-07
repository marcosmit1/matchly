-- Add Guest Player System to Support Tournaments
-- Run this in your Supabase SQL editor to add guest player functionality

-- Create guest_players table to store guest player information
CREATE TABLE IF NOT EXISTS public.guest_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for guest_players
CREATE INDEX IF NOT EXISTS idx_guest_players_league_id ON public.guest_players(league_id);
CREATE INDEX IF NOT EXISTS idx_guest_players_created_by ON public.guest_players(created_by);

-- Add RLS policies for guest_players
ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view guest players in leagues they created or participate in
CREATE POLICY "Users can view guest players in their leagues" ON public.guest_players
    FOR SELECT USING (
        created_by = auth.uid() OR
        league_id IN (
            SELECT league_id FROM public.league_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create guest players in leagues they created
CREATE POLICY "Users can create guest players in their leagues" ON public.guest_players
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        league_id IN (
            SELECT id FROM public.leagues 
            WHERE created_by = auth.uid()
        )
    );

-- Policy: Users can update guest players they created
CREATE POLICY "Users can update guest players they created" ON public.guest_players
    FOR UPDATE USING (created_by = auth.uid());

-- Policy: Users can delete guest players they created
CREATE POLICY "Users can delete guest players they created" ON public.guest_players
    FOR DELETE USING (created_by = auth.uid());

-- Update league_participants to support guest players
ALTER TABLE public.league_participants
ADD COLUMN IF NOT EXISTS guest_player_id UUID REFERENCES public.guest_players(id) ON DELETE CASCADE;

-- Add constraint to ensure either user_id or guest_player_id is set, but not both
ALTER TABLE public.league_participants
ADD CONSTRAINT check_participant_type CHECK (
    (user_id IS NOT NULL AND guest_player_id IS NULL) OR
    (user_id IS NULL AND guest_player_id IS NOT NULL)
);

-- Update league_matches to support guest players
ALTER TABLE public.league_matches
ADD COLUMN IF NOT EXISTS player1_guest_id UUID REFERENCES public.guest_players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player2_guest_id UUID REFERENCES public.guest_players(id) ON DELETE SET NULL;

-- Add constraint to ensure either user_id or guest_id is set for players
ALTER TABLE public.league_matches
ADD CONSTRAINT check_player1_type CHECK (
    (player1_id IS NOT NULL AND player1_guest_id IS NULL) OR
    (player1_id IS NULL AND player1_guest_id IS NOT NULL)
);

ALTER TABLE public.league_matches
ADD CONSTRAINT check_player2_type CHECK (
    (player2_id IS NOT NULL AND player2_guest_id IS NULL) OR
    (player2_id IS NULL AND player2_guest_id IS NOT NULL)
);

-- Update league_matches_test to support guest players (for testing)
ALTER TABLE public.league_matches_test
ADD COLUMN IF NOT EXISTS player1_guest_id UUID,
ADD COLUMN IF NOT EXISTS player2_guest_id UUID;

-- Create function to add guest player to league
CREATE OR REPLACE FUNCTION public.add_guest_player_to_league(
    p_league_id UUID,
    p_name VARCHAR(100),
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_guest_id UUID;
    v_league RECORD;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user can add guests to this league
    SELECT * INTO v_league FROM public.leagues WHERE id = p_league_id;
    
    IF v_league IS NULL THEN
        RAISE EXCEPTION 'League not found';
    END IF;
    
    IF v_league.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only league creator can add guest players';
    END IF;
    
    -- Check if league is still open for participants
    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'Cannot add participants to a league that is not open';
    END IF;
    
    -- Check if league has space for more players
    IF v_league.current_players >= v_league.max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;
    
    -- Create guest player
    INSERT INTO public.guest_players (league_id, name, email, phone, created_by)
    VALUES (p_league_id, p_name, p_email, p_phone, auth.uid())
    RETURNING id INTO v_guest_id;
    
    -- Add guest player as participant
    INSERT INTO public.league_participants (league_id, guest_player_id, status)
    VALUES (p_league_id, v_guest_id, 'confirmed');
    
    -- Update league player count
    UPDATE public.leagues 
    SET current_players = current_players + 1
    WHERE id = p_league_id;
    
    RETURN json_build_object(
        'success', true,
        'guest_player_id', v_guest_id,
        'message', 'Guest player added successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove guest player from league
CREATE OR REPLACE FUNCTION public.remove_guest_player_from_league(
    p_guest_player_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_league_id UUID;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Get league ID from guest player
    SELECT league_id INTO v_league_id 
    FROM public.guest_players 
    WHERE id = p_guest_player_id;
    
    IF v_league_id IS NULL THEN
        RAISE EXCEPTION 'Guest player not found';
    END IF;
    
    -- Check if user can remove guests from this league
    IF NOT EXISTS (
        SELECT 1 FROM public.leagues 
        WHERE id = v_league_id AND created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only league creator can remove guest players';
    END IF;
    
    -- Remove guest player (this will cascade to league_participants)
    DELETE FROM public.guest_players WHERE id = p_guest_player_id;
    
    -- Update league player count
    UPDATE public.leagues 
    SET current_players = current_players - 1
    WHERE id = v_league_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Guest player removed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get league participants (including guests)
CREATE OR REPLACE FUNCTION public.get_league_participants_with_guests(p_league_id UUID)
RETURNS TABLE (
    participant_id UUID,
    user_id UUID,
    guest_player_id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,
    is_guest BOOLEAN,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.id as participant_id,
        lp.user_id,
        lp.guest_player_id,
        CASE 
            WHEN lp.user_id IS NOT NULL THEN COALESCE(u.username, u.email)
            WHEN lp.guest_player_id IS NOT NULL THEN gp.name
        END as name,
        CASE 
            WHEN lp.user_id IS NOT NULL THEN u.email
            WHEN lp.guest_player_id IS NOT NULL THEN gp.email
        END as email,
        CASE 
            WHEN lp.user_id IS NOT NULL THEN NULL
            WHEN lp.guest_player_id IS NOT NULL THEN gp.phone
        END as phone,
        lp.status,
        (lp.guest_player_id IS NOT NULL) as is_guest,
        lp.joined_at
    FROM public.league_participants lp
    LEFT JOIN auth.users u ON lp.user_id = u.id
    LEFT JOIN public.guest_players gp ON lp.guest_player_id = gp.id
    WHERE lp.league_id = p_league_id
    ORDER BY lp.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('guest_players', 'league_participants', 'league_matches')
  AND column_name LIKE '%guest%'
ORDER BY table_name, column_name;
