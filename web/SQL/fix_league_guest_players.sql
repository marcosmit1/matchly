-- Fix league guest player constraint issue
-- Run this in your Supabase SQL editor

-- Check current table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'league_participants'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Make user_id nullable in league_participants if it's not already
ALTER TABLE public.league_participants
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure either user_id OR guest_player_id is set, but not both
ALTER TABLE public.league_participants
DROP CONSTRAINT IF EXISTS check_league_participant_type;

ALTER TABLE public.league_participants
ADD CONSTRAINT check_league_participant_type CHECK (
    (user_id IS NOT NULL AND guest_player_id IS NULL) OR
    (user_id IS NULL AND guest_player_id IS NOT NULL)
);

-- Update the add_guest_player_to_league function to explicitly set user_id to NULL
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

    -- Add guest player as participant with explicit NULL user_id
    INSERT INTO public.league_participants (league_id, user_id, guest_player_id, status)
    VALUES (p_league_id, NULL, v_guest_id, 'confirmed');

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