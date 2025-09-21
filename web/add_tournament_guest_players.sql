-- Add Guest Player System to Support Tournaments
-- Run this in your Supabase SQL editor to add guest player functionality for tournaments

-- Create tournament_guest_players table to store guest player information
CREATE TABLE IF NOT EXISTS public.tournament_guest_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tournament_guest_players
CREATE INDEX IF NOT EXISTS idx_tournament_guest_players_tournament_id ON public.tournament_guest_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_guest_players_created_by ON public.tournament_guest_players(created_by);

-- Add RLS policies for tournament_guest_players
ALTER TABLE public.tournament_guest_players ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view guest players in tournaments they created or participate in
CREATE POLICY "Users can view guest players in their tournaments" ON public.tournament_guest_players
    FOR SELECT USING (
        created_by = auth.uid() OR
        tournament_id IN (
            SELECT tournament_id FROM public.tournament_players 
            WHERE created_by = auth.uid()
        )
    );

-- Policy: Users can create guest players in tournaments they created
CREATE POLICY "Users can create guest players in their tournaments" ON public.tournament_guest_players
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        tournament_id IN (
            SELECT id FROM public.tournaments 
            WHERE created_by = auth.uid()
        )
    );

-- Policy: Users can update guest players they created
CREATE POLICY "Users can update guest players they created" ON public.tournament_guest_players
    FOR UPDATE USING (created_by = auth.uid());

-- Policy: Users can delete guest players they created
CREATE POLICY "Users can delete guest players they created" ON public.tournament_guest_players
    FOR DELETE USING (created_by = auth.uid());

-- Update tournament_players to support guest players
ALTER TABLE public.tournament_players
ADD COLUMN IF NOT EXISTS guest_player_id UUID REFERENCES public.tournament_guest_players(id) ON DELETE CASCADE;

-- Add constraint to ensure either created_by or guest_player_id is set, but not both
ALTER TABLE public.tournament_players
ADD CONSTRAINT check_tournament_participant_type CHECK (
    (created_by IS NOT NULL AND guest_player_id IS NULL) OR
    (created_by IS NULL AND guest_player_id IS NOT NULL)
);

-- Update tournament_matches to support guest players
ALTER TABLE public.tournament_matches
ADD COLUMN IF NOT EXISTS player1_guest_id UUID REFERENCES public.tournament_guest_players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player2_guest_id UUID REFERENCES public.tournament_guest_players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player3_guest_id UUID REFERENCES public.tournament_guest_players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS player4_guest_id UUID REFERENCES public.tournament_guest_players(id) ON DELETE SET NULL;

-- Create function to add guest player to tournament
CREATE OR REPLACE FUNCTION public.add_guest_player_to_tournament(
    p_tournament_id UUID,
    p_name VARCHAR(100),
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_guest_id UUID;
    v_tournament RECORD;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user can add guests to this tournament
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
    
    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    IF v_tournament.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only tournament creator can add guest players';
    END IF;
    
    -- Check if tournament is still open for participants
    IF v_tournament.status != 'open' THEN
        RAISE EXCEPTION 'Cannot add participants to a tournament that is not open';
    END IF;
    
    -- Check if tournament has space for more players
    IF v_tournament.current_players >= v_tournament.max_players THEN
        RAISE EXCEPTION 'Tournament is full';
    END IF;
    
    -- Create guest player
    INSERT INTO public.tournament_guest_players (tournament_id, name, email, phone, created_by)
    VALUES (p_tournament_id, p_name, p_email, p_phone, auth.uid())
    RETURNING id INTO v_guest_id;
    
    -- Add guest player as participant
    INSERT INTO public.tournament_players (tournament_id, guest_player_id, status)
    VALUES (p_tournament_id, v_guest_id, 'confirmed');
    
    -- Update tournament player count
    UPDATE public.tournaments 
    SET current_players = current_players + 1
    WHERE id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'guest_player_id', v_guest_id,
        'message', 'Guest player added successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove guest player from tournament
CREATE OR REPLACE FUNCTION public.remove_guest_player_from_tournament(
    p_guest_player_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_tournament_id UUID;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Get tournament ID and verify ownership
    SELECT tournament_id INTO v_tournament_id 
    FROM public.tournament_guest_players 
    WHERE id = p_guest_player_id AND created_by = auth.uid();
    
    IF v_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Guest player not found or you do not have permission to remove them';
    END IF;
    
    -- Remove from tournament_players first
    DELETE FROM public.tournament_players 
    WHERE guest_player_id = p_guest_player_id;
    
    -- Remove guest player
    DELETE FROM public.tournament_guest_players 
    WHERE id = p_guest_player_id;
    
    -- Update tournament player count
    UPDATE public.tournaments 
    SET current_players = current_players - 1
    WHERE id = v_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Guest player removed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
